import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/products-client';
import { paginate } from '../../../../common/pagination';
import { ProductsPrismaService } from '../../../../prisma/products-prisma.service';
import { FilterHelmetModelsDto } from './dto/filter-helmet-models.dto';

@Injectable()
export class HelmetModelsService {
  constructor(private readonly db: ProductsPrismaService) {}

  async findAll(filters: FilterHelmetModelsDto) {
    const where = this.buildWhere(filters);

    const result = await paginate({
      model: this.db.helmet_model,
      pagination: filters,
      where,
      orderBy: { name: 'asc' },
      include: this.buildListInclude(filters),
    });

    return {
      data: result.data.map((item) => this.mapListItem(item)),
      meta: result.meta,
    };
  }

  async findOneBySlug(brandSlug: string, modelSlug: string) {
    const item = await this.db.helmet_model.findFirst({
      where: {
        slug: modelSlug,
        brand: { slug: brandSlug },
        deleted_at: null,
      },
      include: this.buildDetailInclude(),
    });

    if (!item) throw new NotFoundException(`Helmet model '${modelSlug}' not found`);

    return this.mapDetail(item);
  }

  // ─── Where ───────────────────────────────────────────────────────────────────

  private buildWhere(filters: FilterHelmetModelsDto): Prisma.helmet_modelWhereInput {
    const hasVariantFilters = this.hasVariantFilters(filters);

    return {
      deleted_at: null,
      ...(filters.brandSlug && { brand: { slug: filters.brandSlug, deleted_at: null } }),
      ...(filters.type?.length && { helmet_type: { hasSome: filters.type as any[] } }),
      ...(filters.shellMaterial?.length && { shell_material: { hasSome: filters.shellMaterial as any[] } }),
      ...(filters.closureType && { closure_type: filters.closureType as any }),
      ...(filters.visorPinlockCompatible?.length && { visor_pinlock_compatible: { hasSome: filters.visorPinlockCompatible as any[] } }),
      ...(filters.visorPinlockIncluded !== undefined && { visor_pinlock_included: filters.visorPinlockIncluded }),
      ...(filters.tearOffCompatible !== undefined && { tear_off_compatible: filters.tearOffCompatible }),
      ...(filters.sunVisor !== undefined && { sun_visor: filters.sunVisor }),
      ...(filters.intercomReady !== undefined && { intercom_ready: filters.intercomReady }),
      ...(filters.emergencyRelease !== undefined && { emergency_release: filters.emergencyRelease }),
      ...(filters.minSafetyRating && { safety_rating: { gte: filters.minSafetyRating } }),
      ...(filters.maxWeightGrams && { weight_grams: { lte: filters.maxWeightGrams } }),
      ...(filters.minShellSizes && { shell_sizes: { gte: filters.minShellSizes } }),
      ...(filters.certification?.length && { certification: { hasEvery: filters.certification as any[] } }),
      ...(hasVariantFilters && {
        helmet_model_variant: {
          some: {
            deleted_at: null,
            ...this.buildVariantFilter(filters),
          },
        },
      }),
    };
  }

  // ─── Includes ────────────────────────────────────────────────────────────────

  private buildListInclude(filters: FilterHelmetModelsDto): Prisma.helmet_modelInclude {
    const variantWhere = this.buildVariantWhere(filters);

    return {
      brand: { select: { id: true, name: true, slug: true } },
      helmet_model_variant: {
        where: variantWhere,
        take: 1,
        select: {
          id: true,
          image_url: true,
          helmet_inventory: {
            select: {
              price: true,
              currency: true,
            },
            orderBy: { price: 'asc' },
            take: 1,
          },
        },
        orderBy: { color_name: 'asc' },
      },
      _count: {
        select: {
          helmet_model_variant: { where: variantWhere },
        },
      },
    };
  }

