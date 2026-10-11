ALTER TABLE "jobs" ADD COLUMN "min_age" INTEGER;
ALTER TABLE "jobs" ADD COLUMN "max_age" INTEGER;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_age_range_chk" CHECK (
  ("min_age" IS NULL OR ("min_age" >= 0 AND "min_age" <= 120))
  AND ("max_age" IS NULL OR ("max_age" >= 0 AND "max_age" <= 120))
  AND ("min_age" IS NULL OR "max_age" IS NULL OR "min_age" <= "max_age")
);
