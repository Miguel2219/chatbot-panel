import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {
  CreateRoleRequest,
  ModulePermissionsRole,
  RoleResponse,
  UpdateRolePermissionsRequest,
} from '../interfaces/role.interface';
import {Select} from '../../../core/interfaces/select.interface';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private _http: HttpService) {}

  getAllRoles(): Observable<RoleResponse[]> {
    return this._http.get<RoleResponse[]>(EndPoints.ROLES);
  }

  getRolesSelect(): Observable<Select[]> {
    return new Observable<Select[]>((observer) => {
      this.getAllRoles().subscribe({
        next: (roles) => {
          observer.next(roles.map((r): Select => ({ label: r.name, value: r.role_id })));
          observer.complete();
        },
      });
    });
  }

  createRole(request: CreateRoleRequest): Observable<RoleResponse> {
    return this._http.post<CreateRoleRequest, RoleResponse>(EndPoints.ROLES, request);
  }

  updateRole(roleId: string, request: CreateRoleRequest): Observable<RoleResponse> {
    return this._http.put<CreateRoleRequest, RoleResponse>(`${EndPoints.ROLES}/${roleId}`, request);
  }

  deleteRole(roleId: string): Observable<void> {
    return this._http.delete<void>(`${EndPoints.ROLES}/${roleId}`);
  }

  getPermissionsByRole(roleId: string): Observable<ModulePermissionsRole[]> {
    return this._http.get<ModulePermissionsRole[]>(EndPoints.ROLE_PERMISSIONS + roleId);
  }

  updateRolePermissions(roleId: string, request: UpdateRolePermissionsRequest): Observable<void> {
    return this._http.put<UpdateRolePermissionsRequest, void>(EndPoints.ROLE_PERMISSIONS + roleId, request);
  }
}
