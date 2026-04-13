import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent),
  },
];
