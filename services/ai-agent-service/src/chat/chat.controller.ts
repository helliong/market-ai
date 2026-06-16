import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ChatHistoryService } from './chat-history.service';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import type { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('AI chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatHistory: ChatHistoryService,
  ) {}

  @Post()
  @ApiSecurity('guestId')
  @ApiHeader({
    name: 'x-guest-id',
    required: false,
    description: 'Anonymous browser chat id. Prefer this over body.guestId.',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: false,
    description: 'Authenticated account id forwarded by API Gateway.',
  })
  @ApiOperation({
    summary: 'Send a message to the assistant',
    description:
      'Creates or continues a chat session, stores the user and assistant messages, and returns product recommendations when available.',
  })
  @ApiOkResponse({ description: 'Assistant reply with optional products and session state.' })
  async chat(
    @Body() request: ChatRequestDto,
    @Headers('x-user-id') accountId?: string,
    @Headers('x-guest-id') guestId?: string,
  ): Promise<ChatResponseDto> {
    const session = await this.chatHistory.ensureSession({
      sessionId: request.sessionId,
      accountId,
      guestId: guestId ?? request.guestId,
      title: request.message,
      state: request.conversationState,
    });

    await this.chatHistory.saveMessage({
      sessionId: session.id,
      role: 'user',
      content: request.message,
    });

    const response = await this.chatService.chat(request);

    await this.chatHistory.saveMessage({
      sessionId: session.id,
      role: 'assistant',
      content: response.reply,
      products: response.products,
    });
    await this.chatHistory.updateSessionState(
      session.id,
      response.conversationState,
    );

    return { ...response, sessionId: session.id };
  }

  @Get('sessions')
  @ApiTags('AI chat history')
  @ApiSecurity('guestId')
  @ApiOperation({ summary: 'List recent assistant chat sessions' })
  @ApiOkResponse({ description: 'Latest persisted chat sessions for the owner.' })
  sessions(
    @Headers('x-user-id') accountId?: string,
    @Query('guestId') guestId?: string,
  ) {
    return this.chatHistory.listSessions({ accountId, guestId });
  }

  @Get('sessions/:sessionId')
  @ApiTags('AI chat history')
  @ApiSecurity('guestId')
  @ApiOperation({ summary: 'Get one assistant chat session with messages' })
  @ApiOkResponse({ description: 'Persisted chat session with ordered messages.' })
  session(
    @Param('sessionId') sessionId: string,
    @Headers('x-user-id') accountId?: string,
    @Query('guestId') guestId?: string,
  ) {
    return this.chatHistory.getSession(sessionId, { accountId, guestId });
  }
}
