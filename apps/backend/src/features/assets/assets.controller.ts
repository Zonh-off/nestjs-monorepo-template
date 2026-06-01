import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AssetQueueService } from '@nestjs-monorepo-template/queue';

interface UploadedFileDto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetQueueService: AssetQueueService) { }

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
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, userId, 'avatar');
    return {
      success: true,
      message: 'Raw avatar uploaded and WebP background optimization queued successfully.',
      userId,
      rawUrl: result.rawUrl,
      expectedOutputs: result.expectedOutputs,
    };
  }

  @Post('banner')
  @ApiOperation({ summary: 'Upload a raw banner and queue its multi-resolution WebP optimization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The raw banner image file (PNG/JPEG/etc.)',
        },
        userId: {
          type: 'string',
          description: 'The user ID this banner belongs to',
          default: 'user_12345',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @UploadedFile() file?: UploadedFileDto,
    @Body('userId') userId?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for banner upload.');
    }
    if (!userId) {
      throw new BadRequestException('No userId provided.');
    }
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, userId, 'banner');
    return {
      success: true,
      message: 'Raw banner uploaded and WebP background optimization queued successfully.',
      userId,
      rawUrl: result.rawUrl,
      expectedOutputs: result.expectedOutputs,
    };
  }

  @Post('post')
  @ApiOperation({ summary: 'Upload a raw post image and queue its multi-resolution WebP optimization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The raw post image file (PNG/JPEG/etc.)',
        },
        userId: {
          type: 'string',
          description: 'The user ID this post image belongs to',
          default: 'user_12345',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPost(
    @UploadedFile() file?: UploadedFileDto,
    @Body('userId') userId?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for post image upload.');
    }
    if (!userId) {
      throw new BadRequestException('No userId provided.');
    }
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, userId, 'post');
    return {
      success: true,
      message: 'Raw post uploaded and WebP background optimization queued successfully.',
      userId,
      rawUrl: result.rawUrl,
      expectedOutputs: result.expectedOutputs,
    };
  }
}
