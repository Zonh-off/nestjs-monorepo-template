import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AssetQueueService } from '@nestjs-monorepo-template/queue';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthUser } from '@nestjs-monorepo-template/auth';

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
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: UploadedFileDto | undefined,
    @CurrentUser() user: AuthUser
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for avatar upload.');
    }
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, user.id, 'avatar');
    return {
      success: true,
      message: 'Raw avatar uploaded and WebP background optimization queued successfully.',
      userId: user.id,
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
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @UploadedFile() file: UploadedFileDto | undefined,
    @CurrentUser() user: AuthUser
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for banner upload.');
    }
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, user.id, 'banner');
    return {
      success: true,
      message: 'Raw banner uploaded and WebP background optimization queued successfully.',
      userId: user.id,
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
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPost(
    @UploadedFile() file: UploadedFileDto | undefined,
    @CurrentUser() user: AuthUser
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for post image upload.');
    }
    const result = await this.assetQueueService.uploadAndOptimizeAsset(file, user.id, 'post');
    return {
      success: true,
      message: 'Raw post uploaded and WebP background optimization queued successfully.',
      userId: user.id,
      rawUrl: result.rawUrl,
      expectedOutputs: result.expectedOutputs,
    };
  }
}
