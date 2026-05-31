import { AssetType, ImageVariant } from './asset.types';

export interface VariantSpec {
  width?: number;
  height?: number;
  quality: number;
}

export const ASSET_PRESETS: Record<AssetType, Partial<Record<ImageVariant, VariantSpec>>> = {
  avatar: {
    thumbnail: { width: 128, height: 128, quality: 75 },
    original: { width: 512, height: 512, quality: 85 }, // Square avatar
  },
  banner: {
    fhd: { width: 1920, height: 640, quality: 85 },   // Wider aspect ratio (3:1)
    hd: { width: 1280, height: 420, quality: 85 },
    original: { quality: 85 },                        // Keep original aspect ratio
  },
  post: {
    fhd: { width: 1920, quality: 85 },                // Default aspect ratio (scale by width)
    hd: { width: 1280, quality: 85 },
    sd: { width: 640, quality: 80 },
    original: { quality: 85 },
  },
  general: {
    original: { quality: 85 },
  },
};

export const ASSET_SIZE_LIMITS: Record<AssetType, number> = {
  avatar: 5,   // 5 MB max
  banner: 10,  // 10 MB max
  post: 20,    // 20 MB max
  general: 15, // 15 MB max
};
