import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { CreatePresignedUploadDto } from './uploads.dto';

@Injectable()
export class AppService {
  private readonly bucket = process.env.S3_BUCKET ?? 'market-ai-products';
  private readonly endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000';
  private readonly publicEndpoint =
    process.env.S3_PUBLIC_ENDPOINT ?? this.endpoint;
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: this.endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    },
  });
  private bucketReady: Promise<void> | null = null;

  getHello(): string {
    return 'Storage service is running';
  }

  async createPresignedUpload(dto: CreatePresignedUploadDto) {
    await this.ensureBucketReady();

    const key = buildObjectKey(dto.folder, dto.fileName);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: Number(process.env.S3_UPLOAD_URL_TTL_SECONDS ?? 300),
    });

    return {
      key,
      uploadUrl,
      publicUrl: buildPublicUrl(this.publicEndpoint, this.bucket, key),
    };
  }

  private ensureBucketReady() {
    this.bucketReady ??= this.prepareBucket();
    return this.bucketReady;
  }

  private async prepareBucket() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }

    await this.configurePublicReadPolicy();
    await this.configureCors();
  }

  private async configurePublicReadPolicy() {
    try {
      await this.s3.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          }),
        }),
      );
    } catch (error) {
      this.handleOptionalBucketConfigError('public read policy', error);
    }
  }

  private async configureCors() {
    try {
      await this.s3.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'HEAD'],
                AllowedOrigins: [
                  process.env.ADMIN_CLIENT_URL ?? 'http://127.0.0.1:5173',
                  process.env.CLIENT_URL ?? 'http://127.0.0.1:3000',
                  'http://localhost:5173',
                  'http://127.0.0.1:5173',
                  'http://localhost:3000',
                  'http://127.0.0.1:3000',
                ],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        }),
      );
    } catch (error) {
      this.handleOptionalBucketConfigError('CORS', error);
    }
  }

  private handleOptionalBucketConfigError(step: string, error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown S3 configuration error';

    if (process.env.S3_STRICT_BUCKET_CONFIG === 'true') {
      throw new InternalServerErrorException(
        `Failed to configure S3 bucket ${step}: ${message}`,
      );
    }

    console.warn(
      `Skipping optional S3 bucket ${step} configuration: ${message}`,
    );
  }
}

function buildObjectKey(folder: string | undefined, fileName: string) {
  const safeFolder = (folder ?? 'uploads')
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, '-')
    .replace(/^\/+|\/+$/g, '');
  const extension = extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');

  return `${safeFolder || 'uploads'}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
}

function buildPublicUrl(endpoint: string, bucket: string, key: string) {
  return `${endpoint.replace(/\/+$/g, '')}/${bucket}/${key
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}