  private buildDetailInclude(): Prisma.helmet_modelInclude {
    return {
      brand: { select: { id: true, name: true, slug: true } },
      helmet_model_size: { select: { id: true, size_label: true } },
      helmet_model_variant: {
        where: { deleted_at: null },
        select: {
          id: true,
          color_name: true,
          color_families: true,
          finish: true,
          graphic_name: true,
          image_url: true,
          helmet_inventory: {
            select: {
              price: true,
              currency: true,
              in_stock: true,
              helmet_size: { select: { id: true, size_label: true } },
            },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { color_name: 'asc' },
      },
      _count: {
        select: {
          helmet_model_variant: { where: { deleted_at: null } },
        },
      },
    };
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────────

  private mapListItem(raw: any) {
    const variant = raw.helmet_model_variant?.[0];
    const lowestPrice = variant?.helmet_inventory?.[0];

    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      brand: raw.brand,
      type: raw.helmet_type,
      safetyRating: raw.safety_rating,
      shellMaterial: raw.shell_material,
      shellSizes: raw.shell_sizes,
      weightGrams: raw.weight_grams,
      features: this.mapFeatures(raw),
      certification: raw.certification,
      includedAccessories: raw.included_accessories,
      variantsCount: raw._count?.helmet_model_variant ?? 0,
      images: variant?.image_url ?? [],
      priceFrom: lowestPrice ? Number(lowestPrice.price) : null,
      currency: lowestPrice?.currency ?? null,
    };
  }

  private mapDetail(raw: any) {
    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      brand: raw.brand,
      type: raw.helmet_type,
      safetyRating: raw.safety_rating,
      shellMaterial: raw.shell_material,
      shellSizes: raw.shell_sizes,
      weightGrams: raw.weight_grams,
      features: this.mapFeatures(raw),
      certification: raw.certification,
      includedAccessories: raw.included_accessories,
      variantsCount: raw._count?.helmet_model_variant ?? 0,
      sizes: raw.helmet_model_size.map((s: any) => ({
        id: s.id,
        sizeLabel: s.size_label,
      })),
      variants: raw.helmet_model_variant.map((v: any) => this.mapVariant(v)),
    };
  }

  private mapVariant(v: any) {
    const allInventory = v.helmet_inventory ?? [];
    const prices = allInventory.map((i: any) => Number(i.price)).filter(Boolean);

    return {
      id: v.id,
      colorName: v.color_name,
      colorFamilies: v.color_families,
      finish: v.finish,
      graphicName: v.graphic_name,
      images: v.image_url,
      inventory: allInventory.map((i: any) => ({
        size: i.helmet_size ? { id: i.helmet_size.id, sizeLabel: i.helmet_size.size_label } : null,
        price: Number(i.price),
        currency: i.currency,
        inStock: i.in_stock,
      })),
      priceFrom: prices.length ? Math.min(...prices) : null,
      inStock: allInventory.some((i: any) => i.in_stock),
    };
  }

  private mapFeatures(raw: any) {
    return {
      visorAntiScratch: raw.visor_anti_scratch,
      visorAntiFog: raw.visor_anti_fog,
      visorPinlockCompatible: raw.visor_pinlock_compatible,
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
    };
  }

  // ─── Variant filter helpers ───────────────────────────────────────────────────

  private hasVariantFilters(filters?: FilterHelmetModelsDto): boolean {
    if (!filters) return false;
    return !!(filters.colorFamily?.length) || filters.mono === true || !!(filters.finish?.length);
  }

  private buildVariantFilter(filters: FilterHelmetModelsDto): Prisma.helmet_model_variantWhereInput {
    const colors = filters.colorFamily;
    const mono = filters.mono;

    let colorWhere: Prisma.helmet_model_variantWhereInput = {};
    if (mono && colors?.length) {
      colorWhere = { OR: colors.map((c) => ({ color_families: { equals: [c as any] } })) };
    } else if (colors?.length) {
      colorWhere = { color_families: { hasSome: colors as any[] } };
    }

    return {
      ...colorWhere,
      ...(filters.finish?.length && { finish: { in: filters.finish as any[] } }),
    };
  }

  private buildVariantWhere(filters?: FilterHelmetModelsDto): Prisma.helmet_model_variantWhereInput {
    return {
      deleted_at: null,
      ...(this.hasVariantFilters(filters) && filters && this.buildVariantFilter(filters)),
    };
  }
}
