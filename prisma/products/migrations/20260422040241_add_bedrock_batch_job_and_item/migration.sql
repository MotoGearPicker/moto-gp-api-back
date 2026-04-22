-- CreateEnum
CREATE TYPE "bedrock_batch_type" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "bedrock_batch_job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_arn" TEXT NOT NULL,
    "job_name" VARCHAR(200) NOT NULL,
    "type" "bedrock_batch_type" NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    "input_s3_uri" TEXT NOT NULL,
    "output_s3_uri" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "padded_count" INTEGER NOT NULL DEFAULT 0,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "bedrock_batch_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedrock_batch_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "record_id" VARCHAR(100) NOT NULL,
    "url" TEXT NOT NULL,
    "color_hint" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bedrock_batch_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bedrock_batch_job_job_arn_key" ON "bedrock_batch_job"("job_arn");

-- CreateIndex
CREATE UNIQUE INDEX "bedrock_batch_job_job_name_key" ON "bedrock_batch_job"("job_name");

-- CreateIndex
CREATE INDEX "bedrock_batch_job_status_idx" ON "bedrock_batch_job"("status");

-- CreateIndex
CREATE INDEX "bedrock_batch_item_job_id_idx" ON "bedrock_batch_item"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "bedrock_batch_item_job_id_record_id_key" ON "bedrock_batch_item"("job_id", "record_id");

-- AddForeignKey
ALTER TABLE "bedrock_batch_item" ADD CONSTRAINT "bedrock_batch_item_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "bedrock_batch_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
