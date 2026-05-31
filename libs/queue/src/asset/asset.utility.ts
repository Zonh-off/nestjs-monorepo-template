import { BadRequestException } from '@nestjs/common';
import { AssetType, ImageVariant } from './asset.types';
import { ASSET_SIZE_LIMITS } from './asset.config';

export const getOptimizedAssetPath = (
  type: AssetType,
  assetId: string,
  variant: ImageVariant
): string => {
  return `assets/${type}/${assetId}_${variant}.webp`;
};

export const createAssetId = (userId: string): string => {
  return `${userId}_${Date.now()}`;
};

export const getRawAssetPath = (
  type: AssetType,
  assetId: string,
  originalName: string
): string => {
  const lastDot = originalName.lastIndexOf('.');
  const fileExt = lastDot !== -1 ? originalName.substring(lastDot) : '';
  return `assets/${type}/${assetId}_raw${fileExt}`;
};

export const validateAssetSize = (
  sizeInBytes: number,
  type: AssetType
): void => {
  const maxMb = ASSET_SIZE_LIMITS[type];
  const maxBytes = maxMb * 1024 * 1024;
  if (sizeInBytes > maxBytes) {
    throw new BadRequestException(
      `File size (${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${maxMb}MB for type ${type}.`
    );
  }
};
