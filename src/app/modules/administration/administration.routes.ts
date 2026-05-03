import {Routes} from '@angular/router';
import {PermissionGuard} from '../../core/guards/permission.guard';

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
        canActivate: [PermissionGuard],
        data: { module: 'bots', permission: 'view' },
        loadChildren: () => import('../bots/bots.routes').then(r => r.routes),
      },
      {
        path: 'conversations',
        canActivate: [PermissionGuard],
        data: { module: 'conversations', permission: 'view' },
        loadChildren: () => import('../conversations/conversations.routes').then(r => r.routes),
      },
      {
        path: 'leads',
        canActivate: [PermissionGuard],
        data: { module: 'leads', permission: 'view' },
        loadChildren: () => import('../leads/leads.routes').then(r => r.routes),
      },
      {
        path: 'users',
        canActivate: [PermissionGuard],
        data: { module: 'users', permission: 'view' },
        loadChildren: () => import('../users/users.routes').then(r => r.routes),
      },
      {
        path: 'documents',
        canActivate: [PermissionGuard],
        data: { module: 'documents', permission: 'view' },
        loadChildren: () => import('../documents/documents.routes').then(r => r.routes),
      },
      {
        path: 'whatsapp-config',
        canActivate: [PermissionGuard],
        data: { module: 'whatsapp-config', permission: 'view' },
        loadChildren: () => import('../whatsapp-config/whatsapp-config.routes').then(r => r.routes),
      },
      {
        path: 'roles',
        canActivate: [PermissionGuard],
        data: { module: 'roles', permission: 'view' },
        loadChildren: () => import('../roles/roles.routes').then(r => r.routes),
      },
      {
        path: 'tenants',
        canActivate: [PermissionGuard],
        data: { module: 'tenants', permission: 'view' },
        loadChildren: () => import('../tenants/tenants.routes').then(r => r.routes),
      },
      {
        path: 'quotas',
        canActivate: [PermissionGuard],
        data: { module: 'quotas', permission: 'view' },
        loadChildren: () => import('../quotas/quotas.routes').then(r => r.routes),
      },
    ],
  },
];
