import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@nestjs-monorepo-template/common';
import * as fs from 'fs';
import * as path from 'path';
import { getStoragePublicUrl } from './storage.config';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly localStorageDir = path.join(process.cwd(), 'public', 'uploads');

  onModuleInit() {
    if (env.STORAGE_PROVIDER === 's3') {
      this.logger.log('Initializing S3 Storage Client...');

      const s3Config: any = {
        region: env.STORAGE_S3_REGION,
        credentials: {
          accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
        },
      };

      if (env.STORAGE_S3_ENDPOINT) {
        s3Config.endpoint = env.STORAGE_S3_ENDPOINT;
        s3Config.forcePathStyle = true;
      }

      this.s3Client = new S3Client(s3Config);
    } else {
      this.logger.log(`Initializing Local Storage Client in: ${this.localStorageDir}`);

      if (!fs.existsSync(this.localStorageDir)) {
        fs.mkdirSync(this.localStorageDir, { recursive: true });
        this.logger.log('Created public uploads directory successfully.');
      }
    }
  }

  /**
   * Upload a raw file buffer to the active storage provider.
   * 
   * @param buffer - File Buffer data
   * @param originalName - Original file name (e.g. "avatar.png")
   * @param mimeType - MIME content type (e.g. "image/png")
   * @returns Public accessible URL path of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options?: { preserveName?: boolean }
  ): Promise<string> {
    const fileExt = path.extname(originalName);
    const isPath = originalName.includes('/') || originalName.includes('\\') || options?.preserveName;
    const targetKey = isPath ? originalName : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    if (env.STORAGE_PROVIDER === 's3' && this.s3Client) {
      this.logger.log(`Uploading ${originalName} to S3 bucket: ${env.STORAGE_S3_BUCKET}...`);

      const command = new PutObjectCommand({
        Bucket: env.STORAGE_S3_BUCKET,
        Key: targetKey,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      return getStoragePublicUrl(targetKey);
    } else {
      this.logger.log(`Uploading ${originalName} to Local Storage...`);

      const destinationPath = path.join(this.localStorageDir, targetKey);
      const parentDir = path.dirname(destinationPath);

      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
        this.logger.log(`Created nested local storage directory: ${parentDir}`);
      }

      await fs.promises.writeFile(destinationPath, buffer);

      return getStoragePublicUrl(targetKey);
    }
  }
}
