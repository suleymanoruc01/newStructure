ALTER TABLE "workplace_managers"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

ALTER TABLE "branch_managers"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

ALTER TABLE "workplace_manager_invites"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '["jobs.create","jobs.read","jobs.update","branches.create","branches.update","branches.delete","tokens.purchase"]'::jsonb;

ALTER TABLE "branch_manager_invites"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '["jobs.create","jobs.read","jobs.update"]'::jsonb;

UPDATE "workplace_manager_invites"
SET "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

UPDATE "branch_manager_invites"
SET "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;
