import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {
  RegisterBotDto,
  ResponseBotDto,
  ResponseBotSelectDto,
  SystemPromptDto,
  UpdateBotDto,
} from '../interfaces/bot.interface';
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

  public getBotsByTenantId(tenantId: string): Observable<Select[]> {
    return new Observable<Select[]>((observer) => {
      this._http.get<ResponseBotSelectDto[]>(EndPoints.BOTS_BY_TENANT_SELECT + tenantId).subscribe({
        next: (data: ResponseBotSelectDto[]) => {
          const items: Select[] = data.map((item: ResponseBotSelectDto): Select => ({
            label: item.name,
            value: item.bot_id,
          }));
          observer.next(items);
          observer.complete();
        },
      });
    });
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

  updateBot(botId: string, data: UpdateBotDto): Observable<ResponseBotDto> {
    return this._http.put<UpdateBotDto, ResponseBotDto>(EndPoints.BOT + botId, data);
  }

  getSystemPrompt(botId: string): Observable<SystemPromptDto> {
    return this._http.get<SystemPromptDto>(EndPoints.BOT + botId + '/system-prompt');
  }

  updateSystemPrompt(botId: string, data: SystemPromptDto): Observable<SystemPromptDto> {
    return this._http.put<SystemPromptDto, SystemPromptDto>(
      EndPoints.BOT + botId + '/system-prompt',
      data,
    );
  }
}
