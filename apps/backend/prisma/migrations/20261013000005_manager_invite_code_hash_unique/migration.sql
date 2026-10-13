DROP INDEX IF EXISTS "workplace_manager_invites_code_hash_idx";
DROP INDEX IF EXISTS "branch_manager_invites_code_hash_idx";

CREATE UNIQUE INDEX "workplace_manager_invites_code_hash_key" ON "workplace_manager_invites" ("code_hash");
CREATE UNIQUE INDEX "branch_manager_invites_code_hash_key" ON "branch_manager_invites" ("code_hash");
