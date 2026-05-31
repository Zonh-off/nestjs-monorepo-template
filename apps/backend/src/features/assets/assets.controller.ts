import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

interface UploadedFileDto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload a raw avatar and queue its multi-resolution WebP optimization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The raw avatar image file (PNG/JPEG/etc.)',
        },
        userId: {
          type: 'string',
          description: 'The user ID this avatar belongs to',
          default: 'user_12345',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file?: UploadedFileDto,
    @Body('userId') userId?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for avatar upload.');
    }
    if (!userId) {
      throw new BadRequestException('No userId provided.');
    }
    return this.assetsService.handleUploadAvatar(file, userId);
  }
}
