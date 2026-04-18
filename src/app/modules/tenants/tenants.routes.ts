import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tenants/tenants.component').then(m => m.TenantsComponent),
  },
];
