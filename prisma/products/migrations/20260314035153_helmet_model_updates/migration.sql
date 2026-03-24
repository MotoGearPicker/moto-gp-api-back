-- AlterEnum: visor_pinlock - add new variants
ALTER TYPE "visor_pinlock" ADD VALUE IF NOT EXISTS 'pinlock_max_vision';
ALTER TYPE "visor_pinlock" ADD VALUE IF NOT EXISTS 'pinlock_ready';

-- AlterEnum: visor_pinlock - remove old variants (recreate)
ALTER TYPE "visor_pinlock" RENAME TO "visor_pinlock_old";
CREATE TYPE "visor_pinlock" AS ENUM ('pinlock_30', 'pinlock_70', 'pinlock_70_max_vision', 'pinlock_120', 'pinlock_120_max_vision', 'pinlock_evo', 'pinlock_protectint', 'pinlock_max_vision', 'pinlock_ready', 'not_compatible');

-- AlterTable: helmet_model
-- Drop old single-value visor_pinlock column
ALTER TABLE "helmet_model" DROP COLUMN "visor_pinlock";

-- Change helmet_type from single enum to array
ALTER TABLE "helmet_model" ALTER COLUMN "helmet_type" DROP NOT NULL;
ALTER TABLE "helmet_model" ALTER COLUMN "helmet_type" DROP DEFAULT;
ALTER TABLE "helmet_model" ALTER COLUMN "helmet_type" SET DATA TYPE "helmet_type"[] USING CASE WHEN "helmet_type" IS NULL THEN '{}'::helmet_type[] ELSE ARRAY["helmet_type"] END;

-- Change shell_material from single nullable enum to array
ALTER TABLE "helmet_model" ALTER COLUMN "shell_material" SET DATA TYPE "helmet_shell_material"[] USING CASE WHEN "shell_material" IS NULL THEN '{}'::helmet_shell_material[] ELSE ARRAY["shell_material"] END;

-- Add new columns
ALTER TABLE "helmet_model" ADD COLUMN "visor_pinlock_compatible" "visor_pinlock"[];
ALTER TABLE "helmet_model" ADD COLUMN "visor_pinlock_included" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "helmet_model" ADD COLUMN "pinlock_dks_code" VARCHAR;
ALTER TABLE "helmet_model" ADD COLUMN "tear_off_compatible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "helmet_model" ADD COLUMN "included_accessories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Cleanup old enum type
DROP TYPE "visor_pinlock_old";