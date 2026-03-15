import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductsPrismaService } from '../../prisma/products-prisma.service';
import { FilterReviewsDto } from './dto';
import { UpdateReviewDto } from './dto';
import { ScrapedModelDataDto } from './dto';
import { BatchApproveDto, BatchRejectDto } from './dto';
import { ScrapedModelData, ScrapedVariantData } from './interfaces';

@Injectable()
export class ScraperReviewsService {
  private readonly logger = new Logger(ScraperReviewsService.name);

  constructor(private readonly prisma: ProductsPrismaService) {}

  /**
   * Extract model and variant data from a review record.
   * Prefers dedicated columns, falls back to old flat raw_data format.
   */
  private extractData(review: any): {
    modelData: ScrapedModelData | null;
    variantData: ScrapedVariantData | null;
  } {
    // New split columns
    if (review.raw_model_data && review.raw_variant_data) {
      return {
        modelData: review.raw_model_data as ScrapedModelData,
        variantData: review.raw_variant_data as ScrapedVariantData,
      };
    }

    // Fallback: old flat raw_data
    const raw = review.raw_data as any;
    if (raw && raw.modelData && raw.variantData) {
      return {
        modelData: raw.modelData as ScrapedModelData,
        variantData: raw.variantData as ScrapedVariantData,
      };
    }

    if (raw) {
      return {
        modelData: this.extractModelDataFromFlat(raw),
        variantData: this.extractVariantDataFromFlat(raw),
      };
    }

    return { modelData: null, variantData: null };
  }

  private extractModelDataFromFlat(flat: any): ScrapedModelData {
    return {
      modelName: flat.modelName ?? flat.name ?? '',
      modelSlug: flat.modelSlug ?? flat.slug ?? '',
      brandSlug: flat.brandSlug ?? '',
      helmetType: flat.helmetType ?? [],
      safetyRating: flat.safetyRating ?? null,
      shellMaterial: flat.shellMaterial ?? [],
      shellSizes: flat.shellSizes ?? null,
      weightGrams: flat.weightGrams ?? null,
      visorAntiScratch: flat.visorAntiScratch ?? false,
      visorAntiFog: flat.visorAntiFog ?? false,
      visorPinlockCompatible: flat.visorPinlockCompatible ?? [],
      visorPinlockIncluded: flat.visorPinlockIncluded ?? false,
      pinlockDksCode: flat.pinlockDksCode ?? null,
      tearOffCompatible: flat.tearOffCompatible ?? false,
      sunVisor: flat.sunVisor ?? false,
      sunVisorType: flat.sunVisorType ?? null,
      intercomReady: flat.intercomReady ?? false,
      intercomDesignedBrand: flat.intercomDesignedBrand ?? null,
      intercomDesignedModel: flat.intercomDesignedModel ?? null,
      removableLining: flat.removableLining ?? false,
      washableLining: flat.washableLining ?? false,
      emergencyRelease: flat.emergencyRelease ?? false,
      closureType: flat.closureType ?? null,
      certification: flat.certification ?? [],
      includedAccessories: flat.includedAccessories ?? [],
      sizes: flat.sizes ?? [],
    };
  }

  private extractVariantDataFromFlat(flat: any): ScrapedVariantData {
    return {
      variantName: flat.variantName ?? flat.colorName ?? '',
      colorName: flat.colorName ?? '',
      colorFamilies: flat.colorFamilies ?? [],
      finish: flat.finish ?? null,
      graphicName: flat.graphicName ?? null,
      sku: flat.sku ?? null,
      imageUrls: flat.imageUrls ?? flat.images ?? [],
    };
  }

  private getModelSlug(review: any): string {
    // Dedicated column first
    if (review.raw_model_data) {
      return (review.raw_model_data as any).modelSlug ?? '';
    }
    // Edited model data
    if (review.edited_model_data) {
      return (review.edited_model_data as any).modelSlug ?? '';
    }
    // Fallback to raw_data
    const { modelData } = this.extractData(review);
    return modelData?.modelSlug ?? '';
  }

