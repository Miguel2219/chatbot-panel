import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import {
  RoleResponse,
  CreateRoleRequest,
  ModulePermissions,
  UpdateRolePermissionsRequest,
} from '../interfaces/role.interface';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private _http: HttpService) {}

  getAllRoles(): Observable<RoleResponse[]> {
    return this._http.get<RoleResponse[]>(EndPoints.ROLES);
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

  getPermissionsByRole(roleId: string): Observable<ModulePermissions[]> {
    return this._http.get<ModulePermissions[]>(EndPoints.ROLE_PERMISSIONS + roleId);
  }

  updateRolePermissions(roleId: string, request: UpdateRolePermissionsRequest): Observable<void> {
    return this._http.put<UpdateRolePermissionsRequest, void>(EndPoints.ROLE_PERMISSIONS + roleId, request);
  }
}
