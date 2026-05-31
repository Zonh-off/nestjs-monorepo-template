import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ASSET_QUEUE, OptimizeAssetPayload } from './asset.types';

@Injectable()
export class AssetQueueService {
  private readonly logger = new Logger(AssetQueueService.name);

  constructor(
    @InjectQueue(ASSET_QUEUE) private readonly assetQueue: Queue
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
}
