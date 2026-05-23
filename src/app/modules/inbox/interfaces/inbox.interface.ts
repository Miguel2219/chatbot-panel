import {ConversationThreadSummaryDto} from '../../conversations/interfaces/conversation.interface';

/**
 * Tipo de evento SSE entrante del backend (/api/inbox/stream).
 * El payload es siempre un ConversationThreadSummaryDto del thread afectado.
 */
export type InboxEventType = 'ESCALATED' | 'MESSAGE' | 'CLAIMED' | 'RESOLVED';

export interface InboxEvent {
  type: InboxEventType;
  payload: ConversationThreadSummaryDto;
}
