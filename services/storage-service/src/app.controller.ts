import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreatePresignedUploadDto, DeleteObjectsDto } from './uploads.dto';

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

  @Post('uploads/presigned-url')
  @ApiTags('Uploads')
  @ApiOperation({ summary: 'Create a presigned S3 upload URL' })
  @ApiOkResponse({ description: 'Upload URL and public object URL.' })
  createPresignedUpload(@Body() dto: CreatePresignedUploadDto) {
    return this.appService.createPresignedUpload(dto);
  }

  @Delete('uploads')
  @ApiTags('Uploads')
  @ApiOperation({ summary: 'Delete uploaded objects by keys' })
  @ApiOkResponse({ description: 'Delete operation result.' })
  deleteObjects(@Body() dto: DeleteObjectsDto) {
    return this.appService.deleteObjects(dto);
  }
}
