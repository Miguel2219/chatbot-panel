import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {
  ConversationThreadResponseDto,
  ConversationThreadSummaryDto,
  MessageResponseDto,
} from '../interfaces/conversation.interface';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private _http: HttpService) {}

  /**
   * Listado paginado de threads en formato slim. El backend aplica scope
   * segun rol (ADMIN cross-tenant, TENANT_OWNER su tenant, USER solo las
   * suyas).
   */
  getConversations(params: HttpParams): Observable<Page<ConversationThreadSummaryDto>> {
    const options = this._http.addParams(params);
    return this._http.get<Page<ConversationThreadSummaryDto>>(EndPoints.CONVERSATIONS, false, options);
  }

  /** Detalle completo de un thread por id. */
  getConversationById(id: string): Observable<ConversationThreadResponseDto> {
    return this._http.get<ConversationThreadResponseDto>(`${EndPoints.CONVERSATIONS}/${id}`);
  }

  /** Mensajes de un thread (drill-in del chat). */
  getMessagesByConversation(id: string): Observable<MessageResponseDto[]> {
    return this._http.get<MessageResponseDto[]>(`${EndPoints.CONVERSATIONS}/${id}/messages`);
  }
}
