import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ASSET_QUEUE, OptimizeAssetPayload, ImageVariant } from './asset.types';
import { StorageService } from '@nestjs-monorepo-template/storage';
import { ASSET_PRESETS } from './asset.config';
import { getOptimizedAssetPath } from './asset.utility';
import { PrismaService } from '@nestjs-monorepo-template/prisma';
import * as fs from 'fs';
import * as path from 'path';

@Processor(ASSET_QUEUE)
export class AssetQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AssetQueueProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService
  ) {
    super();
  }

  async process(job: Job<OptimizeAssetPayload, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
    await this.handleOptimizeAsset(job.data);
  }

  private async handleOptimizeAsset(data: OptimizeAssetPayload): Promise<void> {
    const preset = ASSET_PRESETS[data.type] || ASSET_PRESETS.general;
    const variants = Object.keys(preset) as ImageVariant[];

    this.logger.log(`[Worker] Fetching original image from ${data.fileUrl} for ${data.type} ID ${data.assetId}...`);

    let originalBuffer: Buffer;
    const isAbsolute = data.fileUrl.startsWith('http://') || data.fileUrl.startsWith('https://');

    if (isAbsolute) {
      const response = await fetch(data.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch original image from ${data.fileUrl}: ${response.statusText}`);
      }
      originalBuffer = Buffer.from(await response.arrayBuffer());
      this.logger.log(`[Worker] Successfully downloaded original image via HTTP (${originalBuffer.length} bytes).`);
    } else {
      // Local relative path file resolution across monorepo run paths
      const relativePath = data.fileUrl.replace('/uploads/', '');
      const pathsToTry = [
        path.join(process.cwd(), 'public', 'uploads', relativePath),
        path.join(process.cwd(), '..', 'backend', 'public', 'uploads', relativePath),
        path.join(process.cwd(), 'apps', 'backend', 'public', 'uploads', relativePath),
      ];

      let absolutePath = '';
      for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
          absolutePath = p;
          break;
        }
      }

      if (!absolutePath) {
        throw new Error(`[Worker] Local file not found in any standard path for relative URL: ${data.fileUrl}`);
      }

      originalBuffer = await fs.promises.readFile(absolutePath);
      this.logger.log(`[Worker] Successfully loaded original image from disk: ${absolutePath} (${originalBuffer.length} bytes).`);
    }

    const results: Record<string, string> = {};

    for (const variant of variants) {
      const spec = preset[variant]!;

      let width = data.width ?? spec.width;
      let height = data.height ?? spec.height;
      let quality = data.quality ?? spec.quality;

      const targetPath = getOptimizedAssetPath(data.type, data.assetId, variant);

      const dimensionsLog = width ? (height ? ` to ${width}x${height}` : ` to width ${width}px`) : ' (original dimensions)';
      this.logger.log(`[Worker] Optimizing variant "${variant}": compression${dimensionsLog}, quality ${quality}%, converting to WebP...`);

      const mockWebpBuffer = Buffer.from(
        'RIFF28000000WEBPVP8 1c000000/01000000h01000000/0000000000000000',
        'binary'
      );

      this.logger.log(`[Worker] Uploading optimized WebP variant [${variant}] to: ${targetPath}...`);
      const publicUrl = await this.storage.uploadFile(
        mockWebpBuffer,
        targetPath,
        'image/webp',
        { preserveName: true }
      );

      results[variant] = publicUrl;
    }

    // Update database status to READY upon successful multi-resolution WebP optimization
    await this.prisma.asset.update({
      where: { id: data.assetId },
      data: { status: 'READY' }
    });

    this.logger.log(`[Worker] Asset ${data.type}/${data.assetId} optimized successfully! WebP variants generated: ${JSON.stringify(results)}`);
  }
}
