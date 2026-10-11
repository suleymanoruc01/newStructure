-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "worker_user_id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "confirm_opens_at" TIMESTAMPTZ(6) NOT NULL,
    "confirm_deadline_at" TIMESTAMPTZ(6) NOT NULL,
    "confirm_3h_notified_at" TIMESTAMPTZ(6),
    "checkin_due_notified_at" TIMESTAMPTZ(6),
    "availability_decision" TEXT,
    "availability_responded_at" TIMESTAMPTZ(6),
    "checked_in_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_confirms" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "actor_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_confirms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "accuracy_m" DECIMAL(8,2) NOT NULL,
    "distance_m" DECIMAL(10,2) NOT NULL,
    "mock_location" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL,
    "failure_code" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_disputes" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "worker_user_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "check_in_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shift_id" UUID,
    "type" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shifts_application_id_key" ON "shifts"("application_id");

-- CreateIndex
CREATE INDEX "shifts_worker_user_id_status_starts_at_idx" ON "shifts"("worker_user_id", "status", "starts_at");

-- CreateIndex
CREATE INDEX "shifts_employer_id_branch_id_starts_at_idx" ON "shifts"("employer_id", "branch_id", "starts_at");

-- CreateIndex
CREATE INDEX "shifts_status_confirm_opens_at_idx" ON "shifts"("status", "confirm_opens_at");

-- CreateIndex
CREATE INDEX "shifts_status_confirm_deadline_at_idx" ON "shifts"("status", "confirm_deadline_at");

-- CreateIndex
CREATE INDEX "availability_confirms_shift_id_created_at_idx" ON "availability_confirms"("shift_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_idempotency_key_key" ON "check_ins"("idempotency_key");

-- CreateIndex
CREATE INDEX "check_ins_shift_id_created_at_idx" ON "check_ins"("shift_id", "created_at");

-- CreateIndex
CREATE INDEX "check_in_disputes_shift_id_status_idx" ON "check_in_disputes"("shift_id", "status");

-- CreateIndex
CREATE INDEX "risk_events_user_id_created_at_idx" ON "risk_events"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_worker_user_id_fkey" FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_confirms" ADD CONSTRAINT "availability_confirms_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_disputes" ADD CONSTRAINT "check_in_disputes_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
