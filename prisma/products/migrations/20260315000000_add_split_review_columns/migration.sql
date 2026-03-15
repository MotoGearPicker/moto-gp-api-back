-- AlterTable: make raw_data nullable, add split model/variant columns
ALTER TABLE "scrape_review" ALTER COLUMN "raw_data" DROP NOT NULL;
ALTER TABLE "scrape_review" ADD COLUMN "raw_model_data" JSONB;
ALTER TABLE "scrape_review" ADD COLUMN "raw_variant_data" JSONB;
ALTER TABLE "scrape_review" ADD COLUMN "edited_model_data" JSONB;
ALTER TABLE "scrape_review" ADD COLUMN "edited_variant_data" JSONB;
