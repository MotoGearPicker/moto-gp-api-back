/*
  Warnings:

  - A unique constraint covering the columns `[helmet_id,color_name,graphic_name]` on the table `helmet_model_variant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "helmet_variant_helmet_id_color_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "helmet_variant_helmet_id_color_name_key" ON "helmet_model_variant"("helmet_id", "color_name", "graphic_name");
