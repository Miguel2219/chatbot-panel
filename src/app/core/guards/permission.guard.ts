import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { PermissionAction } from '../utils/permissions';

/** Valida permiso del módulo según data.module + data.permission en la ruta. */
export const PermissionGuard: CanActivateFn = (route) => {
  const _auth = inject(AuthService);
  const _router = inject(Router);
  const _toastr = inject(ToastrService);

  const module = route.data['module'] as string | undefined;
  const permission = (route.data['permission'] as PermissionAction | undefined) ?? 'view';

  if (!module) return true;

  if (_auth.hasPermission(module, permission)) return true;

  _toastr.error('No tienes permiso para acceder a esta sección');
  _router.navigateByUrl('/administration/dashboard');
  return false;
};
