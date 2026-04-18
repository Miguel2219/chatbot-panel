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
