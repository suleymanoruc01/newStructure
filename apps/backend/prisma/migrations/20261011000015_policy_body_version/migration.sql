ALTER TABLE "policy_documents" ADD COLUMN "body" TEXT NOT NULL DEFAULT '';

ALTER TABLE "policy_acceptances" ADD COLUMN "accepted_version" TEXT;

UPDATE "policy_acceptances" AS a
SET "accepted_version" = d."version"
FROM "policy_documents" AS d
WHERE d."id" = a."policy_id"
  AND a."accepted_version" IS NULL;

UPDATE "policy_acceptances"
SET "accepted_version" = '1'
WHERE "accepted_version" IS NULL;

ALTER TABLE "policy_acceptances" ALTER COLUMN "accepted_version" SET NOT NULL;

CREATE TABLE "policy_reads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "policy_reads_user_id_policy_id_version_key"
  ON "policy_reads"("user_id", "policy_id", "version");

ALTER TABLE "policy_reads"
  ADD CONSTRAINT "policy_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_reads"
  ADD CONSTRAINT "policy_reads_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
