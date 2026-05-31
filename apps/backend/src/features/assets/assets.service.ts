import { Injectable } from '@nestjs/common';
import { StorageService, getStoragePublicUrl } from '@nestjs-monorepo-template/storage';
import { AssetQueueService, getRawAssetPath, getOptimizedAssetPath, createAssetId, AssetType, ImageVariant, validateAssetSize } from '@nestjs-monorepo-template/queue';

@Injectable()
export class AssetsService {
  constructor(
    private readonly storage: StorageService,
    private readonly assetQueueService: AssetQueueService
  ) { }

  async handleUploadAvatar(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    userId: string
  ) {
    const assetType: AssetType = 'avatar';

    // Enforce configured file size limit dynamically using the queue asset utility
    validateAssetSize(file.size, assetType);

    // Synchronize timestamp across raw and optimized variants via centralized config helper
    const assetId = createAssetId(userId);

    // Upload the original raw file using centralized path config helper
    const uniqueFileName = getRawAssetPath(assetType, assetId, file.originalname);
    const rawPublicUrl = await this.storage.uploadFile(
      file.buffer,
      uniqueFileName,
      file.mimetype,
      { preserveName: true }
    );

    // Queue background WebP optimization
    await this.assetQueueService.queueAssetOptimization({
      assetId,
      fileUrl: rawPublicUrl,
      type: assetType,
    });

    const variantOriginal: ImageVariant = 'original';
    const variantThumbnail: ImageVariant = 'thumbnail';

    return {
      success: true,
      message: 'Raw avatar uploaded and WebP background optimization queued successfully.',
      userId,
      rawUrl: rawPublicUrl,
      expectedOutputs: {
        original: getStoragePublicUrl(getOptimizedAssetPath(assetType, assetId, variantOriginal)),
        thumbnail: getStoragePublicUrl(getOptimizedAssetPath(assetType, assetId, variantThumbnail)),
      },
    };
  }
}
