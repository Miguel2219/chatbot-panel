import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {QuotaAdminRowDto} from '../interfaces/quota-admin-row.interface';

@Injectable({ providedIn: 'root' })
export class QuotaService {

  constructor(private _http: HttpService) {}

  getAllAdminRows(): Observable<QuotaAdminRowDto[]> {
    return this._http.get<QuotaAdminRowDto[]>(EndPoints.QUOTA_ADMIN_ALL);
  }
}
