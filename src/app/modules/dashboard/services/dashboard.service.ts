import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {DashboardSummaryDto} from '../interfaces/dashboard-summary.interface';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private _http: HttpService) {}

  /**
   * @param tenantId  Opcional — sólo tiene efecto cuando el caller es ADMIN.
   *                  Para USER, el backend ignora este parámetro y usa su propio tenant.
   */
  getSummary(tenantId?: string | null): Observable<DashboardSummaryDto> {
    let params = new HttpParams();
    if (tenantId) {
      params = params.set('tenantId', tenantId);
    }
    return this._http.get<DashboardSummaryDto>(
      EndPoints.DASHBOARD_SUMMARY,
      false,
      this._http.addParams(params),
    );
  }
}
