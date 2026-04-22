/*
  Warnings:

  - You are about to drop the column `helmet_type` on the `helmet_model` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "helmet_model" DROP COLUMN "helmet_type";

-- DropEnum
DROP TYPE "helmet_type";
