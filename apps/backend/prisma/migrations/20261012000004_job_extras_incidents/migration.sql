ALTER TABLE "users" ADD COLUMN "email" TEXT;
ALTER TABLE "users" ADD COLUMN "deletion_requested_at" TIMESTAMPTZ(6);

ALTER TABLE "jobs" ADD COLUMN "amenities" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "jobs" ADD COLUMN "instant_auto_approve" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "shift_incidents" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "worker_user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shift_incidents_shift_id_created_at_idx" ON "shift_incidents"("shift_id", "created_at");

ALTER TABLE "shift_incidents" ADD CONSTRAINT "shift_incidents_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
