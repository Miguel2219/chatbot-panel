import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

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
  {
    path: '**',
    redirectTo: 'auth',
  },
];
