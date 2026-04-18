import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent),
  },
];
