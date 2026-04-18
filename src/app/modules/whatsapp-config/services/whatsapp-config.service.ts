import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import { CreateWhatsappConfigRequest, WhatsappConfigResponseDto } from '../interfaces/whatsapp-config.interface';

@Injectable({ providedIn: 'root' })
export class WhatsappConfigService {
  constructor(private _http: HttpService) {}

  getConfigByBot(botId: string): Observable<WhatsappConfigResponseDto> {
    return this._http.get<WhatsappConfigResponseDto>(EndPoints.WHATSAPP_CONFIG + botId);
  }

  createConfig(botId: string, data: CreateWhatsappConfigRequest): Observable<WhatsappConfigResponseDto> {
    return this._http.post<CreateWhatsappConfigRequest, WhatsappConfigResponseDto>(
      EndPoints.WHATSAPP_CONFIG + botId,
      data
    );
  }

  updateConfig(configId: string, data: CreateWhatsappConfigRequest): Observable<WhatsappConfigResponseDto> {
    return this._http.put<CreateWhatsappConfigRequest, WhatsappConfigResponseDto>(
      EndPoints.WHATSAPP_CONFIG + configId,
      data
    );
  }

  deleteConfig(configId: string): Observable<WhatsappConfigResponseDto> {
    return this._http.delete<WhatsappConfigResponseDto>(EndPoints.WHATSAPP_CONFIG + configId);
  }
}
