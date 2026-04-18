import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./page/main/main-administration.component').then(m => m.MainAdministrationComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.routes').then(r => r.routes),
      },
      {
        path: 'bots',
        loadChildren: () => import('../bots/bots.routes').then(r => r.routes),
      },
      {
        path: 'conversations',
        loadChildren: () => import('../conversations/conversations.routes').then(r => r.routes),
      },
      {
        path: 'leads',
        loadChildren: () => import('../leads/leads.routes').then(r => r.routes),
      },
      {
        path: 'users',
        loadChildren: () => import('../users/users.routes').then(r => r.routes),
      },
      {
        path: 'documents',
        loadChildren: () => import('../documents/documents.routes').then(r => r.routes),
      },
      {
        path: 'whatsapp-config',
        loadChildren: () => import('../whatsapp-config/whatsapp-config.routes').then(r => r.routes),
      },
      {
        path: 'roles',
        loadChildren: () => import('../roles/roles.routes').then(r => r.routes),
      },
      {
        path: 'tenants',
        loadChildren: () => import('../tenants/tenants.routes').then(r => r.routes),
      },
    ],
  },
];
