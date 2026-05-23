import {Injectable, NgZone} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {Page} from '../../../core/interfaces/page.interface';
import {environment} from '../../../../environments/environment';
import {
  ConversationThreadResponseDto,
  ConversationThreadSummaryDto,
  MessageResponseDto,
} from '../../conversations/interfaces/conversation.interface';
import {InboxEvent, InboxEventType} from '../interfaces/inbox.interface';

/**
 * Servicio del modulo Inbox. Encapsula los endpoints REST de Fase 2
 * (claim/resolve/reply + listados) y la suscripcion SSE al stream del
 * tenant con reconnect manual con backoff exponencial.
 */
@Injectable({ providedIn: 'root' })
export class InboxService {

  private static readonly RECONNECT_INITIAL_DELAY_MS = 2_000;
  private static readonly RECONNECT_MAX_DELAY_MS = 30_000;

  constructor(
    private _http: HttpService,
    private _zone: NgZone,
  ) {}

  /** Pendientes del tenant (todos los bots si no se pasa botId). */
  getPending(params: HttpParams = new HttpParams()): Observable<Page<ConversationThreadSummaryDto>> {
    return this._http.get<Page<ConversationThreadSummaryDto>>(
      EndPoints.INBOX_PENDING, false, this._http.addParams(params),
    );
  }

  /** Asignadas al asesor autenticado (HUMAN_ACTIVE). */
  getMine(params: HttpParams = new HttpParams()): Observable<Page<ConversationThreadSummaryDto>> {
    return this._http.get<Page<ConversationThreadSummaryDto>>(
      EndPoints.INBOX_MINE, false, this._http.addParams(params),
    );
  }

  /** Detalle completo de un thread por id. */
  getConversation(id: string): Observable<ConversationThreadResponseDto> {
    return this._http.get<ConversationThreadResponseDto>(`${EndPoints.CONVERSATIONS}/${id}`);
  }

  /** Mensajes en orden cronologico. */
  getMessages(id: string): Observable<MessageResponseDto[]> {
    return this._http.get<MessageResponseDto[]>(`${EndPoints.CONVERSATIONS}/${id}/messages`);
  }

  /** Toma la conversacion (PENDING_HUMAN -> HUMAN_ACTIVE). 204 sin body. */
  claim(id: string): Observable<void> {
    return this._http.post<unknown, void>(`${EndPoints.INBOX_BASE}/${id}/claim`, {});
  }

  /** Cierra la conversacion (HUMAN_ACTIVE -> RESOLVED). 204. */
  resolve(id: string): Observable<void> {
    return this._http.post<unknown, void>(`${EndPoints.INBOX_BASE}/${id}/resolve`, {});
  }

  /** Asesor responde a la conversacion. */
  reply(id: string, text: string): Observable<MessageResponseDto> {
    return this._http.post<{ text: string }, MessageResponseDto>(
      `${EndPoints.INBOX_BASE}/${id}/messages`,
      { text },
    );
  }

  /**
   * Marca la conversacion como leida (setea {@code last_read_at = now()} en
   * el backend). El proximo summary va a venir con {@code unread_count = 0}
   * hasta que el cliente mande un mensaje nuevo. 204 sin body.
   */
  markRead(id: string): Observable<void> {
    return this._http.post<unknown, void>(`${EndPoints.INBOX_BASE}/${id}/read`, {});
  }

  /**
   * Stream SSE de eventos del inbox. Cada evento es de tipo {@link InboxEvent}
   * con un {@code ConversationThreadSummaryDto} en el payload.
   *
   * <p>EventSource no acepta headers, asi que mandamos el JWT via query string.
   * El backend valida que la conexion pertenezca al tenant del usuario y
   * filtra los eventos antes de mandarlos. El reconnect tiene backoff
   * exponencial 2^n s (cap 30s) y se reinicia al recibir un evento valido.
   */
  streamEvents(token: string): Observable<InboxEvent> {
    return new Observable<InboxEvent>(subscriber => {
      let source: EventSource | null = null;
      let reconnectDelay = InboxService.RECONNECT_INITIAL_DELAY_MS;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let closedByCaller = false;

      const url = `${environment.api}${EndPoints.INBOX_STREAM}?access_token=${encodeURIComponent(token)}`;

      const eventTypes: InboxEventType[] = ['ESCALATED', 'MESSAGE', 'CLAIMED', 'RESOLVED'];

      const connect = () => {
        source = new EventSource(url, { withCredentials: true });

        const onTyped = (type: InboxEventType) => (rawEvent: MessageEvent) => {
          reconnectDelay = InboxService.RECONNECT_INITIAL_DELAY_MS;
          try {
            const payload = JSON.parse(rawEvent.data);
            this._zone.run(() => subscriber.next({ type, payload }));
          } catch {
            // payload invalido — ignoramos, no rompemos el stream
          }
        };

        for (const t of eventTypes) {
          source.addEventListener(t, onTyped(t) as EventListener);
        }

        source.onerror = () => {
          if (closedByCaller) return;
          source?.close();
          source = null;
          reconnectTimer = setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, InboxService.RECONNECT_MAX_DELAY_MS);
        };
      };

      connect();

      return () => {
        closedByCaller = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        source?.close();
      };
    });
  }
}
