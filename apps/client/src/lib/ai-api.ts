export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
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
};

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://127.0.0.1:4000";

export async function sendAiMessage(
  message: string,
  history: AiChatMessage[],
): Promise<AiChatResponse> {
  const response = await fetch(`${API_GATEWAY_URL}/api/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
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
