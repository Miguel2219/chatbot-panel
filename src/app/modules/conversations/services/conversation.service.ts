import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import { ConversationResponseDto } from '../interfaces/conversation.interface';
import {Page} from '../../../core/interfaces/page.interface';
import {HttpParams} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private _http: HttpService) {}

  getConversationsByBot(botId: string, params: HttpParams): Observable<Page<ConversationResponseDto>> {
    const defaultOptions = this._http.addParams(params)
    return this._http.get<Page<ConversationResponseDto>>(EndPoints.CONVERSATIONS_BOT + botId, false, defaultOptions);
  }

  getConversationsBySession(sessionId: string): Observable<ConversationResponseDto[]> {
    return this._http.get<ConversationResponseDto[]>(EndPoints.CONVERSATIONS_SESSION + sessionId);
  }
}
