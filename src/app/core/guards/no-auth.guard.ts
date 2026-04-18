import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Requiere autenticación. Redirige al login si no está logueado. */
export const NoAuthGuard: CanActivateFn = () => {
  const _auth = inject(AuthService);
  const _router = inject(Router);

  if (!_auth.isLoggedIn()) {
    _router.navigateByUrl('/auth');
    return false;
  }
  return true;
};
