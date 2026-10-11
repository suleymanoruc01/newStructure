ALTER TABLE "platform_admins" ADD COLUMN "email" TEXT;
ALTER TABLE "platform_admins" ADD COLUMN "password_hash" TEXT;
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");