  private mapReviewResponse(review: any) {
    const { modelData, variantData } = this.extractData(review);

    return {
      id: review.id,
      sourceUrl: review.source_url,
      source: review.source,
      status: review.status,
      sourceContent: review.source_content,
      rawModelData: modelData,
      rawVariantData: variantData,
      editedModelData: (review.edited_model_data as ScrapedModelData) ?? null,
      editedVariantData: (review.edited_variant_data as ScrapedVariantData) ?? null,
      notes: review.notes,
      createdAt: review.created_at,
      reviewedAt: review.reviewed_at,
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.scrape_review.findUnique({
      where: { id },
    });
    if (!review) throw new NotFoundException('Review not found');
    return this.mapReviewResponse(review);
  }

  async findGrouped(filters: FilterReviewsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const allReviews = await this.prisma.scrape_review.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    // Group by modelSlug
    const groups = new Map<string, any[]>();
    for (const review of allReviews) {
      const slug = this.getModelSlug(review);
      if (!slug) continue;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const { modelData } = this.extractData(review);
        const matchesSearch =
          slug.toLowerCase().includes(searchLower) ||
          (modelData?.modelName ?? '').toLowerCase().includes(searchLower) ||
          (modelData?.brandSlug ?? '').toLowerCase().includes(searchLower);
        if (!matchesSearch) continue;
      }

      if (!groups.has(slug)) {
        groups.set(slug, []);
      }
      groups.get(slug)!.push(review);
    }

    const allSlugs = Array.from(groups.keys());
    const total = allSlugs.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedSlugs = allSlugs.slice((page - 1) * limit, page * limit);

    const items = paginatedSlugs.map((slug) => {
      const reviews = groups.get(slug)!;
      const mergedModelData = this.mergeModelData(reviews);
      const editedModelData = this.getGroupEditedModelData(reviews);

      return {
        modelSlug: slug,
        modelName: mergedModelData.modelName,
        modelData: mergedModelData,
        editedModelData,
        variants: reviews.map((r) => {
          const { variantData } = this.extractData(r);
          return {
            reviewId: r.id,
            status: r.status,
            sourceUrl: r.source_url,
            variantData,
            editedVariantData: (r.edited_variant_data as ScrapedVariantData) ?? null,
            notes: r.notes,
            createdAt: r.created_at,
            reviewedAt: r.reviewed_at,
          };
        }),
      };
    });

    return { items, total, page, limit, totalPages };
  }

  /**
   * Merge model-level fields from all variants.
   * For each field, use the most common non-null value.
   * Ties broken by most recently created review.
   */
  private mergeModelData(reviews: any[]): ScrapedModelData {
    const sorted = [...reviews].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const allModelData = sorted
      .map((r) => this.extractData(r).modelData)
      .filter(Boolean) as ScrapedModelData[];

    if (allModelData.length === 0) {
      return this.extractModelDataFromFlat({});
    }
    if (allModelData.length === 1) {
      return allModelData[0];
    }

    const merged: any = {};
    const keys = Object.keys(allModelData[0]) as (keyof ScrapedModelData)[];
    for (const key of keys) {
      merged[key] = this.pickMostCommonValue(allModelData, key);
    }
    return merged as ScrapedModelData;
  }

  private pickMostCommonValue(
    items: ScrapedModelData[],
    key: keyof ScrapedModelData,
  ): any {
    const counts = new Map<string, { value: any; count: number; latestIndex: number }>();

    for (let i = 0; i < items.length; i++) {
      const val = items[i][key];
      if (val === null || val === undefined) continue;
      const serialized = JSON.stringify(val);
      const existing = counts.get(serialized);
      if (existing) {
        existing.count++;
        if (i < existing.latestIndex) existing.latestIndex = i;
      } else {
        counts.set(serialized, { value: val, count: 1, latestIndex: i });
      }
    }

    if (counts.size === 0) return items[0][key];

    let best: { value: any; count: number; latestIndex: number } | null = null;
    for (const entry of counts.values()) {
      if (
        !best ||
        entry.count > best.count ||
        (entry.count === best.count && entry.latestIndex < best.latestIndex)
      ) {
        best = entry;
      }
    }
    return best!.value;
  }

  private getGroupEditedModelData(reviews: any[]): ScrapedModelData | null {
    for (const r of reviews) {
      if (r.edited_model_data) return r.edited_model_data as ScrapedModelData;
    }
    return null;
  }

