import { Inject, Injectable, Logger } from '@nestjs/common';
import Valkey from 'iovalkey';
import { ProductsPrismaService } from '../../prisma/products-prisma.service';
import { GearType } from '../gear/common/enums/gear-type.enum';
import { VALKEY_CLIENT } from './valkey.constants';

export interface CachedBrand {
  id: string;
  name: string;
  slug: string;
}

const BRAND_KEYS: Record<string, string> = {
  all: 'brands',
  [GearType.HELMET]: 'brands:helmets',
};

@Injectable()
export class BrandCacheService {
  private readonly logger = new Logger(BrandCacheService.name);

  constructor(
    @Inject(VALKEY_CLIENT) private readonly client: Valkey,
    private readonly db: ProductsPrismaService,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────────

  async getBrands(category?: GearType): Promise<CachedBrand[]> {
    const key = (category && BRAND_KEYS[category]) ?? BRAND_KEYS.all;
    const raw = await this.client.get(key);
    if (!raw) {
      await this.reload();
      const reloaded = await this.client.get(key);
      return reloaded ? JSON.parse(reloaded) : [];
    }
    return JSON.parse(raw);
  }

  async reload(): Promise<void> {
    try {
      await Promise.all([this.loadAll(), this.loadByCategory(GearType.HELMET)]);
    } catch (err) {
      this.logger.error('Failed to reload brand cache', err);
    }
  }

  // ─── Private loaders ─────────────────────────────────────────────────────────

  private async loadAll(): Promise<void> {
    const brands = await this.db.brand.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    await this.client.set(BRAND_KEYS.all, JSON.stringify(brands));
  }

  private async loadByCategory(category: GearType): Promise<void> {
    const key = BRAND_KEYS[category];
    if (!key) return;

    const where = this.buildCategoryFilter(category);
    const brands = await this.db.brand.findMany({
      where: { deleted_at: null, ...where },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    await this.client.set(key, JSON.stringify(brands));
  }

  private buildCategoryFilter(category: GearType) {
    switch (category) {
      case GearType.HELMET:
        return { helmet_model: { some: { deleted_at: null } } };
      default:
        return {};
    }
  }
}
