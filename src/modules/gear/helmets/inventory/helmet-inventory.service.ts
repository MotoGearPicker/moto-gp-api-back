import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsPrismaService } from '../../../../prisma/products-prisma.service';
import { CatalogCacheService } from '../../../valkey/catalog-cache.service';
import { CreateHelmetInventoryDto } from './dto/create-helmet-inventory.dto';
import { UpdateHelmetInventoryDto } from './dto/update-helmet-inventory.dto';

@Injectable()
export class HelmetInventoryService {
  constructor(
    private readonly db: ProductsPrismaService,
    private readonly cache: CatalogCacheService,
  ) {}

  async create(dto: CreateHelmetInventoryDto) {
    const result = await this.db.helmet_inventory.create({
      data: {
        variant_id: dto.variantId,
        size_id: dto.sizeId,
        store_id: dto.storeId,
        price: dto.price,
        currency: dto.currency ?? 'USD',
        in_stock: dto.inStock,
        affiliate_url: dto.affiliateUrl,
      },
      include: {
        affiliate_store: { select: { name: true, domain: true } },
        helmet_size: { select: { id: true, size_label: true } },
      },
    });
    this.cache.reloadAll().catch(() => null);
    return result;
  }

  async update(id: string, dto: UpdateHelmetInventoryDto) {
    await this.assertExists(id);

    const result = await this.db.helmet_inventory.update({
      where: { id },
      data: {
        ...(dto.variantId && { variant_id: dto.variantId }),
        ...(dto.sizeId && { size_id: dto.sizeId }),
        ...(dto.storeId && { store_id: dto.storeId }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.inStock !== undefined && { in_stock: dto.inStock }),
        ...(dto.affiliateUrl && { affiliate_url: dto.affiliateUrl }),
        last_checked: new Date(),
        updated_at: new Date(),
      },
      include: {
        affiliate_store: { select: { name: true, domain: true } },
        helmet_size: { select: { id: true, size_label: true } },
      },
    });
    this.cache.reloadAll().catch(() => null);
    return result;
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.db.helmet_inventory.delete({ where: { id } });
    this.cache.reloadAll().catch(() => null);
  }

  private async assertExists(id: string) {
    const item = await this.db.helmet_inventory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory entry #${id} not found`);
  }
}
