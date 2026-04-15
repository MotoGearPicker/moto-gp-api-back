import { Injectable } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { resolveLogoUrl } from './stores.utils';

@Injectable()
export class StoresService {
  constructor(private readonly repo: StoresRepository) {}

  async findAll() {
    const stores = await this.repo.findAll();
    return stores.map((s) => this.mapStore(s));
  }

  private mapStore(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      domain: raw.domain,
      logoUrl: resolveLogoUrl(raw.logo_url),
      affiliateProgram: raw.affiliate_program,
      commissionPct: raw.commission_pct !== null ? Number(raw.commission_pct) : null,
    };
  }
}