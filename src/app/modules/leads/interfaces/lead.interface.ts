export interface LeadResponseDto {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  /** Cantidad de veces que este contacto se capturó (dedup por tenant + phone/email). */
  capture_count: number;
  created_at: string;
  /** Timestamp de la captura más reciente. */
  last_captured_at: string;
}
