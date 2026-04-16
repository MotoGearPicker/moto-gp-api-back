import { ConflictException, Injectable } from '@nestjs/common';
import { ProductsPrismaService } from '../../../prisma/products-prisma.service';
import { BrandCacheService } from '../../valkey/brand-cache.service';
import { GearType } from '../common/enums/gear-type.enum';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    private readonly db: ProductsPrismaService,
    private readonly brandCache: BrandCacheService,
  ) {}

  async create(dto: CreateBrandDto) {
    const existing = await this.db.brand.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (existing) {
      const field = existing.name === dto.name ? 'name' : 'slug';
      throw new ConflictException(`Ya existe una marca con ese ${field}`);
    }

    const result = await this.db.brand.create({
      data: { name: dto.name, slug: dto.slug },
      select: { id: true, name: true, slug: true, created_at: true },
    });

    this.brandCache.reload().catch(() => null);
    return result;
  }

  findAll(category?: GearType) {
    return this.brandCache.getBrands(category);
  }
}
