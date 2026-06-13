export type ChatRole = 'system' | 'user' | 'assistant' | 'function';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
  function_call?: FunctionCall;
  functions_state_id?: string;
};

export type FunctionCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type GigaChatFunction = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type GigaChatResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: ChatMessage;
  }>;
};

export type ProductImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  attributes: Record<string, string>;
  category: string;
  price: number;
  oldPrice?: number | string | null;
  rating: number;
  reviews: number;
  stock: number;
  storeName?: string;
  images: ProductImage[];
};
