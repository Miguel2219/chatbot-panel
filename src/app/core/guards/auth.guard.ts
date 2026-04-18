import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Permite solo usuarios NO autenticados. Redirige al dashboard si ya está logueado. */
export const AuthGuard: CanActivateFn = () => {
  const _auth = inject(AuthService);
  const _router = inject(Router);

  if (_auth.isLoggedIn()) {
    _router.navigateByUrl('/administration/dashboard');
    return false;
  }
  return true;
};
