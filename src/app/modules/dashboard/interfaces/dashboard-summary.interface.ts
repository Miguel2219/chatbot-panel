export interface DashboardSummaryDto {
  conversations_month: ConversationsMonthDto;
  conversations_today: number;
  leads_total: number;
  leads_pending: number;
}

export interface ConversationsMonthDto {
  used: number;
  limit: number;
  percent_used: number;
  /** Fecha inclusive en zona Bogotá (ISO `YYYY-MM-DD`). */
  cycle_start: string;
  /** Fecha inclusive en zona Bogotá (ISO `YYYY-MM-DD`). */
  cycle_end: string;
}
