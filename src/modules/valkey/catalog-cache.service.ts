import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Valkey from 'iovalkey';
import { ProductsPrismaService } from '../../prisma/products-prisma.service';
import { VALKEY_CLIENT } from './valkey.module';

export interface CachedVariantFilter {
  colorFamilies: string[];
  finish: string | null;
}

export interface CachedCatalogItem {
  id: string;
  slug: string;
  name: string;
  brand: { id: string; name: string; slug: string };
  type: string[];
  safetyRating: number | null;
  shellMaterial: string[];
  shellSizes: number | null;
  weightGrams: number | null;
  features: {
    visorAntiScratch: boolean;
    visorAntiFog: boolean;
    visorPinlockCompatible: string[];
    visorPinlockIncluded: boolean;
    pinlockDksCode: string | null;
    tearOffCompatible: boolean;
    sunVisor: boolean;
    sunVisorType: string | null;
    intercomReady: boolean;
    intercomDesignedBrand: string | null;
    intercomDesignedModel: string | null;
    removableLining: boolean;
    washableLining: boolean;
    emergencyRelease: boolean;
    closureType: string | null;
  };
  certification: string[];
  includedAccessories: string[];
  variantsCount: number;
  variantImages: { colorName: string; image: string | null }[];
  priceFrom: number | null;
  currency: string | null;
  _variants: CachedVariantFilter[];
}

const CATALOG_KEY = 'catalog:helmets';
const detailKey = (brandSlug: string, modelSlug: string) => `helmet:${brandSlug}:${modelSlug}`;

@Injectable()
export class CatalogCacheService implements OnModuleInit {
  private readonly logger = new Logger(CatalogCacheService.name);

  constructor(
    @Inject(VALKEY_CLIENT) private readonly client: Valkey,
    private readonly db: ProductsPrismaService,
  ) {}

  async onModuleInit() {
    await this.reloadAll();
  }

  @Cron('*/30 * * * *')
  async scheduledReload() {
    this.logger.log('Scheduled catalog reload started');
    await this.reloadAll();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  async getCatalog(): Promise<CachedCatalogItem[]> {
    const raw = await this.client.get(CATALOG_KEY);
    if (!raw) {
      await this.loadCatalog();
      const reloaded = await this.client.get(CATALOG_KEY);
      return reloaded ? JSON.parse(reloaded) : [];
    }
    return JSON.parse(raw);
  }

  async getHelmetDetail(brandSlug: string, modelSlug: string): Promise<any | null> {
    const raw = await this.client.get(detailKey(brandSlug, modelSlug));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async invalidateHelmet(modelId: string): Promise<void> {
    try {
      const model = await this.db.helmet_model.findUnique({
        where: { id: modelId },
        include: { brand: { select: { slug: true } } },
      });

      if (model) {
        await this.client.del(detailKey(model.brand.slug, model.slug));
        await this.loadOneDetail(model.brand.slug, model.slug);
      }

      await this.loadCatalog();
    } catch (err) {
      this.logger.error(`Failed to invalidate helmet ${modelId}`, err);
    }
  }

  async reloadAll(): Promise<void> {
    try {
      await Promise.all([this.loadCatalog(), this.loadAllDetails()]);
      this.logger.log('Catalog cache reload complete');
    } catch (err) {
      this.logger.error('Catalog cache reload failed', err);
    }
  }

  // ─── Private loaders ─────────────────────────────────────────────────────────

  private async loadCatalog(): Promise<void> {
    const models = await this.db.helmet_model.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        helmet_model_variant: {
          where: { deleted_at: null },
          select: {
            color_name: true,
            color_families: true,
            finish: true,
            image_url: true,
            helmet_inventory: {
              select: { price: true, currency: true },
              orderBy: { price: 'asc' as const },
              take: 1,
            },
          },
          orderBy: { color_name: 'asc' as const },
        },
        _count: {
          select: { helmet_model_variant: { where: { deleted_at: null } } },
        },
      },
    });

