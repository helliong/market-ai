export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiConversationState = {
  productType?: string;
  maxPrice?: number;
  shownProductIds?: number[];
  lastQuery?: string;
};

export type AiProduct = {
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
  storeName?: string;
  images: {
    id: string;
    url: string;
    isMain: boolean;
    sortOrder: number;
  }[];
};

export type AiChatResponse = {
  reply: string;
  products?: AiProduct[];
  conversationState?: AiConversationState;
  sessionId?: string;
};

export type AiChatSessionSummary = {
  id: string;
  title?: string | null;
  state?: AiConversationState | null;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  };
};

export type AiChatPersistedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AiProduct[];
  createdAt: string;
};

export type AiChatPersistedSession = {
  id: string;
  title?: string | null;
  state?: AiConversationState | null;
  createdAt: string;
  updatedAt: string;
  messages: AiChatPersistedMessage[];
};

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://127.0.0.1:4000";

export async function sendAiMessage(
  message: string,
  history: AiChatMessage[],
  conversationState?: AiConversationState,
  sessionId?: string,
  guestId?: string,
): Promise<AiChatResponse> {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (guestId) {
    headers["x-guest-id"] = guestId;
  }

  const response = await fetch(`${API_GATEWAY_URL}/api/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      message,
      history,
      conversationState,
      sessionId,
    }),
  });
  const data = (await response.json().catch(() => null)) as
    | (AiChatResponse & { message?: string })
    | null;

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Лимит сообщений исчерпан. Подождите немного и попробуйте снова.",
      );
    }

    throw new Error(data?.message ?? "Не удалось получить ответ помощника.");
  }

  return data as AiChatResponse;
}

export async function fetchAiChatSessions(guestId: string) {
  const response = await fetch(
    `${API_GATEWAY_URL}/api/ai/chat/sessions?guestId=${encodeURIComponent(guestId)}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as AiChatSessionSummary[];
}

export async function fetchAiChatSession(sessionId: string, guestId: string) {
  const response = await fetch(
    `${API_GATEWAY_URL}/api/ai/chat/sessions/${encodeURIComponent(sessionId)}?guestId=${encodeURIComponent(guestId)}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AiChatPersistedSession;
}
