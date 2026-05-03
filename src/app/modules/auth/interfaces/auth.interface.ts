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
  access_token: string;
  refresh_token: string;
  expires_in: number;       // vida útil del access token en segundos
  type: string;
  user: UserResponse;
  implementation_type: string | null;
  modules: ModulePermissions[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ValidateResetTokenResponse {
  email_masked: string;
}

export interface GenericMessageResponse {
  message: string;
}