    const items: CachedCatalogItem[] = models.map((m) => this.mapCatalogItem(m));
    await this.client.set(CATALOG_KEY, JSON.stringify(items));
  }

  private async loadAllDetails(): Promise<void> {
    const models = await this.db.helmet_model.findMany({
      where: { deleted_at: null },
      include: this.detailInclude(),
    });

    if (!models.length) return;

    const pipeline = this.client.pipeline();
    for (const m of models) {
      pipeline.set(detailKey(m.brand.slug, m.slug), JSON.stringify(this.mapDetailItem(m)));
    }
    await pipeline.exec();
  }

  private async loadOneDetail(brandSlug: string, modelSlug: string): Promise<void> {
    const model = await this.db.helmet_model.findFirst({
      where: { slug: modelSlug, brand: { slug: brandSlug }, deleted_at: null },
      include: this.detailInclude(),
    });

    if (model) {
      await this.client.set(detailKey(brandSlug, modelSlug), JSON.stringify(this.mapDetailItem(model)));
    }
  }

  // ─── DB includes ─────────────────────────────────────────────────────────────

  private detailInclude() {
    return {
      brand: { select: { id: true, name: true, slug: true } },
      helmet_model_size: { select: { id: true, size_label: true } },
      helmet_model_variant: {
        where: { deleted_at: null },
        include: {
          helmet_inventory: {
            select: {
              price: true,
              currency: true,
              in_stock: true,
              affiliate_url: true,
              last_checked: true,
              helmet_size: { select: { id: true, size_label: true } },
              affiliate_store: { select: { id: true, name: true, domain: true } },
            },
            orderBy: { price: 'asc' as const },
          },
        },
        orderBy: { color_name: 'asc' as const },
      },
      _count: {
        select: { helmet_model_variant: { where: { deleted_at: null } } },
      },
    };
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────────

  private mapCatalogItem(raw: any): CachedCatalogItem {
    const variants = raw.helmet_model_variant ?? [];
    const allInventory = variants.flatMap((v: any) => v.helmet_inventory ?? []);
    const prices = allInventory.map((i: any) => Number(i.price)).filter(Boolean);
    const lowestInventory = [...allInventory].sort((a: any, b: any) => Number(a.price) - Number(b.price))[0];

    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      brand: raw.brand,
      type: raw.helmet_type ?? [],
      safetyRating: raw.safety_rating,
      shellMaterial: raw.shell_material ?? [],
      shellSizes: raw.shell_sizes,
      weightGrams: raw.weight_grams,
      features: {
        visorAntiScratch: raw.visor_anti_scratch,
        visorAntiFog: raw.visor_anti_fog,
        visorPinlockCompatible: raw.visor_pinlock_compatible ?? [],
        visorPinlockIncluded: raw.visor_pinlock_included,
        pinlockDksCode: raw.pinlock_dks_code,
        tearOffCompatible: raw.tear_off_compatible,
        sunVisor: raw.sun_visor,
        sunVisorType: raw.sun_visor_type,
        intercomReady: raw.intercom_ready,
        intercomDesignedBrand: raw.intercom_designed_brand,
        intercomDesignedModel: raw.intercom_designed_model,
        removableLining: raw.removable_lining,
        washableLining: raw.washable_lining,
        emergencyRelease: raw.emergency_release,
        closureType: raw.closure_type,
      },
      certification: raw.certification ?? [],
      includedAccessories: raw.included_accessories ?? [],
      variantsCount: raw._count?.helmet_model_variant ?? 0,
      variantImages: variants.map((v: any) => ({
        colorName: v.color_name,
        image: v.image_url?.[0] ?? null,
      })),
      priceFrom: prices.length ? Math.min(...prices) : null,
      currency: lowestInventory?.currency ?? null,
      _variants: variants.map((v: any) => ({
        colorFamilies: v.color_families ?? [],
        finish: v.finish ?? null,
      })),
    };
  }

  private mapDetailItem(raw: any) {
    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      brand: raw.brand,
      type: raw.helmet_type ?? [],
      safetyRating: raw.safety_rating,
      shellMaterial: raw.shell_material ?? [],
      shellSizes: raw.shell_sizes,
      weightGrams: raw.weight_grams,
      features: {
        visorAntiScratch: raw.visor_anti_scratch,
        visorAntiFog: raw.visor_anti_fog,
        visorPinlockCompatible: raw.visor_pinlock_compatible ?? [],
        visorPinlockIncluded: raw.visor_pinlock_included,
        pinlockDksCode: raw.pinlock_dks_code,
        tearOffCompatible: raw.tear_off_compatible,
        sunVisor: raw.sun_visor,
        sunVisorType: raw.sun_visor_type,
        intercomReady: raw.intercom_ready,
        intercomDesignedBrand: raw.intercom_designed_brand,
        intercomDesignedModel: raw.intercom_designed_model,
        removableLining: raw.removable_lining,
        washableLining: raw.washable_lining,
        emergencyRelease: raw.emergency_release,
        closureType: raw.closure_type,
      },
      certification: raw.certification ?? [],
      includedAccessories: raw.included_accessories ?? [],
      variantsCount: raw._count?.helmet_model_variant ?? 0,
      sizes: (raw.helmet_model_size ?? []).map((s: any) => ({
        id: s.id,
        sizeLabel: s.size_label,
      })),
      variants: (raw.helmet_model_variant ?? []).map((v: any) => {
        const inventory = v.helmet_inventory ?? [];
        const prices = inventory.map((i: any) => Number(i.price)).filter(Boolean);
        return {
          id: v.id,
          colorName: v.color_name,
          colorFamilies: v.color_families ?? [],
          finish: v.finish,
          graphicName: v.graphic_name,
          images: v.image_url ?? [],
          inventory: inventory.map((i: any) => ({
            size: i.helmet_size ? { id: i.helmet_size.id, sizeLabel: i.helmet_size.size_label } : null,
            store: i.affiliate_store ?? null,
            price: Number(i.price),
            currency: i.currency,
            inStock: i.in_stock,
            affiliateUrl: i.affiliate_url ?? null,
            lastChecked: i.last_checked ?? null,
          })),
          priceFrom: prices.length ? Math.min(...prices) : null,
          inStock: inventory.some((i: any) => i.in_stock),
        };
      }),
    };
  }
}
