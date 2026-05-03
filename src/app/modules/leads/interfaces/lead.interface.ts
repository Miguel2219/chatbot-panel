export interface LeadResponseDto {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: LeadStatus;
  /** Canal por el que llegó el lead (WEB / WHATSAPP / ...). */
  channel: string;
  /** Nombre de display del user asignado. Lo usa la columna "Asesor asignado". */
  assigned_adviser?: string | null;
  /** UUID del user asignado. Útil para permisos/filtros client-side. */
  assigned_adviser_id?: string | null;
  created_at: string;
}

export type LeadStatus = 'PENDING' | 'CONTACTED' | 'CLOSED';
