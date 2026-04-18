import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/leads/leads.component').then(m => m.LeadsComponent),
  },
];
