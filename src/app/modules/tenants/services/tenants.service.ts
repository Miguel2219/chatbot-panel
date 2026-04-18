import { Injectable } from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Page} from '../../../core/interfaces/page.interface';
import {ResponseBotDto, ResponseBotSelectDto} from '../../bots/interfaces/bot.interface';
import {EndPoints} from '../../../core/utils/endpoints';
import {HttpService} from '../../../core/services/http.service';
import {TenantResponse, TenantResponseSelect} from '../interfaces/tenant.interface';
import {Select} from '../../../core/interfaces/select.interface';

@Injectable({
  providedIn: 'root'
})
export class TenantsService {

  constructor(private _http: HttpService) { }

  getTenants(params: HttpParams): Observable<Page<TenantResponse>> {
    const defaultOptions = this._http.addParams(params)
    return this._http.get<Page<TenantResponse>>(EndPoints.TENANTS, false, defaultOptions);
  }

  public getTenantsSelect(): Observable<Select[]> {
    return new Observable<Select[]>((observer) => {
      this._http.get<TenantResponseSelect[]>(EndPoints.TENANTS_SELECT).subscribe({
        next: (data: TenantResponseSelect[]) => {
          const selectLeaders: Select[] = data.map((item: TenantResponseSelect): Select => {
            return {
              label: item.name,
              value: item.tenant_id
            };
          });
          observer.next(selectLeaders);
          observer.complete();
        }
      })
    })
  }
}
