CREATE TABLE "legal_audit_events" (
  "id" UUID NOT NULL,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actor_user_id" UUID,
  "actor_role" TEXT,
  "resource_type" TEXT,
  "resource_id" UUID,
  "request_id" TEXT,
  "ip_hash" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_audit_events_category_created_at_idx" ON "legal_audit_events"("category", "created_at");
CREATE INDEX "legal_audit_events_actor_user_id_created_at_idx" ON "legal_audit_events"("actor_user_id", "created_at");

CREATE TABLE "devops_error_groups" (
  "id" UUID NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "app" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "release" TEXT,
  "event_count" INTEGER NOT NULL DEFAULT 0,
  "first_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "resolved_at" TIMESTAMPTZ(6),
  "resolved_by_user_id" UUID,
  CONSTRAINT "devops_error_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "devops_error_groups_fingerprint_key" ON "devops_error_groups"("fingerprint");
CREATE INDEX "devops_error_groups_app_status_last_seen_at_idx" ON "devops_error_groups"("app", "status", "last_seen_at");

CREATE TABLE "devops_error_events" (
  "id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "app" TEXT NOT NULL,
  "release" TEXT,
  "platform" TEXT,
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "request_id" TEXT,
  "extra" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "devops_error_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "devops_error_events_group_id_created_at_idx" ON "devops_error_events"("group_id", "created_at");
ALTER TABLE "devops_error_events" ADD CONSTRAINT "devops_error_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "devops_error_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "devops_releases" (
  "id" UUID NOT NULL,
  "app" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "git_sha" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "built_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "devops_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "devops_releases_app_environment_git_sha_key" ON "devops_releases"("app", "environment", "git_sha");
CREATE INDEX "devops_releases_app_environment_built_at_idx" ON "devops_releases"("app", "environment", "built_at");

CREATE TABLE "abuse_reports" (
  "id" UUID NOT NULL,
  "reporter_user_id" UUID,
  "target_user_id" UUID,
  "category" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(6),
  "resolved_by_user_id" UUID,
  CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "abuse_reports_status_created_at_idx" ON "abuse_reports"("status", "created_at");

CREATE TABLE "remote_config" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "geofence_radius_m" INTEGER NOT NULL,
  "geofence_soft_radius_m" INTEGER NOT NULL,
  "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
  "min_mobile_ios_version" TEXT,
  "min_mobile_android_version" TEXT,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "remote_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "remote_config" ("id", "geofence_radius_m", "geofence_soft_radius_m", "maintenance_mode", "updated_at")
VALUES ('default', 100, 150, false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
