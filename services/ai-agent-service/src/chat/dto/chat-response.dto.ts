import type { Product } from '../chat.types';

export type ChatConversationState = {
  productType?: string;
  maxPrice?: number;
  shownProductIds?: number[];
  lastQuery?: string;
};

export class ChatResponseDto {
  reply!: string;
  products?: Product[];
  conversationState?: ChatConversationState;
  sessionId?: string;
}
