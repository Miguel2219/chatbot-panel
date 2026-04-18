export interface LeadResponseDto {
  leadId: string;
  botId: string;
  sessionId: string;
  name: string;
  phone?: string;
  email?: string;
  requestDetail?: string;
  leadChannel: string;
  status: string;
  createdAt: string;
}

export type LeadStatus = 'PENDING' | 'CONTACTED' | 'CLOSED';
