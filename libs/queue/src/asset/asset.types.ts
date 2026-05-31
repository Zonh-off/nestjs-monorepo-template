export const ASSET_QUEUE = 'asset';

export type AssetType = 'avatar' | 'banner' | 'post' | 'general';

export type ImageVariant = 'fhd' | 'hd' | 'sd' | 'thumbnail' | 'original';

export interface OptimizeAssetPayload {
  assetId: string;
  fileUrl: string;
  type: AssetType;
  width?: number;
  height?: number;
  quality?: number;
}
