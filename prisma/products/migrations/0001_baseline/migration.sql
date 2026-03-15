-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "helmet_certification" AS ENUM ('dot', 'snell', 'ece_2206', 'ece_2205', 'fim');

-- CreateEnum
CREATE TYPE "helmet_closure_type" AS ENUM ('double_d_ring', 'micrometric', 'quick_release', 'magnetic', 'pinch_buckle');

-- CreateEnum
CREATE TYPE "helmet_shell_material" AS ENUM ('polycarbonate', 'fiberglass', 'carbon_fiber');

-- CreateEnum
CREATE TYPE "helmet_type" AS ENUM ('full_face', 'modular', 'open_face', 'half', 'off_road');

-- CreateEnum
CREATE TYPE "visor_pinlock" AS ENUM ('pinlock_30', 'pinlock_30_max_vision', 'pinlock_70', 'pinlock_70_max_vision', 'pinlock_120', 'pinlock_120_max_vision', 'pinlock_evo', 'pinlock_protectint', 'included_unknown', 'not_included', 'not_compatible');

-- CreateEnum
CREATE TYPE "helmet_finish" AS ENUM ('gloss', 'matte', 'satin');

-- CreateEnum
CREATE TYPE "color_family" AS ENUM ('black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'pink', 'purple', 'grey', 'silver', 'gold', 'brown', 'carbon', 'multicolor', 'bronze', 'hi_vis');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "brand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_model" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "brand_id" UUID NOT NULL,
    "helmet_type" "helmet_type" NOT NULL,
    "safety_rating" INTEGER,
    "shell_material" "helmet_shell_material",
    "shell_sizes" INTEGER,
    "weight_grams" INTEGER,
    "visor_anti_scratch" BOOLEAN NOT NULL DEFAULT false,
    "visor_anti_fog" BOOLEAN NOT NULL DEFAULT false,
    "sun_visor" BOOLEAN NOT NULL DEFAULT false,
    "sun_visor_type" VARCHAR(150),
    "intercom_ready" BOOLEAN NOT NULL DEFAULT false,
    "intercom_designed_brand" VARCHAR(100),
    "intercom_designed_model" VARCHAR(100),
    "removable_lining" BOOLEAN NOT NULL DEFAULT true,
    "washable_lining" BOOLEAN NOT NULL DEFAULT true,
    "emergency_release" BOOLEAN NOT NULL DEFAULT false,
    "closure_type" "helmet_closure_type",
    "certification" "helmet_certification"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visor_pinlock" "visor_pinlock" NOT NULL DEFAULT 'not_compatible',
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "helmet_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "size_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "affiliate_url" TEXT NOT NULL,
    "last_checked" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variant_id" UUID,

    CONSTRAINT "helmet_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_store" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "affiliate_program" VARCHAR(100),
    "commission_pct" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "affiliate_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_size_chart_by_brand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand" UUID NOT NULL,
    "size_label" VARCHAR(10) NOT NULL,
    "head_min_cm" DECIMAL(4,1) NOT NULL,
    "head_max_cm" DECIMAL(4,1) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "helmet_size_chart_by_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_url" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'brand-site',
    "raw_data" JSONB NOT NULL,
    "edited_data" JSONB,
    "status" "review_status" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "source_content" TEXT,

    CONSTRAINT "scrape_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_model_size" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_id" UUID NOT NULL,
    "size_label" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "helmet_model_size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_model_variant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "helmet_id" UUID NOT NULL,
    "color_name" VARCHAR(100) NOT NULL,
    "finish" "helmet_finish",
    "graphic_name" VARCHAR(100),
    "sku" VARCHAR(100),
    "image_url" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "color_families" "color_family"[],
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "helmet_variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brand_slug_key" ON "brand"("slug");

-- CreateIndex
CREATE INDEX "helmet_model_helmet_type_idx" ON "helmet_model"("helmet_type");

-- CreateIndex
CREATE UNIQUE INDEX "helmet_model_brand_id_name_key" ON "helmet_model"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "helmet_model_brand_id_slug_key" ON "helmet_model"("brand_id", "slug");

-- CreateIndex
CREATE INDEX "helmet_inventory_in_stock_idx" ON "helmet_inventory"("in_stock");

-- CreateIndex
CREATE INDEX "helmet_inventory_size_id_idx" ON "helmet_inventory"("size_id");

-- CreateIndex
CREATE INDEX "helmet_inventory_store_id_idx" ON "helmet_inventory"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "helmet_inventory_size_id_store_id_key" ON "helmet_inventory"("size_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_store_domain_key" ON "affiliate_store"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "helmet_size_chart_by_brand_brand_size_label_key" ON "helmet_size_chart_by_brand"("brand", "size_label");

-- CreateIndex
CREATE INDEX "scrape_review_status_idx" ON "scrape_review"("status");

-- CreateIndex
CREATE INDEX "helmet_variant_helmet_id_idx" ON "helmet_model_variant"("helmet_id");

-- CreateIndex
CREATE UNIQUE INDEX "helmet_variant_helmet_id_color_name_key" ON "helmet_model_variant"("helmet_id", "color_name");

-- AddForeignKey
ALTER TABLE "helmet_model" ADD CONSTRAINT "helmet_model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helmet_inventory" ADD CONSTRAINT "helmet_inventory_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "helmet_model_size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "helmet_inventory" ADD CONSTRAINT "helmet_inventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "affiliate_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helmet_inventory" ADD CONSTRAINT "helmet_inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "helmet_model_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "helmet_size_chart_by_brand" ADD CONSTRAINT "helmet_size_chart_by_brand_brand_fkey" FOREIGN KEY ("brand") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helmet_model_size" ADD CONSTRAINT "helmet_model_size_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "helmet_model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "helmet_model_variant" ADD CONSTRAINT "helmet_variant_helmet_id_fkey" FOREIGN KEY ("helmet_id") REFERENCES "helmet_model"("id") ON DELETE CASCADE ON UPDATE CASCADE;