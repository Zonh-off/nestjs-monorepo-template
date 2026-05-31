import { env } from '@nestjs-monorepo-template/common';

/**
 * Resolve the public accessible URL path of an asset based on its key/path.
 * Supports both S3 URLs and local relative path URLs automatically.
 */
export const getStoragePublicUrl = (key: string): string => {
  if (env.STORAGE_PROVIDER === 's3') {
    if (env.STORAGE_S3_ENDPOINT) {
      return `${env.STORAGE_S3_ENDPOINT}/${env.STORAGE_S3_BUCKET}/${key}`;
    }
    return `https://${env.STORAGE_S3_BUCKET}.s3.${env.STORAGE_S3_REGION}.amazonaws.com/${key}`;
  }
  return `/uploads/${key}`;
};
