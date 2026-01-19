import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ReportingStorage {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          }
        : undefined,
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    });
  }

  async storeCsv(jobId: string, csv: string): Promise<{ bucket: string; key: string }> {
    const bucket = this.getBucket();
    const key = this.buildKey(jobId);
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: csv,
        ContentType: 'text/csv',
      }),
    );
    return { bucket, key };
  }

  async getDownloadUrl(bucket: string, key: string): Promise<string> {
    const expiresIn = Number(process.env.REPORTING_DOWNLOAD_TTL_SEC ?? 900);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    );
  }

  private getBucket(): string {
    const bucket = process.env.REPORTING_S3_BUCKET;
    if (!bucket) {
      throw new Error('REPORTING_S3_BUCKET not configured');
    }
    return bucket;
  }

  private buildKey(jobId: string): string {
    const prefix = process.env.REPORTING_S3_PREFIX ?? 'reports/';
    const safePrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return `${safePrefix}${jobId}.csv`;
  }
}
