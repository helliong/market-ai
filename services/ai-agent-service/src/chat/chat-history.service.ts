import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Product } from './chat.types';
import type { ChatConversationState } from './dto/chat-response.dto';

type SessionOwner = {
  accountId?: string;
  guestId?: string;
};

type EnsureSessionInput = SessionOwner & {
  sessionId?: string;
  title: string;
  state?: ChatConversationState;
};

@Injectable()
export class ChatHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSession(input: EnsureSessionInput) {
    const owner = normalizeOwner(input);

    if (input.sessionId) {
      const session = await this.prisma.aiChatSession.findFirst({
        where: {
          id: input.sessionId,
          ...ownerWhere(owner),
        },
      });

      if (session) {
        return session;
      }
    }

    return this.prisma.aiChatSession.create({
      data: {
        accountId: owner.accountId,
        guestId: owner.guestId,
        title: createSessionTitle(input.title),
        state: toJson(input.state),
      },
    });
  }

  async saveMessage({
    sessionId,
    role,
    content,
    products,
  }: {
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    products?: Product[];
  }) {
    return this.prisma.aiChatMessage.create({
      data: {
        sessionId,
        role,
        content,
        products: toJson(products),
      },
    });
  }

  async updateSessionState(sessionId: string, state?: ChatConversationState) {
    if (!state) {
      return;
    }

    await this.prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { state: toJson(state) },
    });
  }

  async listSessions(ownerInput: SessionOwner) {
    const owner = normalizeOwner(ownerInput);

    if (!owner.accountId && !owner.guestId) {
      return [];
    }

    const sessions = await this.prisma.aiChatSession.findMany({
      where: ownerWhere(owner),
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      state: session.state,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastMessage: session.messages[0]
        ? {
            role: session.messages[0].role,
            content: session.messages[0].content,
            createdAt: session.messages[0].createdAt,
          }
        : undefined,
    }));
  }

  async getSession(sessionId: string, ownerInput: SessionOwner) {
    const owner = normalizeOwner(ownerInput);
    const session = await this.prisma.aiChatSession.findFirst({
      where: {
        id: sessionId,
        ...ownerWhere(owner),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return {
      id: session.id,
      title: session.title,
      state: session.state,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        products: message.products,
        createdAt: message.createdAt,
      })),
    };
  }
}

function normalizeOwner(input: SessionOwner): SessionOwner {
  return {
    accountId: input.accountId?.trim() || undefined,
    guestId: input.guestId?.trim() || undefined,
  };
}

function ownerWhere(owner: SessionOwner) {
  if (owner.accountId) {
    return { accountId: owner.accountId };
  }

  if (owner.guestId) {
    return { guestId: owner.guestId };
  }

  return { id: '__no_owner__' };
}

function createSessionTitle(message: string) {
  return message.trim().slice(0, 80) || 'Новый чат';
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined
    ? undefined
    : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);
}
