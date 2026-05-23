export type ConversationChannel = 'WIDGET' | 'WHATSAPP';

export type ConversationStatus = 'BOT_ACTIVE' | 'PENDING_HUMAN' | 'HUMAN_ACTIVE' | 'RESOLVED';

/**
 * Representacion slim del thread para el listado (tabla del modulo
 * conversations). Solo trae lo necesario para renderizar la fila.
 */
export interface ConversationThreadSummaryDto {
  conversation_id: string;
  bot_id: string;
  session_id: string;
  customer_name: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  assigned_adviser_id: string | null;
  assigned_adviser_name: string | null;
  last_customer_message_at: string;
  escalated_at: string | null;
  unread_count: number;
}

/**
 * Representacion completa del thread. Se obtiene cuando el usuario abre
 * el detalle de una conversacion (drill-in).
 */
export interface ConversationThreadResponseDto {
  conversation_id: string;
  bot_id: string;
  session_id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  assigned_adviser_id: string | null;
  assigned_adviser_name: string | null;
  assigned_at: string | null;
  request_detail: string | null;
  escalated_at: string | null;
  last_customer_message_at: string;
  customer_name: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Un mensaje individual de un thread. Se usa en el drill-in del detalle.
 */
export interface MessageResponseDto {
  message_id: string;
  conversation_id: string;
  role: string;
  message: string;
  created_at: string;
}
