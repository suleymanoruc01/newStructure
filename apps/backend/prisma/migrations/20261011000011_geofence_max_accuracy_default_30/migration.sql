ALTER TABLE "remote_config" ALTER COLUMN "geofence_max_accuracy_m" SET DEFAULT 30;

UPDATE "remote_config"
SET "geofence_max_accuracy_m" = 30
WHERE "geofence_max_accuracy_m" = 80;
