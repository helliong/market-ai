import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiTags('Health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Service status text.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
