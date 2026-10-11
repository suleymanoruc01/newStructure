ALTER TABLE "remote_config" ADD COLUMN "geofence_max_accuracy_m" INTEGER NOT NULL DEFAULT 80;
ALTER TABLE "remote_config" ADD COLUMN "checkin_early_minutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "remote_config" ADD COLUMN "checkin_late_minutes" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "check_ins" ADD COLUMN "soft_pass" BOOLEAN NOT NULL DEFAULT false;
