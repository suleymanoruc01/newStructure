CREATE TABLE "adapty_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "public_sdk_key" TEXT NOT NULL DEFAULT '',
    "secret_key" TEXT NOT NULL DEFAULT '',
    "webhook_authorization" TEXT NOT NULL DEFAULT '',
    "placement_id" TEXT NOT NULL DEFAULT '',
    "apple_store_connected" BOOLEAN NOT NULL DEFAULT false,
    "google_store_connected" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adapty_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "adapty_settings" (
    "id",
    "enabled",
    "public_sdk_key",
    "secret_key",
    "webhook_authorization",
    "placement_id",
    "apple_store_connected",
    "google_store_connected",
    "updated_at"
) VALUES ('default', false, '', '', '', '', false, false, NOW());

ALTER TABLE "token_packages" ADD COLUMN "ios_product_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "token_packages" ADD COLUMN "android_product_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "token_packages" ADD COLUMN "adapty_product_id" TEXT NOT NULL DEFAULT '';
