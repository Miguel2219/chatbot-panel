import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, combineLatest, Subject, Subscription} from 'rxjs';
import {AuthService} from './auth.service';
import {StorageService} from './storage.service';
import {BrowserNotificationService} from './browser-notification.service';
import {InboxService} from '../../modules/inbox/services/inbox.service';
import {InboxEvent} from '../../modules/inbox/interfaces/inbox.interface';

/**
 * Bus global del Inbox. Se inicializa post-login y mantiene viva la
 * suscripcion SSE para que TODA la app (incluso fuera del modulo /inbox)
 * reciba notificaciones de pendientes nuevas + badges live + sonido.
 *
 * <ul>
 *   <li>{@link pendingCount$}: contador en vivo de PENDING_HUMAN del tenant
 *       (+1 en ESCALATED, -1 en CLAIMED/RESOLVED).</li>
 *   <li>{@link mineCount$}: contador en vivo de HUMAN_ACTIVE asignadas al
 *       usuario actual (+1 en CLAIMED por mi, -1 en RESOLVED de las mias).</li>
 *   <li>{@link unreadMineTotal$}: suma de {@code unread_count} en mias.
 *       Se incrementa en cada MESSAGE para el usuario y se refresca contra
 *       el backend cuando el component marca leida una conv.</li>
 *   <li>{@link events$}: stream crudo para componentes que quieran reaccionar
 *       (e.g. el InboxComponent para upsert/remove en sus listas).</li>
 * </ul>
 *
 * <p>El bus tambien dispara <b>sonido + notificacion del SO</b> directamente
 * desde el stream — asi el asesor recibe alertas aunque no este en el modulo
 * Inbox (B2). Mantenemos un solo punto de notificacion para no duplicar.
 *
 * <p>Tambien actualiza el {@code document.title} con el contador combinado
 * {@code (pending + unreadEnMias) Inbox - Zolvion} (M2).
 */
@Injectable({ providedIn: 'root' })
export class InboxBusService implements OnDestroy {

  private static readonly BASE_TITLE = 'Inbox - Zolvion';

  readonly pendingCount$ = new BehaviorSubject<number>(0);
  readonly mineCount$ = new BehaviorSubject<number>(0);
  readonly unreadMineTotal$ = new BehaviorSubject<number>(0);
  readonly events$ = new Subject<InboxEvent>();

  private streamSub: Subscription | null = null;
  private titleSub: Subscription | null = null;
  private inFlight = false;
  private currentUserId: string | null = null;

  constructor(
    private _auth: AuthService,
    private _storage: StorageService,
    private _inbox: InboxService,
    private _notif: BrowserNotificationService,
  ) {}

  /**
   * Arranca el stream SSE si hay sesion + permiso. Idempotente: si ya esta
   * activo, no hace nada. Llamar al boot del shell autenticado.
   */
  start(): void {
    if (this.inFlight || this.streamSub) return;
    if (!this._auth.isLoggedIn()) return;
    if (this._auth.isAdmin()) return; // ADMIN no opera handoff (backend devuelve 403)
    if (!this._auth.hasPermission('inbox', 'view')) return;

    const token = this._storage.getToken();
    if (!token) return;

    this.currentUserId = this._auth.getUser()?.user_id ?? null;
    this.inFlight = true;

    // Refrescos iniciales — el stream solo trae deltas.
    this.refreshPendingCount();
    this.refreshMineCount();
    this.refreshUnreadMineTotal();

    this.streamSub = this._inbox.streamEvents(token).subscribe({
      next: (event) => {
        // Primero notificacion (audio + SO) para que dispare aun si no hay
        // componentes suscritos a events$.
        this.handleNotification(event);
        this.events$.next(event);
        this.applyEventToCounters(event);
      },
    });

    // Combinar pending + unread → document.title. combineLatest emite cada
    // vez que cambia cualquiera de los dos contadores.
    this.titleSub = combineLatest([this.pendingCount$, this.unreadMineTotal$])
      .subscribe(([p, u]) => {
        const total = p + u;
        document.title = total > 0
          ? `(${total}) ${InboxBusService.BASE_TITLE}`
          : InboxBusService.BASE_TITLE;
      });
  }

