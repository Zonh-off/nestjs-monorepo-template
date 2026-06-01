import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ASSET_QUEUE, OptimizeAssetPayload, AssetType, ImageVariant } from './asset.types';
import { StorageService, getStoragePublicUrl } from '@nestjs-monorepo-template/storage';
import { ASSET_PRESETS } from './asset.config';
import { getRawAssetPath, getOptimizedAssetPath, createAssetId, validateAssetSize } from './asset.utility';
import { PrismaService } from '@nestjs-monorepo-template/prisma';

@Injectable()
export class AssetQueueService {
  private readonly logger = new Logger(AssetQueueService.name);

  constructor(
    @InjectQueue(ASSET_QUEUE) private readonly assetQueue: Queue,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService
  ) { }

  async queueAssetOptimization(payload: OptimizeAssetPayload): Promise<void> {
    this.logger.log(`Queueing asset optimization for type: ${payload.type}, id: ${payload.assetId}`);
    await this.assetQueue.add('optimize-asset', payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }

  /**
   * Orchestrates the complete validation, raw upload, queue dispatch,
   * and expected output mapping for any monorepo asset type dynamically.
   */
  async uploadAndOptimizeAsset(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    userId: string,
    type: AssetType
  ): Promise<{ assetId: string; rawUrl: string; expectedOutputs: Record<ImageVariant, string> }> {
    // 1. Dynamic Size Validation
    validateAssetSize(file.size, type);

    // 2. Dynamic Path and Asset Identification
    const assetId = createAssetId(userId);

    // 2b. Synchronously register a PENDING asset record in the database
    this.logger.log(`[QueueService] Creating PENDING asset record in database for assetId: ${assetId}, type: ${type}`);
    await this.prisma.asset.create({
      data: {
        id: assetId,
        type,
        status: 'PENDING',
        rawUrl: '', // Updated dynamically upon successful physical storage upload below
        userId,
      },
    });

    const uniqueFileName = getRawAssetPath(type, assetId, file.originalname);

    // 3. Raw File Storage Upload
    const rawPublicUrl = await this.storage.uploadFile(
      file.buffer,
      uniqueFileName,
      file.mimetype,
      { preserveName: true }
    );

    // 3b. Update database record with the resolved raw public URL
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { rawUrl: rawPublicUrl },
    });

    // 4. Queue Background Optimization Task
    await this.queueAssetOptimization({
      assetId,
      fileUrl: rawPublicUrl,
      type,
    });

    // 5. Dynamic Outputs Assembly (Querying ASSET_PRESETS)
    const preset = ASSET_PRESETS[type] || ASSET_PRESETS.general;
    const variants = Object.keys(preset) as ImageVariant[];

    const expectedOutputs = {} as Record<ImageVariant, string>;
    for (const variant of variants) {
      expectedOutputs[variant] = getStoragePublicUrl(
        getOptimizedAssetPath(type, assetId, variant)
      );
    }

    return {
      assetId,
      rawUrl: rawPublicUrl,
      expectedOutputs,
    };
  }
}
