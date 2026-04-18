import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import {RegisterBotDto, ResponseBotDto, ResponseBotSelectDto} from '../interfaces/bot.interface';
import {Page} from '../../../core/interfaces/page.interface';
import {HttpParams} from '@angular/common/http';
import {Select} from '../../../core/interfaces/select.interface';

@Injectable({ providedIn: 'root' })
export class BotService {
  constructor(private _http: HttpService) {}

  getBotsByTenant(params: HttpParams): Observable<Page<ResponseBotDto>> {
    const defaultOptions = this._http.addParams(params)
    return this._http.get<Page<ResponseBotDto>>(EndPoints.BOTS_BY_TENANT, false, defaultOptions);
  }

  public getBotsByTenantSelect(): Observable<Select[]> {
    return new Observable<Select[]>((observer) => {
      this._http.get<ResponseBotSelectDto[]>(EndPoints.BOTS_BY_TENANT_SELECT).subscribe({
        next: (data: ResponseBotSelectDto[]) => {
          const selectLeaders: Select[] = data.map((item: ResponseBotSelectDto): Select => {
            return {
              label: item.name,
              value: item.bot_id
            };
          });
          observer.next(selectLeaders);
          observer.complete();
        }
      })
    })
  }

  getBotById(botId: string): Observable<ResponseBotDto> {
    return this._http.get<ResponseBotDto>(EndPoints.BOT + botId);
  }

  createBot(data: RegisterBotDto): Observable<ResponseBotDto> {
    return this._http.post<RegisterBotDto, ResponseBotDto>(EndPoints.BOT, data);
  }

  deleteBot(botId: string): Observable<void> {
    return this._http.delete<void>(EndPoints.BOT + botId);
  }
}
