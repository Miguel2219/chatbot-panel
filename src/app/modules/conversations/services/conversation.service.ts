import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {ConversationResponseDto} from '../interfaces/conversation.interface';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private _http: HttpService) {}

  getConversations(params: HttpParams): Observable<Page<ConversationResponseDto>> {
    const options = this._http.addParams(params);
    return this._http.get<Page<ConversationResponseDto>>(EndPoints.CONVERSATIONS, false, options);
  }

  getConversationsBySession(sessionId: string): Observable<ConversationResponseDto[]> {
    return this._http.get<ConversationResponseDto[]>(EndPoints.CONVERSATIONS_SESSION + sessionId);
  }
}
