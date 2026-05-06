import {Injectable, Logger} from '@nestjs/common';
import * as sharp from 'sharp';
import {S3Service} from '../s3/s3.service';
import {getMaxQualityUrl} from './cdn-url-transformers';

const SIZES = [140, 200, 400, 600, 800, 1200, 1400, 1600] as const;
const QUALITY = 90;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CdnImagesService {
  private readonly logger = new Logger(CdnImagesService.name);

  constructor(private readonly s3: S3Service) {}

  /**
   * Download, resize to all sizes, and upload a variant's images to S3.
   * Returns CDN base keys (e.g. "helmets/agv/k6/<variantId>/0").
   * Idempotent — skips sizes already in S3.
   */
  async processVariantImages(
    imageUrls: string[],
    brandSlug: string,
    modelSlug: string,
    variantId: string,
  ): Promise<string[]> {
      return await Promise.all(
        imageUrls.map((url, idx) =>
            this.processImage(url, `helmets/${brandSlug}/${modelSlug}/${variantId}/${idx}`),
        ),
    );
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async processImage(sourceUrl: string, baseKey: string): Promise<string> {
    const maxQualityUrl = getMaxQualityUrl(sourceUrl);

    this.logger.debug(`Downloading ${maxQualityUrl}`);

    const res = await fetch(maxQualityUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; moto-gear-picker/1.0)' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} downloading image: ${maxQualityUrl}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    this.logger.debug(`${meta.width}x${meta.height} ${meta.format} → ${SIZES.join('/')}px WebP`);

    await Promise.all(
      SIZES.map(async (size) => {
        const key = `${baseKey}/${size}.webp`;

        const exists = await this.s3.exists(key);
        if (exists) return;

        const resized = await sharp(buffer)
          .resize({ width: size, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer();

        await this.s3.putBuffer(key, resized, 'image/webp');
        this.logger.debug(`Uploaded ${key} (${resized.length} bytes)`);
      }),
    );

    return baseKey;
  }
}
