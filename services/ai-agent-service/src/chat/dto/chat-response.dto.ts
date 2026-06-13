import type { Product } from '../chat.types';

export class ChatResponseDto {
  reply!: string;
  products?: Product[];
}
