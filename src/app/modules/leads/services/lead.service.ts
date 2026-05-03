import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {LeadResponseDto, LeadStatus} from '../interfaces/lead.interface';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class LeadService {
  constructor(private _http: HttpService) {}

  getLeads(params: HttpParams): Observable<Page<LeadResponseDto>> {
    const options = this._http.addParams(params);
    return this._http.get<Page<LeadResponseDto>>(EndPoints.LEADS, false, options);
  }

  updateLeadStatus(leadId: string, status: LeadStatus): Observable<void> {
    return this._http.put<LeadStatus, void>(EndPoints.LEAD_STATUS + leadId, status);
  }
}