  async update(id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.scrape_review.findUnique({
      where: { id },
    });
    if (!review) throw new NotFoundException('Review not found');

    const data: any = {};
    if (dto.editedModelData !== undefined) {
      data.edited_model_data = dto.editedModelData;
    }
    if (dto.editedVariantData !== undefined) {
      data.edited_variant_data = dto.editedVariantData;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    const updated = await this.prisma.scrape_review.update({
      where: { id },
      data,
    });

    return this.mapReviewResponse(updated);
  }

  async editGroupModel(modelSlug: string, editedModelData: ScrapedModelDataDto) {
    const allReviews = await this.prisma.scrape_review.findMany();
    const groupReviews = allReviews.filter(
      (r) => this.getModelSlug(r) === modelSlug,
    );

    if (groupReviews.length === 0) {
      throw new NotFoundException(`No reviews found for model slug: ${modelSlug}`);
    }

    await Promise.all(
      groupReviews.map((r) =>
        this.prisma.scrape_review.update({
          where: { id: r.id },
          data: { edited_model_data: editedModelData as any },
        }),
      ),
    );

    return { updated: groupReviews.length };
  }

  async approveSingle(id: string) {
    const review = await this.prisma.scrape_review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    await this.persistToHelmetTables(review);

    const updated = await this.prisma.scrape_review.update({
      where: { id },
      data: { status: 'approved', reviewed_at: new Date() },
    });
    return this.mapReviewResponse(updated);
  }

  async rejectSingle(id: string) {
    const review = await this.prisma.scrape_review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.scrape_review.update({
      where: { id },
      data: { status: 'rejected', reviewed_at: new Date() },
    });
    return this.mapReviewResponse(updated);
  }

  async batchApprove(modelSlug: string, dto: BatchApproveDto) {
    const allReviews = await this.prisma.scrape_review.findMany();
    const groupReviews = allReviews.filter(
      (r) => this.getModelSlug(r) === modelSlug,
    );

    if (groupReviews.length === 0) {
      throw new NotFoundException(`No reviews found for model slug: ${modelSlug}`);
    }

    let toApprove: any[];
    if (dto.reviewIds?.length) {
      toApprove = groupReviews.filter((r) => dto.reviewIds!.includes(r.id));
      if (toApprove.length === 0) {
        throw new NotFoundException('None of the specified review IDs belong to this model group');
      }
    } else {
      toApprove = groupReviews.filter((r) => r.status === 'pending');
    }

    this.verifyModelDataConsistency(toApprove);

    for (const r of toApprove) {
      await this.persistToHelmetTables(r);
      await this.prisma.scrape_review.update({
        where: { id: r.id },
        data: { status: 'approved', reviewed_at: new Date() },
      });
    }

    return { approved: toApprove.length };
  }

  async batchReject(modelSlug: string, dto: BatchRejectDto) {
    const allReviews = await this.prisma.scrape_review.findMany();
    const groupReviews = allReviews.filter(
      (r) => this.getModelSlug(r) === modelSlug,
    );

    if (groupReviews.length === 0) {
      throw new NotFoundException(`No reviews found for model slug: ${modelSlug}`);
    }

    let toReject: any[];
    if (dto.reviewIds?.length) {
      toReject = groupReviews.filter((r) => dto.reviewIds!.includes(r.id));
      if (toReject.length === 0) {
        throw new NotFoundException('None of the specified review IDs belong to this model group');
      }
    } else {
      toReject = groupReviews.filter((r) => r.status === 'pending');
    }

    await Promise.all(
      toReject.map((r) =>
        this.prisma.scrape_review.update({
          where: { id: r.id },
          data: {
            status: 'rejected',
            reviewed_at: new Date(),
            ...(dto.notes !== undefined && { notes: dto.notes }),
          },
        }),
      ),
    );

    return { rejected: toReject.length };
  }

  /**
   * Get the final model+variant data for a review, preferring edited over raw.
   */
  private getResolvedData(review: any): {
    modelData: ScrapedModelData;
    variantData: ScrapedVariantData;
  } {
    const { modelData: rawModel, variantData: rawVariant } = this.extractData(review);
    const editedModel = review.edited_model_data as ScrapedModelData | null;
    const editedVariant = review.edited_variant_data as ScrapedVariantData | null;

    const modelData = editedModel ?? rawModel;
    const variantData = editedVariant ?? rawVariant;

    if (!modelData || !variantData) {
      throw new BadRequestException(`Review ${review.id} is missing model or variant data`);
    }

    return { modelData, variantData };
  }

  /**
   * Persist a review's data to helmet_model, helmet_model_variant, and helmet_model_size tables.
   */
  private async persistToHelmetTables(review: any): Promise<void> {
    const { modelData, variantData } = this.getResolvedData(review);
    const brandSlug = modelData.brandSlug;
    const brandName = brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1);

    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert brand
      const brand = await tx.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: { name: brandName, slug: brandSlug },
      });

      // 2. Upsert helmet model — never overwrite existing data
      const model = await tx.helmet_model.upsert({
        where: {
          brand_id_slug: { brand_id: brand.id, slug: modelData.modelSlug },
        },
        update: {},
        create: {
          slug: modelData.modelSlug,
          name: modelData.modelName,
          brand_id: brand.id,
          helmet_type: modelData.helmetType as any[],
          shell_material: modelData.shellMaterial as any[],
          shell_sizes: modelData.shellSizes ?? undefined,
          weight_grams: modelData.weightGrams ?? undefined,
          visor_pinlock_compatible: modelData.visorPinlockCompatible as any[],
          visor_pinlock_included: modelData.visorPinlockIncluded,
          pinlock_dks_code: modelData.pinlockDksCode,
          visor_anti_scratch: modelData.visorAntiScratch,
          visor_anti_fog: modelData.visorAntiFog,
          sun_visor: modelData.sunVisor,
          sun_visor_type: modelData.sunVisorType,
          intercom_ready: modelData.intercomReady,
          intercom_designed_brand: modelData.intercomDesignedBrand,
          intercom_designed_model: modelData.intercomDesignedModel,
          removable_lining: modelData.removableLining,
          washable_lining: modelData.washableLining,
          emergency_release: modelData.emergencyRelease,
          closure_type: (modelData.closureType as any) ?? undefined,
          certification: modelData.certification as any[],
          tear_off_compatible: modelData.tearOffCompatible,
          included_accessories: modelData.includedAccessories,
        },
      });

      // 3. Upsert variant (unique by model + color_name)
      await tx.helmet_model_variant.upsert({
        where: {
          helmet_id_color_name: {
            helmet_id: model.id,
            color_name: variantData.colorName,
          },
        },
        update: {
          color_families: variantData.colorFamilies as any[],
          finish: (variantData.finish as any) ?? undefined,
          graphic_name: variantData.graphicName,
          sku: variantData.sku,
          image_url: variantData.imageUrls,
        },
        create: {
          helmet_id: model.id,
          color_name: variantData.colorName,
          color_families: variantData.colorFamilies as any[],
          finish: (variantData.finish as any) ?? undefined,
          graphic_name: variantData.graphicName,
          sku: variantData.sku,
          image_url: variantData.imageUrls,
        },
      });

      // 4. Insert sizes (skip duplicates)
      if (modelData.sizes.length > 0) {
        for (const sizeLabel of modelData.sizes) {
          const existing = await tx.helmet_model_size.findFirst({
            where: { model_id: model.id, size_label: sizeLabel },
          });
          if (!existing) {
            await tx.helmet_model_size.create({
              data: { model_id: model.id, size_label: sizeLabel },
            });
          }
        }
      }

      this.logger.log(
        `Saved model="${modelData.modelName}" variant="${variantData.colorName}" with ${modelData.sizes.length} sizes`,
      );
    });
  }

  private verifyModelDataConsistency(reviews: any[]) {
    if (reviews.length <= 1) return;

    // If any review has editedModelData, consistency is assumed
    const hasEdited = reviews.some((r) => r.edited_model_data);
    if (hasEdited) return;

    const modelDataSerialized = reviews.map((r) => {
      const { modelData } = this.extractData(r);
      return JSON.stringify(modelData);
    });

    const unique = new Set(modelDataSerialized);
    if (unique.size > 1) {
      throw new BadRequestException(
        'Model data is inconsistent across variants. Please set editedModelData for the group before approving.',
      );
    }
  }
}
