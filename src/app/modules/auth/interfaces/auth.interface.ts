import {UserResponse} from '../../users/interfaces/user.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ModulePermissions {
  module_id: string;
  name: string;
  route: string;
  icon: string;
  display_order: number;
  permissions: Record<string, boolean>;
}

export interface LoginResponse {
  token: string;
  type: string;
  user: UserResponse;
  implementation_type: string | null;
  modules: ModulePermissions[];
}
