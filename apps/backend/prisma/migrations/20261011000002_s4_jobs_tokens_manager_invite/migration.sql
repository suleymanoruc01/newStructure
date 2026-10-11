-- AlterTable
ALTER TABLE "branch_managers" ADD COLUMN     "invited_by_user_id" UUID;

-- CreateTable
CREATE TABLE "branch_manager_invites" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "join_code" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 50,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invited_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_manager_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_catalog_items" (
    "id" UUID NOT NULL,
    "sector_code" TEXT NOT NULL,
    "occupation_code" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sector_code" TEXT NOT NULL,
    "occupation_code" TEXT,
    "title" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "remaining_headcount" INTEGER NOT NULL,
    "pay_amount_minor" INTEGER,
    "pay_currency" TEXT NOT NULL DEFAULT 'TRY',
    "favorites_only" BOOLEAN NOT NULL DEFAULT false,
    "gender_filter" TEXT,
    "required_document_types" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_accounts" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "token_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_holds" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "token_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_ledger_entries" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" UUID,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_manager_invites_branch_id_key" ON "branch_manager_invites"("branch_id");

-- CreateIndex
CREATE INDEX "branch_manager_invites_code_hash_idx" ON "branch_manager_invites"("code_hash");

-- CreateIndex
CREATE INDEX "job_catalog_items_sector_code_active_idx" ON "job_catalog_items"("sector_code", "active");

-- CreateIndex
CREATE INDEX "jobs_employer_id_status_starts_at_idx" ON "jobs"("employer_id", "status", "starts_at");

-- CreateIndex
CREATE INDEX "jobs_branch_id_status_idx" ON "jobs"("branch_id", "status");

-- CreateIndex
CREATE INDEX "jobs_status_starts_at_idx" ON "jobs"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_accounts_employer_id_key" ON "token_accounts"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_holds_job_id_key" ON "token_holds"("job_id");

-- CreateIndex
CREATE INDEX "token_holds_employer_id_status_idx" ON "token_holds"("employer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "token_ledger_entries_idempotency_key_key" ON "token_ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "token_ledger_entries_employer_id_created_at_idx" ON "token_ledger_entries"("employer_id", "created_at");

-- AddForeignKey
ALTER TABLE "branch_manager_invites" ADD CONSTRAINT "branch_manager_invites_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_accounts" ADD CONSTRAINT "token_accounts_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holds" ADD CONSTRAINT "token_holds_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holds" ADD CONSTRAINT "token_holds_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
