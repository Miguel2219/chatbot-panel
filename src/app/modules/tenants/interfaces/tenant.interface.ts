import {ImplementationType, NotificationChannel} from '../../../core/utils/implementation';

export interface TenantResponse {
  tenant_id: string;
  name: string;
  email: string;
  is_active: boolean;
  implementation_type: string;
  created_at: string;
}

export interface TenantResponseSelect {
  tenant_id: string;
  name: string;
}

export interface CreateTenantRequest {
  tenant_name: string;
  tenant_email: string;
  implementation_type: ImplementationType;
  owner_email: string;
  owner_name: string;
  owner_lastname: string;
  owner_phone?: string;
  owner_number_document?: string;
  owner_notification_channel?: NotificationChannel;
}

export interface UpdateTenantRequest {
  tenant_name?: string;
  tenant_email?: string;
  implementation_type?: ImplementationType;
  owner_user_id?: string;
  // Sólo se envía cuando el `implementation_type` nuevo exige notification_channel
  // y el owner aún no tiene uno definido (ver edit-tenant.component.ts).
  owner_notification_channel?: NotificationChannel;
}

export interface TenantUserSelectResponse {
  user_id: string;
  full_name: string;
  email: string;
  is_current_owner: boolean;
  // Necesario para que el modal de Editar Tenant decida si exigir
  // owner_notification_channel al cambiar el implementation_type.
  notification_channel: string | null;
}
