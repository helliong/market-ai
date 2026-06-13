import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CatalogClient } from './catalog-client.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GigaChatProvider } from './gigachat.provider';

@Module({
  imports: [HttpModule.register({ timeout: 30_000 })],
  controllers: [ChatController],
  providers: [ChatService, GigaChatProvider, CatalogClient],
})
export class ChatModule {}
