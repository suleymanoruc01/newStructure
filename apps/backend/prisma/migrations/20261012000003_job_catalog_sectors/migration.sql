-- Job catalog: sectors + occupations (replaces flat job_catalog_items)

CREATE TABLE "job_catalog_sectors" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📂',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_catalog_sectors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_catalog_sectors_code_key" ON "job_catalog_sectors"("code");
CREATE INDEX "job_catalog_sectors_active_sort_idx" ON "job_catalog_sectors"("active", "sort_order");

CREATE TABLE "job_catalog_occupations" (
    "id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_catalog_occupations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_catalog_occupations_sector_id_code_key" ON "job_catalog_occupations"("sector_id", "code");
CREATE INDEX "job_catalog_occupations_sector_active_sort_idx" ON "job_catalog_occupations"("sector_id", "active", "sort_order");

ALTER TABLE "job_catalog_occupations" ADD CONSTRAINT "job_catalog_occupations_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "job_catalog_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate flat rows into sectors + occupations
INSERT INTO "job_catalog_sectors" ("id", "code", "display_name", "icon", "sort_order", "active", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    hdr.sector_code,
    hdr.title,
    '📂',
    hdr.sort_order,
    hdr.active,
    hdr.created_at,
    CURRENT_TIMESTAMP
FROM "job_catalog_items" hdr
WHERE hdr.occupation_code IS NULL;

INSERT INTO "job_catalog_sectors" ("id", "code", "display_name", "icon", "sort_order", "active", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    distinct_sectors.sector_code,
    distinct_sectors.sector_code,
    CASE distinct_sectors.sector_code
        WHEN 'hospitality' THEN '🍽️'
        WHEN 'retail' THEN '🛒'
        WHEN 'logistics' THEN '📦'
        ELSE '📂'
    END,
    MIN(distinct_sectors.sort_order),
    BOOL_AND(distinct_sectors.active),
    MIN(distinct_sectors.created_at),
    CURRENT_TIMESTAMP
FROM "job_catalog_items" distinct_sectors
WHERE distinct_sectors.occupation_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "job_catalog_sectors" s WHERE s.code = distinct_sectors.sector_code
  )
GROUP BY distinct_sectors.sector_code;

INSERT INTO "job_catalog_occupations" ("id", "sector_id", "code", "title", "sort_order", "active", "created_at", "updated_at")
SELECT
    j.id,
    s.id,
    j.occupation_code,
    j.title,
    j.sort_order,
    j.active,
    j.created_at,
    CURRENT_TIMESTAMP
FROM "job_catalog_items" j
INNER JOIN "job_catalog_sectors" s ON s.code = j.sector_code
WHERE j.occupation_code IS NOT NULL;

DROP TABLE "job_catalog_items";
