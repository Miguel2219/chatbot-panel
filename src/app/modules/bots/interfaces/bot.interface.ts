export interface RegisterBotDto {
  bot_name: string;
  bot_description: string;
  tenant_id: string;
}

export interface ResponseBotDto {
  bot_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ResponseBotSelectDto {
  bot_id: string;
  name: string;
}