  stop(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.titleSub?.unsubscribe();
    this.titleSub = null;
    this.inFlight = false;
    this.pendingCount$.next(0);
    this.mineCount$.next(0);
    this.unreadMineTotal$.next(0);
    document.title = InboxBusService.BASE_TITLE;
  }

  /** Refetch del count de pendientes (post-reconnect o post-claim). */
  refreshPendingCount(): void {
    this._inbox.getPending().subscribe({
      next: (page) => this.pendingCount$.next(page.totalElements ?? 0),
    });
  }

  /** Refetch del count de mias. */
  refreshMineCount(): void {
    this._inbox.getMine().subscribe({
      next: (page) => this.mineCount$.next(page.totalElements ?? 0),
    });
  }

  /**
   * Refetch del total de mensajes sin-leer en mias. Llamar tras un markRead
   * (cuando el asesor abre una conv) para reflejar el reset en el title.
   */
  refreshUnreadMineTotal(): void {
    this._inbox.getMine().subscribe({
      next: (page) => {
        const total = (page.content ?? [])
          .reduce((acc, c) => acc + (c.unread_count ?? 0), 0);
        this.unreadMineTotal$.next(total);
      },
    });
  }

  /**
   * Dispara sonido + notificacion del SO para los eventos relevantes. Vive
   * en el bus (no en el InboxComponent) para que las alertas suenen aunque
   * el asesor este en otro modulo del panel.
   */
  private handleNotification(event: InboxEvent): void {
    const s = event.payload;
    switch (event.type) {
      case 'ESCALATED':
        this._notif.playBeep('pending');
        this._notif.notifyIfHidden(
          'Nueva conversación pendiente',
          s.customer_name ?? s.session_id,
          s.conversation_id,
        );
        break;
      case 'MESSAGE':
        // Backend ya filtra MESSAGE: solo llega al asesor asignado en HUMAN_ACTIVE.
        if (s.status === 'HUMAN_ACTIVE') {
          this._notif.playBeep('message');
          this._notif.notifyIfHidden(
            'Nuevo mensaje del cliente',
            s.customer_name ?? s.session_id,
            s.conversation_id,
          );
        }
        break;
    }
  }

  /**
   * Actualiza pending/mine/unreadMine en base al evento. Mias se incrementa/
   * decrementa solo si el {@code assigned_adviser_id} es el usuario actual —
   * la SSE de CLAIMED/RESOLVED es broadcast a todo el tenant, asi que cada
   * cliente filtra localmente.
   */
  private applyEventToCounters(event: InboxEvent): void {
    const s = event.payload;
    const isMine = !!this.currentUserId
      && s.assigned_adviser_id === this.currentUserId;

    switch (event.type) {
      case 'ESCALATED': {
        this.pendingCount$.next(this.pendingCount$.value + 1);
        break;
      }
      case 'CLAIMED': {
        if (this.pendingCount$.value > 0) {
          this.pendingCount$.next(this.pendingCount$.value - 1);
        }
        if (isMine) {
          this.mineCount$.next(this.mineCount$.value + 1);
        }
        break;
      }
      case 'RESOLVED': {
        if (this.pendingCount$.value > 0) {
          this.pendingCount$.next(this.pendingCount$.value - 1);
        }
        if (isMine && this.mineCount$.value > 0) {
          this.mineCount$.next(this.mineCount$.value - 1);
          // Si la conv resuelta tenia unread, conviene refrescar el total
          // para no quedar con un saldo erroneo en el title.
          this.refreshUnreadMineTotal();
        }
        break;
      }
      case 'MESSAGE': {
        if (s.status === 'HUMAN_ACTIVE' && isMine) {
          this.unreadMineTotal$.next(this.unreadMineTotal$.value + 1);
        }
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
