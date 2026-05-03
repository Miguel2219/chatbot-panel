import {Routes} from '@angular/router';
import {AuthGuard} from './core/guards/auth.guard';
import {NoAuthGuard} from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then(r => r.routes),
  },
  {
    path: 'administration',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./modules/administration/administration.routes').then(r => r.routes),
  },
  // Rutas top-level del flujo "forgot password". Top-level (no bajo /auth/*)
  // porque la URL viaja en el email — más corta y limpia. AuthGuard redirige
  // a /administration si ya hay sesión, igual que /auth.
  {
    path: 'forgot-password',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/auth/pages/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/auth/pages/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent),
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
