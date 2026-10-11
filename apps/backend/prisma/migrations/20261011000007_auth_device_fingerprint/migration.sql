ALTER TABLE "auth_bans" ADD COLUMN "device_hash" TEXT;

CREATE INDEX "auth_bans_device_hash_idx" ON "auth_bans"("device_hash");
CREATE INDEX "auth_bans_tax_id_idx" ON "auth_bans"("tax_id");

CREATE TABLE "device_fingerprints" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "device_fingerprints_user_id_hash_key" ON "device_fingerprints"("user_id", "hash");
CREATE INDEX "device_fingerprints_hash_idx" ON "device_fingerprints"("hash");

ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
