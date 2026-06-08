import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreatePresignedUploadDto, DeleteObjectsDto } from './uploads.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('uploads/presigned-url')
  createPresignedUpload(@Body() dto: CreatePresignedUploadDto) {
    return this.appService.createPresignedUpload(dto);
  }

  @Delete('uploads')
  deleteObjects(@Body() dto: DeleteObjectsDto) {
    return this.appService.deleteObjects(dto);
  }
}
