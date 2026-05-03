export const PermissionAction = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

export type PermissionAction = typeof PermissionAction[keyof typeof PermissionAction];

export const ModuleRoute = {
  DASHBOARD: 'dashboard',
  BOTS: 'bots',
  LEADS: 'leads',
  CONVERSATIONS: 'conversations',
  DOCUMENTS: 'documents',
  USERS: 'users',
  WHATSAPP_CONFIG: 'whatsapp-config',
  ROLES: 'roles',
  TENANTS: 'tenants',
  QUOTAS: 'quotas',
} as const;

export type ModuleRoute = typeof ModuleRoute[keyof typeof ModuleRoute];
