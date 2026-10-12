CREATE TABLE "sms_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "verimor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "header" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sms_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "sms_settings" ("id", "verimor_enabled", "username", "password", "header", "updated_at")
VALUES ('default', false, '', '', '', NOW());
