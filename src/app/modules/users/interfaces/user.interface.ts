export interface CreateAdviserRequestDto {
  name: string;
  lastname: string;
  email: string;
  password: string;
  phone: string;
  numberDocument: string;
}

export interface AdviserResponseDto {
  userId: string;
  email: string;
  role: string;
  createdAt?: string;
  person?: {
    name: string;
    lastname: string;
    phone: string;
    numberDocument: string;
    available: boolean;
  };
}

export interface UserResponse {
  user_id: string;
  must_change_password: boolean;
  tenant_id: string | null;
  email: string;
  roles: string[];
  notification_channel: string | null;
  name: string;
  lastname: string;
}
