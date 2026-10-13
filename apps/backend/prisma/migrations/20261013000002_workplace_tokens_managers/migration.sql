ALTER TABLE "employers"
  ADD COLUMN "address_line1" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6);

ALTER TABLE "jobs" ALTER COLUMN "branch_id" DROP NOT NULL;
ALTER TABLE "shifts" ALTER COLUMN "branch_id" DROP NOT NULL;

ALTER TABLE "token_accounts" ALTER COLUMN "employer_id" DROP NOT NULL;
ALTER TABLE "token_accounts" ADD COLUMN "branch_id" UUID;
ALTER TABLE "token_accounts" ADD COLUMN "owner_user_id" UUID;
CREATE UNIQUE INDEX "token_accounts_branch_id_key" ON "token_accounts"("branch_id");
CREATE UNIQUE INDEX "token_accounts_owner_user_id_key" ON "token_accounts"("owner_user_id");
ALTER TABLE "token_accounts" ADD CONSTRAINT "token_accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_accounts" ADD CONSTRAINT "token_accounts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_accounts" ADD CONSTRAINT "token_accounts_one_scope" CHECK (
  ((CASE WHEN "employer_id" IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN "branch_id" IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN "owner_user_id" IS NOT NULL THEN 1 ELSE 0 END)) = 1
);

ALTER TABLE "token_holds" ADD COLUMN "branch_id" UUID;
ALTER TABLE "token_holds" ADD CONSTRAINT "token_holds_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "token_holds_branch_id_status_idx" ON "token_holds"("branch_id", "status");

ALTER TABLE "token_ledger_entries" ALTER COLUMN "employer_id" DROP NOT NULL;
ALTER TABLE "token_ledger_entries" ADD COLUMN "owner_user_id" UUID;
ALTER TABLE "token_ledger_entries" ADD COLUMN "branch_id" UUID;
CREATE INDEX "token_ledger_entries_owner_user_id_created_at_idx" ON "token_ledger_entries"("owner_user_id", "created_at");
CREATE INDEX "token_ledger_entries_branch_id_created_at_idx" ON "token_ledger_entries"("branch_id", "created_at");
ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "workplace_managers" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "employer_id" UUID NOT NULL,
  "invited_by_user_id" UUID,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workplace_managers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workplace_managers_user_id_employer_id_key" ON "workplace_managers"("user_id", "employer_id");
ALTER TABLE "workplace_managers" ADD CONSTRAINT "workplace_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workplace_managers" ADD CONSTRAINT "workplace_managers_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workplace_manager_invites" (
  "id" UUID NOT NULL,
  "employer_id" UUID NOT NULL,
  "join_code" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "max_uses" INTEGER NOT NULL DEFAULT 50,
  "use_count" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "invited_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workplace_manager_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workplace_manager_invites_employer_id_key" ON "workplace_manager_invites"("employer_id");
CREATE INDEX "workplace_manager_invites_code_hash_idx" ON "workplace_manager_invites"("code_hash");
ALTER TABLE "workplace_manager_invites" ADD CONSTRAINT "workplace_manager_invites_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "token_requests" (
  "id" UUID NOT NULL,
  "requester_user_id" UUID NOT NULL,
  "employer_id" UUID NOT NULL,
  "branch_id" UUID,
  "amount" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "note" TEXT,
  "resolved_amount" INTEGER,
  "resolved_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(6),
  CONSTRAINT "token_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "token_requests_employer_id_status_created_at_idx" ON "token_requests"("employer_id", "status", "created_at");
CREATE INDEX "token_requests_requester_user_id_status_idx" ON "token_requests"("requester_user_id", "status");
ALTER TABLE "token_requests" ADD CONSTRAINT "token_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_requests" ADD CONSTRAINT "token_requests_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "token_requests" ADD CONSTRAINT "token_requests_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_requests" ADD CONSTRAINT "token_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
