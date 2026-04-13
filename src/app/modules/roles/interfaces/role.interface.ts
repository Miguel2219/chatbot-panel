export interface RoleResponse {
  role_id: string;
  name: string;
  description: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface PermissionCheck {
  permission_id: string;
  action: string;
  granted: boolean;
}

export interface ModulePermissions {
  module_id: string;
  module_name: string;
  icon: string;
  permissions: PermissionCheck[];
}

export interface UpdateRolePermissionsRequest {
  permission_ids: string[];
}
