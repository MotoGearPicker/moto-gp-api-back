import { Injectable } from '@nestjs/common';
import { ProductsPrismaService } from '../../prisma/products-prisma.service';

@Injectable()
export class StoresRepository {
  constructor(private readonly db: ProductsPrismaService) {}

  findAll() {
    return this.db.affiliate_store.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, domain: true, logo_url: true, affiliate_program: true, commission_pct: true },
    });
  }

  findAllAdmin() {
    return this.db.affiliate_store.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.affiliate_store.findUnique({ where: { id } });
  }

  findByDomain(domain: string) {
    return this.db.affiliate_store.findFirst({ where: { domain } });
  }

  create(data: {
    name: string;
    domain: string;
    logo_url?: string;
    affiliate_program?: string;
    commission_pct?: number;
  }) {
    return this.db.affiliate_store.create({ data });
  }

  softDelete(id: string) {
    return this.db.affiliate_store.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  restore(id: string) {
    return this.db.affiliate_store.update({
      where: { id },
      data: { deleted_at: null, updated_at: new Date() },
    });
  }
}
