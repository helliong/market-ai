import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatHistoryService } from './chat-history.service';
import { CatalogClient } from './catalog-client.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GigaChatProvider } from './gigachat.provider';

@Module({
  imports: [HttpModule.register({ timeout: 30_000 }), PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, ChatHistoryService, GigaChatProvider, CatalogClient],
})
export class ChatModule {}
