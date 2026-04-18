import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import { LeadResponseDto, LeadStatus } from '../interfaces/lead.interface';

@Injectable({ providedIn: 'root' })
export class LeadService {
  constructor(private _http: HttpService) {}

  getLeadsByBot(botId: string): Observable<LeadResponseDto[]> {
    return this._http.get<LeadResponseDto[]>(EndPoints.LEADS_BY_BOT + botId);
  }

  updateLeadStatus(leadId: string, status: LeadStatus): Observable<void> {
    return this._http.put<LeadStatus, void>(EndPoints.LEAD_STATUS + leadId, status);
  }
}
