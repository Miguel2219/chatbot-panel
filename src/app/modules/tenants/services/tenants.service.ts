import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Page} from '../../../core/interfaces/page.interface';
import {EndPoints} from '../../../core/utils/endpoints';
import {HttpService} from '../../../core/services/http.service';
import {
  CreateTenantRequest,
  TenantResponse,
  TenantResponseSelect,
  TenantUserSelectResponse,
  UpdateTenantRequest
} from '../interfaces/tenant.interface';
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

  createTenant(request: CreateTenantRequest): Observable<void> {
    return this._http.post<CreateTenantRequest, void>(EndPoints.TENANT_CREATE, request);
  }

  updateTenant(tenantId: string, request: UpdateTenantRequest): Observable<void> {
    return this._http.put<UpdateTenantRequest, void>(EndPoints.TENANT_UPDATE + tenantId, request);
  }

  getTenantUsers(tenantId: string): Observable<TenantUserSelectResponse[]> {
    return this._http.get<TenantUserSelectResponse[]>(EndPoints.TENANT_USERS + tenantId + '/users');
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
