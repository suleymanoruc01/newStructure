/*
  Warnings:

  - Added the required column `latitude` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `worker_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "address_line1" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6) NOT NULL,
ADD COLUMN     "longitude" DECIMAL(9,6) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "industry_codes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "trading_name" TEXT;

-- AlterTable
ALTER TABLE "worker_profiles" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "home_latitude" DECIMAL(9,6),
ADD COLUMN     "home_longitude" DECIMAL(9,6),
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "night_shift_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- CreateTable
CREATE TABLE "availability_windows" (
    "id" UUID NOT NULL,
    "worker_profile_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "crosses_midnight" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_sectors" (
    "id" UUID NOT NULL,
    "worker_profile_id" UUID NOT NULL,
    "sector_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_occupations" (
    "id" UUID NOT NULL,
    "worker_profile_id" UUID NOT NULL,
    "occupation_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_occupations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_windows_worker_profile_id_day_of_week_idx" ON "availability_windows"("worker_profile_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "worker_sectors_worker_profile_id_sector_code_key" ON "worker_sectors"("worker_profile_id", "sector_code");

-- CreateIndex
CREATE UNIQUE INDEX "worker_occupations_worker_profile_id_occupation_code_key" ON "worker_occupations"("worker_profile_id", "occupation_code");

-- CreateIndex
CREATE INDEX "branches_employer_id_idx" ON "branches"("employer_id");

-- AddForeignKey
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_worker_profile_id_fkey" FOREIGN KEY ("worker_profile_id") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_sectors" ADD CONSTRAINT "worker_sectors_worker_profile_id_fkey" FOREIGN KEY ("worker_profile_id") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_occupations" ADD CONSTRAINT "worker_occupations_worker_profile_id_fkey" FOREIGN KEY ("worker_profile_id") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
