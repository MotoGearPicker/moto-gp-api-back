-- AlterEnum
ALTER TYPE "helmet_shell_material" ADD VALUE 'aramid_fiber';

-- DropIndex
DROP INDEX "helmet_model_helmet_type_idx";

-- AlterTable
ALTER TABLE "helmet_model" ALTER COLUMN "visor_pinlock_included" DROP NOT NULL,
ALTER COLUMN "tear_off_compatible" DROP NOT NULL;
