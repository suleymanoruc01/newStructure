ALTER TABLE "workplace_managers"
  ALTER COLUMN "permissions" SET DEFAULT '["jobs.create","jobs.read","jobs.update","branches.create","branches.update","branches.delete","tokens.purchase"]'::jsonb;

ALTER TABLE "branch_managers"
  ALTER COLUMN "permissions" SET DEFAULT '["jobs.create","jobs.read","jobs.update"]'::jsonb;

UPDATE "workplace_managers"
SET "permissions" = '["jobs.create","jobs.read","jobs.update","branches.create","branches.update","branches.delete","tokens.purchase"]'::jsonb
WHERE "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

UPDATE "branch_managers"
SET "permissions" = '["jobs.create","jobs.read","jobs.update"]'::jsonb
WHERE "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

UPDATE "workplace_manager_invites"
SET "permissions" = '["jobs.create","jobs.read","jobs.update","branches.create","branches.update","branches.delete","tokens.purchase"]'::jsonb
WHERE "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;

UPDATE "branch_manager_invites"
SET "permissions" = '["jobs.create","jobs.read","jobs.update"]'::jsonb
WHERE "permissions" = '["jobs.create","jobs.read","jobs.update","jobs.delete","tokens.refund"]'::jsonb;
