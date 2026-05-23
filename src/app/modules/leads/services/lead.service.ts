import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {LeadResponseDto} from '../interfaces/lead.interface';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class LeadService {
  constructor(private _http: HttpService) {}

  getLeads(params: HttpParams): Observable<Page<LeadResponseDto>> {
    const options = this._http.addParams(params);
    return this._http.get<Page<LeadResponseDto>>(EndPoints.LEADS, false, options);
  }
}
