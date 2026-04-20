import { Injectable, NotFoundException } from '@nestjs/common';
import { CachedCatalogItem, CachedVariantFilter, HelmetCacheService } from '../../../valkey/helmet-cache.service';
import { FilterHelmetModelsDto } from './dto/filter-helmet-models.dto';
import {HelmetFinish} from "../enums";

@Injectable()
export class HelmetModelsService {
  constructor(private readonly cache: HelmetCacheService) {}

  async findAll(filters: FilterHelmetModelsDto) {
    const catalog = await this.cache.getCatalog();
    const filtered = this.filterCatalog(catalog, filters);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);

    return {
      data: items.map((item) => this.toListResponse(item, filters)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneBySlug(brandSlug: string, modelSlug: string) {
    const detail = await this.cache.getHelmetDetail(brandSlug, modelSlug);
    if (!detail) throw new NotFoundException(`Helmet model '${modelSlug}' not found`);
    return detail;
  }

  // ─── In-memory filter ────────────────────────────────────────────────────────

  private filterCatalog(catalog: CachedCatalogItem[], filters: FilterHelmetModelsDto): CachedCatalogItem[] {
    return catalog.filter((item) => {
      if (filters.brandSlug?.length && !filters.brandSlug.includes(item.brand.slug)) return false;
      if (filters.shape?.length && !filters.shape.some((s) => item.shape.includes(s))) return false;
      if (filters.purpose?.length && !filters.purpose.some((p) => item.purpose.includes(p))) return false;
      if (filters.shellMaterial?.length && !filters.shellMaterial.some((m) => item.shellMaterial.includes(m))) return false;
      if (filters.closureType && item.features.closureType !== filters.closureType) return false;
      if (filters.visorPinlockCompatible?.length && !filters.visorPinlockCompatible.some((v) => item.features.visorPinlockCompatible.includes(v))) return false;
      if (filters.visorPinlockIncluded !== undefined && item.features.visorPinlockIncluded !== filters.visorPinlockIncluded) return false;
      if (filters.tearOffCompatible !== undefined && item.features.tearOffCompatible !== filters.tearOffCompatible) return false;
      if (filters.sunVisor !== undefined && item.features.sunVisor !== filters.sunVisor) return false;
      if (filters.intercomReady !== undefined && item.features.intercomReady !== filters.intercomReady) return false;
      if (filters.emergencyRelease !== undefined && item.features.emergencyRelease !== filters.emergencyRelease) return false;
      if (filters.minSafetyRating && (item.safetyRating == null || item.safetyRating < filters.minSafetyRating)) return false;
      if (filters.maxWeightGrams && (item.weightGrams == null || item.weightGrams > filters.maxWeightGrams)) return false;
      if (filters.minShellSizes && (item.shellSizes == null || item.shellSizes < filters.minShellSizes)) return false;
      if (filters.certification?.length && !filters.certification.every((c) => item.certification.includes(c))) return false;

      return !(this.hasVariantFilters(filters) && !item._variants.some((v) => this.variantMatches(v, filters)));


    });
  }

  private hasVariantFilters(filters: FilterHelmetModelsDto): boolean {
    return !!(filters.colorFamily?.length) || filters.exclusive === true || !!(filters.finish?.length);
  }

  private variantMatches(variant: CachedVariantFilter, filters: FilterHelmetModelsDto): boolean {
    const { colorFamily, exclusive, finish } = filters;

    if (colorFamily?.length) {
      if (exclusive) {
        const variantSet = new Set(variant.colorFamilies);
        if (variantSet.size !== colorFamily.length) return false;
        if (!colorFamily.every((c) => variantSet.has(c))) return false;
      } else if (!colorFamily.every((c) => variant.colorFamilies.includes(c))) {
        return false;
      }
    }

    return !(finish?.length && !finish.includes(<HelmetFinish>variant.finish));


  }

  // ─── Response mapper ─────────────────────────────────────────────────────────

  private toListResponse(item: CachedCatalogItem, filters: FilterHelmetModelsDto) {
    const { _variants, ...rest } = item;

    if (!this.hasVariantFilters(filters)) {
      return { ...rest, variantImages: item.variantImages };
    }

    const matchingIndices = _variants
      .map((v, i) => (this.variantMatches(v, filters) ? i : -1))
      .filter((i) => i >= 0);

    return {
      ...rest,
      variantsCount: matchingIndices.length,
      variantImages: matchingIndices.map((i) => item.variantImages[i]),
    };
  }
}
