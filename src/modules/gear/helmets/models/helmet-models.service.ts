import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/products-client';
import { paginate } from '../../../../common/pagination';
import { ProductsPrismaService } from '../../../../prisma/products-prisma.service';
import { FilterHelmetModelsDto } from './dto/filter-helmet-models.dto';
import { CreateHelmetModelDto } from './dto/create-helmet-model.dto';
import { UpdateHelmetModelDto } from './dto/update-helmet-model.dto';
import { FilterHelmetModelsAdminDto } from './dto/filter-helmet-models-admin.dto';

@Injectable()
export class HelmetModelsService {
  constructor(private readonly db: ProductsPrismaService) {}

  findBrands() {
    return this.db.brand.findMany({
      where: {
        deleted_at: null,
        helmet_model: { some: { deleted_at: null } },
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(filters: FilterHelmetModelsDto, adminView = false) {
    const where = this.buildWhere(filters, adminView);

    const result = await paginate({
      model: this.db.helmet_model,
      pagination: filters,
      where,
      orderBy: { name: 'asc' },
      include: this.buildInclude(adminView),
    });

    return {
      data: result.data.map((item) => this.mapResponse(item, adminView)),
      meta: result.meta,
    };
  }

  async findOne(id: string, adminView = false) {
    const item = await this.db.helmet_model.findUnique({
      where: { id },
      include: this.buildInclude(adminView),
    });

    if (!item || (!adminView && item.deleted_at))
      throw new NotFoundException(`Helmet model #${id} not found`);

    return this.mapResponse(item, adminView);
  }

  async create(dto: CreateHelmetModelDto) {
    return this.db.helmet_model.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        brand_id: dto.brandId,
        helmet_type: (dto.helmetType as any[]) ?? [],
        safety_rating: dto.safetyRating,
        shell_material: (dto.shellMaterial as any[]) ?? [],
        shell_sizes: dto.shellSizes,
        weight_grams: dto.weightGrams,
        visor_anti_scratch: dto.visorAntiScratch ?? false,
        visor_anti_fog: dto.visorAntiFog ?? false,
        visor_pinlock_compatible: (dto.visorPinlockCompatible as any[]) ?? [],
        visor_pinlock_included: dto.visorPinlockIncluded ?? false,
        pinlock_dks_code: dto.pinlockDksCode,
        tear_off_compatible: dto.tearOffCompatible ?? false,
        sun_visor: dto.sunVisor ?? false,
        sun_visor_type: dto.sunVisorType,
        intercom_ready: dto.intercomReady ?? false,
        intercom_designed_brand: dto.intercomDesignedBrand,
        intercom_designed_model: dto.intercomDesignedModel,
        removable_lining: dto.removableLining ?? true,
        washable_lining: dto.washableLining ?? true,
        emergency_release: dto.emergencyRelease ?? false,
        closure_type: dto.closureType as any,
        certification: (dto.certification as any[]) ?? [],
        included_accessories: dto.includedAccessories ?? [],
      },
      include: this.buildInclude(true),
    });
  }

  async update(id: string, dto: UpdateHelmetModelDto) {
    await this.findOne(id, true);

    return this.db.helmet_model.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.brandId && { brand_id: dto.brandId }),
        ...(dto.helmetType && { helmet_type: dto.helmetType as any[] }),
        ...(dto.safetyRating !== undefined && { safety_rating: dto.safetyRating }),
        ...(dto.shellMaterial && { shell_material: dto.shellMaterial as any[] }),
        ...(dto.shellSizes !== undefined && { shell_sizes: dto.shellSizes }),
        ...(dto.weightGrams !== undefined && { weight_grams: dto.weightGrams }),
        ...(dto.visorAntiScratch !== undefined && { visor_anti_scratch: dto.visorAntiScratch }),
        ...(dto.visorAntiFog !== undefined && { visor_anti_fog: dto.visorAntiFog }),
        ...(dto.visorPinlockCompatible && { visor_pinlock_compatible: dto.visorPinlockCompatible as any[] }),
        ...(dto.visorPinlockIncluded !== undefined && { visor_pinlock_included: dto.visorPinlockIncluded }),
        ...(dto.pinlockDksCode !== undefined && { pinlock_dks_code: dto.pinlockDksCode }),
        ...(dto.tearOffCompatible !== undefined && { tear_off_compatible: dto.tearOffCompatible }),
        ...(dto.sunVisor !== undefined && { sun_visor: dto.sunVisor }),
        ...(dto.sunVisorType !== undefined && { sun_visor_type: dto.sunVisorType }),
        ...(dto.intercomReady !== undefined && { intercom_ready: dto.intercomReady }),
        ...(dto.intercomDesignedBrand !== undefined && { intercom_designed_brand: dto.intercomDesignedBrand }),
        ...(dto.intercomDesignedModel !== undefined && { intercom_designed_model: dto.intercomDesignedModel }),
        ...(dto.removableLining !== undefined && { removable_lining: dto.removableLining }),
        ...(dto.washableLining !== undefined && { washable_lining: dto.washableLining }),
        ...(dto.emergencyRelease !== undefined && { emergency_release: dto.emergencyRelease }),
        ...(dto.closureType && { closure_type: dto.closureType as any }),
        ...(dto.certification && { certification: dto.certification as any[] }),
        ...(dto.includedAccessories && { included_accessories: dto.includedAccessories }),
        updated_at: new Date(),
      },
      include: this.buildInclude(true),
    });
  }

  async remove(id: string) {
    await this.findOne(id, true);
    await this.db.helmet_model.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: string) {
    const item = await this.db.helmet_model.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Helmet model #${id} not found`);

    return this.db.helmet_model.update({
      where: { id },
      data: { deleted_at: null, updated_at: new Date() },
      include: this.buildInclude(true),
    });
  }

  async findAllModelsAdmin(filters: FilterHelmetModelsAdminDto) {
    const where = this.buildAdminModelsWhere(filters);

    const result = await paginate({
      model: this.db.helmet_model,
      pagination: filters,
      where,
      orderBy: { name: 'asc' },
      select: this.buildAdminModelSelect(),
    });

    return {
      data: result.data.map((item) => this.mapModelAdminResponse(item)),
      meta: result.meta,
    };
  }

  private buildWhere(
    filters: FilterHelmetModelsDto,
    adminView: boolean,
  ): Prisma.helmet_modelWhereInput {
    const showDeleted = adminView && filters.includeDeleted;
    const hasVariantFilters = filters.colorFamily !== undefined;
    const hasPriceFilter =
      filters.minPrice !== undefined || filters.maxPrice !== undefined;

    return {
      // Soft delete: público nunca ve eliminados, admin solo si pide includeDeleted
      ...(!showDeleted && { deleted_at: null }),

      ...(filters.brandSlug && { brand: { slug: filters.brandSlug, deleted_at: null } }),
      ...(filters.type?.length && { helmet_type: { hasSome: filters.type as any[] } }),
      ...(filters.shellMaterial?.length && { shell_material: { hasSome: filters.shellMaterial as any[] } }),
      ...(filters.closureType && { closure_type: filters.closureType as any }),
      ...(filters.visorPinlockCompatible?.length && { visor_pinlock_compatible: { hasSome: filters.visorPinlockCompatible as any[] } }),
      ...(filters.visorPinlockIncluded !== undefined && { visor_pinlock_included: filters.visorPinlockIncluded }),
      ...(filters.tearOffCompatible !== undefined && { tear_off_compatible: filters.tearOffCompatible }),
      ...(filters.sunVisor !== undefined && { sun_visor: filters.sunVisor }),
      ...(filters.intercomReady !== undefined && { intercom_ready: filters.intercomReady }),
      ...(filters.minSafetyRating && { safety_rating: { gte: filters.minSafetyRating } }),
      ...(filters.maxWeightGrams && { weight_grams: { lte: filters.maxWeightGrams } }),
      ...(filters.certification?.length && {
        certification: { hasEvery: filters.certification as any[] },
      }),
      ...((hasVariantFilters || hasPriceFilter) && {
        helmet_model_variant: {
          some: {
            deleted_at: null,
            ...(filters.colorFamily && {
              color_families: { has: filters.colorFamily as any },
            }),
            ...(hasPriceFilter && {
              helmet_inventory: {
                some: {
                  ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
                  ...(filters.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
                },
              },
            }),
          },
        },
      }),
    };
  }

  private buildInclude(adminView: boolean): Prisma.helmet_modelInclude {
    return {
      brand: { select: { id: true, name: true, slug: true } },
      helmet_model_variant: {
        where: adminView ? {} : { deleted_at: null },
        select: {
          id: true,
          color_name: true,
          color_families: true,
          finish: true,
          graphic_name: true,
          image_url: true,
          ...(adminView && {
            sku: true,
            deleted_at: true,
            created_at: true,
            updated_at: true,
          }),
          helmet_inventory: {
            select: {
              price: true,
              currency: true,
              in_stock: true,
              ...(adminView && {
                id: true,
                affiliate_url: true,
                last_checked: true,
                affiliate_store: {
                  select: { id: true, name: true, domain: true },
                },
              }),
              helmet_size: {
                select: { id: true, size_label: true },
              },
            },
            orderBy: { price: 'asc' },
          },
        },
      },
      helmet_model_size: {
        select: { id: true, size_label: true },
      },
    };
  }

  private mapResponse(raw: any, adminView: boolean) {
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
      features: {
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
      },
      certification: raw.certification,
      includedAccessories: raw.included_accessories,
      sizes: raw.helmet_model_size?.map((s: any) => ({ id: s.id, sizeLabel: s.size_label })),
      variants: raw.helmet_model_variant.map((v: any) => this.mapVariant(v, adminView)),
      ...(adminView && {
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      }),
    };
  }

  private mapVariant(v: any, adminView: boolean) {
    const allInventory = v.helmet_inventory ?? [];
    const prices = allInventory.map((i: any) => Number(i.price)).filter(Boolean);

    return {
      id: v.id,
      colorName: v.color_name,
      colorFamilies: v.color_families,
      finish: v.finish,
      graphicName: v.graphic_name,
      images: v.image_url,
      ...(adminView && {
        sku: v.sku,
        deletedAt: v.deleted_at,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }),
      inventory: allInventory.map((i: any) => ({
        size: i.helmet_size
          ? { id: i.helmet_size.id, sizeLabel: i.helmet_size.size_label }
          : null,
        price: Number(i.price),
        currency: i.currency,
        inStock: i.in_stock,
        ...(adminView && {
          id: i.id,
          affiliateUrl: i.affiliate_url,
          lastChecked: i.last_checked,
          store: i.affiliate_store,
        }),
      })),
      priceFrom: prices.length ? Math.min(...prices) : null,
      inStock: allInventory.some((i: any) => i.in_stock),
    };
  }

  private buildAdminModelsWhere(
    filters: FilterHelmetModelsAdminDto,
  ): Prisma.helmet_modelWhereInput {
    const onlyDeleted = !!filters.onlyDeleted;
    const includeDeleted = !!filters.includeDeleted;

    const createdAtFilter: Prisma.DateTimeFilter | undefined =
      filters.minCreatedAt !== undefined || filters.maxCreatedAt !== undefined
        ? {
            ...(filters.minCreatedAt !== undefined && { gte: new Date(filters.minCreatedAt) }),
            ...(filters.maxCreatedAt !== undefined && { lte: new Date(filters.maxCreatedAt) }),
          }
        : undefined;

    const updatedAtFilter: Prisma.DateTimeFilter | undefined =
      filters.minUpdatedAt !== undefined || filters.maxUpdatedAt !== undefined
        ? {
            ...(filters.minUpdatedAt !== undefined && { gte: new Date(filters.minUpdatedAt) }),
            ...(filters.maxUpdatedAt !== undefined && { lte: new Date(filters.maxUpdatedAt) }),
          }
        : undefined;

    return {
      ...(!includeDeleted && !onlyDeleted && { deleted_at: null }),
      ...(onlyDeleted && { NOT: { deleted_at: null } }),
      ...(filters.id && { id: filters.id }),
      ...(filters.brandId && { brand_id: filters.brandId }),
      ...(filters.brandSlug && { brand: { slug: filters.brandSlug } }),
      ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
      ...(filters.slug && { slug: { contains: filters.slug, mode: 'insensitive' } }),
      ...(filters.type?.length && { helmet_type: { hasSome: filters.type as any[] } }),
      ...(filters.shellMaterial?.length && { shell_material: { hasSome: filters.shellMaterial as any[] } }),
      ...(filters.closureType && { closure_type: filters.closureType as any }),
      ...(filters.visorPinlockCompatible?.length && {
        visor_pinlock_compatible: { hasSome: filters.visorPinlockCompatible as any[] },
      }),
      ...(filters.visorPinlockIncluded !== undefined && {
        visor_pinlock_included: filters.visorPinlockIncluded,
      }),
      ...(filters.tearOffCompatible !== undefined && {
        tear_off_compatible: filters.tearOffCompatible,
      }),
      ...(filters.sunVisor !== undefined && { sun_visor: filters.sunVisor }),
      ...(filters.intercomReady !== undefined && { intercom_ready: filters.intercomReady }),
      ...(filters.removableLining !== undefined && {
        removable_lining: filters.removableLining,
      }),
      ...(filters.washableLining !== undefined && {
        washable_lining: filters.washableLining,
      }),
      ...(filters.emergencyRelease !== undefined && {
        emergency_release: filters.emergencyRelease,
      }),
      ...((filters.minSafetyRating !== undefined || filters.maxSafetyRating !== undefined) && {
        safety_rating: {
          ...(filters.minSafetyRating !== undefined && { gte: filters.minSafetyRating }),
          ...(filters.maxSafetyRating !== undefined && { lte: filters.maxSafetyRating }),
        },
      }),
      ...((filters.minWeightGrams !== undefined || filters.maxWeightGrams !== undefined) && {
        weight_grams: {
          ...(filters.minWeightGrams !== undefined && { gte: filters.minWeightGrams }),
          ...(filters.maxWeightGrams !== undefined && { lte: filters.maxWeightGrams }),
        },
      }),
      ...(filters.certification?.length && {
        certification: { hasEvery: filters.certification as any[] },
      }),
      ...(createdAtFilter && { created_at: createdAtFilter }),
      ...(updatedAtFilter && { updated_at: updatedAtFilter }),
      ...(filters.missingWeightGrams && { weight_grams: null }),
      ...(filters.missingSafetyRating && { safety_rating: null }),
      ...(filters.missingSunVisorType && { sun_visor_type: null }),
      ...(filters.missingIntercomDesignedBrand && { intercom_designed_brand: null }),
      ...(filters.missingIntercomDesignedModel && { intercom_designed_model: null }),
      ...(filters.missingPinlockDksCode && { pinlock_dks_code: null }),
    };
  }

  private buildAdminModelSelect(): Prisma.helmet_modelSelect {
    return {
      id: true,
      slug: true,
      name: true,
      brand_id: true,
      brand: { select: { id: true, name: true, slug: true } },
      helmet_type: true,
      safety_rating: true,
      shell_material: true,
      shell_sizes: true,
      weight_grams: true,
      visor_anti_scratch: true,
      visor_anti_fog: true,
      visor_pinlock_compatible: true,
      visor_pinlock_included: true,
      pinlock_dks_code: true,
      tear_off_compatible: true,
      sun_visor: true,
      sun_visor_type: true,
      intercom_ready: true,
      intercom_designed_brand: true,
      intercom_designed_model: true,
      removable_lining: true,
      washable_lining: true,
      emergency_release: true,
      closure_type: true,
      certification: true,
      included_accessories: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      helmet_model_variant: {
        where: { deleted_at: null },
        select: { image_url: true },
        take: 1,
      },
    };
  }

  private mapModelAdminResponse(raw: any) {
    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      brandId: raw.brand_id,
      brand: raw.brand,
      type: raw.helmet_type,
      safetyRating: raw.safety_rating,
      shellMaterial: raw.shell_material,
      shellSizes: raw.shell_sizes,
      weightGrams: raw.weight_grams,
      features: {
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
      },
      certification: raw.certification,
      includedAccessories: raw.included_accessories,
      images: raw.helmet_model_variant?.[0]?.image_url ?? [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      deletedAt: raw.deleted_at,
    };
  }
}
