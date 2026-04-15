import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { PutObjectCommand, S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { createS3Client, S3_BUCKET } from '../../config/s3.config';
import * as crypto from 'crypto';
import * as path from 'path';
import { optionalEnv } from '../../config/util';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client = createS3Client();
  private readonly bucket: string = S3_BUCKET();

  async onModuleInit() {
    const endpoint = optionalEnv('S3_ENDPOINT', '(no configurado)');
    const bucket = this.bucket;

    this.logger.log(`S3 iniciado — endpoint: ${endpoint} | bucket: ${bucket}`);

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`S3 OK — bucket "${bucket}" accesible`);
    } catch (err: any) {
      this.logger.warn(`S3 advertencia al verificar bucket "${bucket}": ${this.describeError(err)}`);
    }
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${crypto.randomUUID()}${ext}`;

    this.logger.log(`Subiendo archivo a S3 — key: ${key} | tipo: ${file.mimetype} | tamaño: ${file.size} bytes`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err: any) {
      const detail = this.describeError(err);
      this.logger.error(`Error subiendo a S3 — key: ${key} | ${detail}`, err?.stack);
      throw new InternalServerErrorException(`Error al subir imagen: ${detail}`);
    }

    this.logger.log(`Archivo subido OK — key: ${key}`);
    return key;
  }

  private describeError(err: any): string {
    const code: string = err?.Code ?? err?.code ?? err?.name ?? '';
    const message: string = err?.message ?? String(err);

    if (code === 'NoSuchBucket') return `Bucket "${this.bucket}" no existe`;
    if (code === 'AccessDenied' || code === 'InvalidAccessKeyId')
      return `Credenciales S3 inválidas (${code})`;
    if (code === 'SignatureDoesNotMatch') return `S3_SECRET_ACCESS_KEY incorrecto`;
    if (message.includes('EPROTO') || message.includes('SSL') || message.includes('handshake'))
      return `Fallo SSL — verifica que S3_ENDPOINT empiece con https:// y sea correcto. Endpoint actual: ${optionalEnv('S3_ENDPOINT', '(no configurado)')}`;
    if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED'))
      return `No se pudo conectar al endpoint S3 — verifica S3_ENDPOINT. Valor actual: ${optionalEnv('S3_ENDPOINT', '(no configurado)')}`;

    return `${code ? `[${code}] ` : ''}${message}`;
  }
}
