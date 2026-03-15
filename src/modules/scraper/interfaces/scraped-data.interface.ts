export interface ScrapedModelData {
  modelName: string;
  modelSlug: string;
  brandSlug: string;
  helmetType: string[];
  safetyRating: number | null;
  shellMaterial: string[];
  shellSizes: number | null;
  weightGrams: number | null;
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
  certification: string[];
  includedAccessories: string[];
  sizes: string[];
}

export interface ScrapedVariantData {
  variantName: string;
  colorName: string;
  colorFamilies: string[];
  finish: string | null;
  graphicName: string | null;
  sku: string | null;
  imageUrls: string[];
}

export interface SplitRawData {
  modelData: ScrapedModelData;
  variantData: ScrapedVariantData;
}
