import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/products-client';
import { paginate } from '../../../../common/pagination';
import { ProductsPrismaService } from '../../../../prisma/products-prisma.service';
import { CatalogCacheService } from '../../../valkey/catalog-cache.service';
import { CreateHelmetVariantDto } from './dto/create-helmet-variant.dto';
import { UpdateHelmetVariantDto } from './dto/update-helmet-variant.dto';
import { FilterHelmetVariantsDto } from './dto/filter-helmet-variants.dto';

@Injectable()
export class HelmetVariantsService {
  constructor(
    private readonly db: ProductsPrismaService,
    private readonly cache: CatalogCacheService,
  ) {}

  async findAllAdmin(filters: FilterHelmetVariantsDto) {
    const where = this.buildPublicWhere(filters, true);

    const result = await paginate({
      model: this.db.helmet_model_variant,
      pagination: filters,
      where,
      orderBy: { color_name: 'asc' },
      include: this.buildAdminInclude(),
    });

    return {
      data: result.data.map((v) => this.mapAdminVariant(v)),
      meta: result.meta,
    };
  }

  async findAll(modelId: string, includeDeleted = false) {
    await this.assertModelExists(modelId);

    const variants = await this.db.helmet_model_variant.findMany({
      where: {
        helmet_id: modelId,
        ...(!includeDeleted && { deleted_at: null }),
      },
      include: {
        helmet_inventory: {
          include: {
            affiliate_store: true,
            helmet_size: true,
          },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { color_name: 'asc' },
    });

    return variants.map((v) => this.mapVariant(v));
  }

  async findOne(modelId: string, variantId: string) {
    const variant = await this.db.helmet_model_variant.findFirst({
      where: { id: variantId, helmet_id: modelId },
      include: {
        helmet_inventory: {
          include: {
            affiliate_store: true,
            helmet_size: true,
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!variant)
      throw new NotFoundException(
        `Variant #${variantId} not found for helmet #${modelId}`,
      );

    return this.mapVariant(variant);
  }

  async create(modelId: string, dto: CreateHelmetVariantDto) {
    await this.assertModelExists(modelId);

    const result = await this.db.helmet_model_variant.create({
      data: {
        helmet_id: modelId,
        color_name: dto.colorName,
        color_families: (dto.colorFamilies as any[]) ?? [],
        finish: dto.finish as any,
        graphic_name: dto.graphicName,
        sku: dto.sku,
        image_url: dto.images ?? [],
      },
    });
    this.cache.invalidateHelmet(modelId).catch(() => null);
    return result;
  }

  async update(modelId: string, variantId: string, dto: UpdateHelmetVariantDto) {
    await this.findOne(modelId, variantId);

    const result = await this.db.helmet_model_variant.update({
      where: { id: variantId },
      data: {
        ...(dto.colorName && { color_name: dto.colorName }),
        ...(dto.colorFamilies && { color_families: dto.colorFamilies as any[] }),
        ...(dto.finish && { finish: dto.finish as any }),
        ...(dto.graphicName !== undefined && { graphic_name: dto.graphicName }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.images !== undefined && { image_url: dto.images }),
        updated_at: new Date(),
      },
    });
    this.cache.invalidateHelmet(modelId).catch(() => null);
    return result;
  }

  async remove(modelId: string, variantId: string) {
    await this.findOne(modelId, variantId);
    await this.db.helmet_model_variant.update({
      where: { id: variantId },
      data: { deleted_at: new Date() },
    });
    this.cache.invalidateHelmet(modelId).catch(() => null);
  }

  async restore(modelId: string, variantId: string) {
    const variant = await this.db.helmet_model_variant.findFirst({
      where: { id: variantId, helmet_id: modelId },
    });
    if (!variant)
      throw new NotFoundException(
        `Variant #${variantId} not found for helmet #${modelId}`,
      );

    const result = await this.db.helmet_model_variant.update({
      where: { id: variantId },
      data: { deleted_at: null, updated_at: new Date() },
    });
    this.cache.invalidateHelmet(modelId).catch(() => null);
    return result;
  }

  // ─── Public helpers ───────────────────────────────────────────────────────

  private buildPublicWhere(filters: FilterHelmetVariantsDto, adminView = false): Prisma.helmet_model_variantWhereInput {
    const showDeleted = adminView && filters.includeDeleted;
    const hasInventoryFilter =
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStock !== undefined ||
      filters.sizeLabel !== undefined;

    return {
      ...(!showDeleted && { deleted_at: null }),

      // Variant filters
      ...(filters.colorFamily && {
        color_families: filters.mono
          ? // Modo mono: exactamente ese color (sin multicolor)
            { equals: [filters.colorFamily as any] }
          : // Modo normal: tiene ese color entre otros
            { has: filters.colorFamily as any },
      }),
      ...(filters.finish && { finish: filters.finish as any }),

      // Model filters
      helmet_model: {
        ...(!showDeleted && { deleted_at: null }),
        ...(filters.modelId && { id: filters.modelId }),
        ...(filters.brandSlug && { brand: { slug: filters.brandSlug, deleted_at: null } }),
        ...(filters.type?.length && { helmet_type: { hasSome: filters.type as any[] } }),
        ...(filters.shellMaterial?.length && { shell_material: { hasSome: filters.shellMaterial as any[] } }),
        ...(filters.closureType && { closure_type: filters.closureType as any }),
        ...(filters.visorPinlockCompatible?.length && { visor_pinlock_compatible: { hasSome: filters.visorPinlockCompatible as any[] } }),
        ...(filters.visorPinlockIncluded !== undefined && { visor_pinlock_included: filters.visorPinlockIncluded }),
        ...(filters.tearOffCompatible !== undefined && { tear_off_compatible: filters.tearOffCompatible }),
        ...(filters.certification?.length && { certification: { hasEvery: filters.certification as any[] } }),
        ...(filters.sunVisor !== undefined && { sun_visor: filters.sunVisor }),
        ...(filters.intercomReady !== undefined && { intercom_ready: filters.intercomReady }),
        ...(filters.visorAntiScratch !== undefined && { visor_anti_scratch: filters.visorAntiScratch }),
        ...(filters.visorAntiFog !== undefined && { visor_anti_fog: filters.visorAntiFog }),
        ...(filters.removableLining !== undefined && { removable_lining: filters.removableLining }),
        ...(filters.washableLining !== undefined && { washable_lining: filters.washableLining }),
        ...(filters.emergencyRelease !== undefined && { emergency_release: filters.emergencyRelease }),
        ...(filters.minSafetyRating && { safety_rating: { gte: filters.minSafetyRating } }),
        ...(filters.maxWeightGrams && { weight_grams: { lte: filters.maxWeightGrams } }),
        ...(filters.minShellSizes && { shell_sizes: { gte: filters.minShellSizes } }),
      },

      // Inventory filters
      ...(hasInventoryFilter && {
        helmet_inventory: {
          some: {
            ...(filters.inStock !== undefined && { in_stock: filters.inStock }),
            ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
            ...(filters.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
            ...(filters.sizeLabel && { helmet_size: { size_label: filters.sizeLabel } }),
          },
        },
      }),

      // Search (OR across variant + model fields)
      ...(filters.search && {
        OR: [
          { color_name: { contains: filters.search, mode: 'insensitive' } },
          { graphic_name: { contains: filters.search, mode: 'insensitive' } },
          { helmet_model: { name: { contains: filters.search, mode: 'insensitive' } } },
          { helmet_model: { brand: { name: { contains: filters.search, mode: 'insensitive' } } } },
        ],
      }),
    };
  }

  private buildAdminInclude() {
    return {
      helmet_model: {
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          helmet_model_size: { select: { id: true, size_label: true } },
        },
      },
      helmet_inventory: {
        select: {
          id: true,
          price: true,
          currency: true,
          in_stock: true,
          affiliate_url: true,
          last_checked: true,
          helmet_size: { select: { id: true, size_label: true } },
          affiliate_store: { select: { id: true, name: true, domain: true } },
        },
        orderBy: { price: 'asc' as const },
        take: 10, // Limitar a top 10 tiendas por precio
      },
    };
  }

  private mapAdminVariant(v: any) {
    const inventory = v.helmet_inventory ?? [];
    const prices = inventory.map((i: any) => Number(i.price)).filter(Boolean);
    const m = v.helmet_model;

    return {
      id: v.id,
      sku: v.sku,
      colorName: v.color_name,
      colorFamilies: v.color_families,
      finish: v.finish,
      graphicName: v.graphic_name,
      images: v.image_url,
      deletedAt: v.deleted_at,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      model: {
        id: m.id,
        name: m.name,
        slug: m.slug,
        brand: m.brand,
        type: m.helmet_type,
        safetyRating: m.safety_rating,
        shellMaterial: m.shell_material,
        shellSizes: m.shell_sizes,
        weightGrams: m.weight_grams,
        features: {
          visorAntiScratch: m.visor_anti_scratch,
          visorAntiFog: m.visor_anti_fog,
          visorPinlockCompatible: m.visor_pinlock_compatible,
          visorPinlockIncluded: m.visor_pinlock_included,
          pinlockDksCode: m.pinlock_dks_code,
          tearOffCompatible: m.tear_off_compatible,
          sunVisor: m.sun_visor,
          sunVisorType: m.sun_visor_type,
          intercomReady: m.intercom_ready,
          intercomDesignedBrand: m.intercom_designed_brand,
          intercomDesignedModel: m.intercom_designed_model,
          removableLining: m.removable_lining,
          washableLining: m.washable_lining,
          emergencyRelease: m.emergency_release,
          closureType: m.closure_type,
        },
        certification: m.certification,
        includedAccessories: m.included_accessories,
        sizes: m.helmet_model_size?.map((s: any) => ({ id: s.id, sizeLabel: s.size_label })),
        deletedAt: m.deleted_at,
      },
      inventory: inventory.map((i: any) => ({
        id: i.id,
        size: i.helmet_size ? { id: i.helmet_size.id, sizeLabel: i.helmet_size.size_label } : null,
        price: Number(i.price),
        currency: i.currency,
        inStock: i.in_stock,
        affiliateUrl: i.affiliate_url,
        lastChecked: i.last_checked,
        store: i.affiliate_store,
      })),
      priceFrom: prices.length ? Math.min(...prices) : null,
      inStock: inventory.some((i: any) => i.in_stock),
    };
  }


  private async assertModelExists(modelId: string) {
    const model = await this.db.helmet_model.findUnique({
      where: { id: modelId },
    });
    if (!model)
      throw new NotFoundException(`Helmet model #${modelId} not found`);
  }

  private mapVariant(v: any) {
    return {
      id: v.id,
      colorName: v.color_name,
      colorFamilies: v.color_families,
      finish: v.finish,
      graphicName: v.graphic_name,
      sku: v.sku,
      images: v.image_url,
      deletedAt: v.deleted_at,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      inventory: (v.helmet_inventory ?? []).map((i: any) => ({
        id: i.id,
        size: i.helmet_size
          ? { id: i.helmet_size.id, sizeLabel: i.helmet_size.size_label }
          : null,
        price: Number(i.price),
        currency: i.currency,
        inStock: i.in_stock,
        affiliateUrl: i.affiliate_url,
        lastChecked: i.last_checked,
        store: {
          id: i.affiliate_store.id,
          name: i.affiliate_store.name,
          domain: i.affiliate_store.domain,
        },
      })),
    };
  }
}
