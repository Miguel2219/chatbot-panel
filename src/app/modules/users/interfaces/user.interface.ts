import {NotificationChannel} from '../../../core/utils/implementation';

export interface UserBotRef {
  bot_id: string;
  name: string;
}

export interface UserResponse {
  user_id: string;
  must_change_password: boolean;
  tenant_id: string | null;
  email: string;
  roles: string[];
  role_ids?: string[];
  notification_channel: string | null;
  name: string;
  lastname: string;
  phone?: string | null;
  number_document?: string | null;
  tenant_name?: string;
  lead_assignee_bots?: UserBotRef[];
}

export interface CreateUserRequest {
  email: string;
  name: string;
  lastname: string;
  phone?: string;
  number_document?: string;
  notification_channel?: NotificationChannel;
  role_ids?: string[];
  tenant_id?: string;
  lead_assignee_bot_ids?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  lastname?: string;
  phone?: string;
  number_document?: string;
  notification_channel?: NotificationChannel;
  role_ids?: string[];
  lead_assignee_bot_ids?: string[];
}
