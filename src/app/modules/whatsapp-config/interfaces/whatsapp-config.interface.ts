export interface CreateWhatsappConfigRequest {
  phone_number_id: string;
  access_token: string;
}

export interface WhatsappConfigResponseDto {
  id: string;
  bot_id: string;
  phone_number_id: string;
  is_active: boolean;
}
