-- Employer subscription fields
ALTER TABLE "employers" ADD COLUMN "subscription_plan_code" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "employers" ADD COLUMN "subscription_status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "employers" ADD COLUMN "subscription_ends_at" TIMESTAMPTZ(6);

CREATE TABLE "employer_subscription_plans" (
    "id" UUID NOT NULL,
    "plan_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "monthly_price_try" INTEGER NOT NULL,
    "yearly_price_try" INTEGER NOT NULL,
    "max_branches" INTEGER NOT NULL,
    "max_memberships" INTEGER NOT NULL,
    "token_bonus_on_purchase" INTEGER NOT NULL DEFAULT 0,
    "priority_support" BOOLEAN NOT NULL DEFAULT false,
    "analytics_access" BOOLEAN NOT NULL DEFAULT false,
    "api_access" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employer_subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employer_subscription_plans_plan_code_key" ON "employer_subscription_plans"("plan_code");

CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "requester_user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assigned_admin_user_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status", "created_at");
CREATE INDEX "support_tickets_requester_user_id_created_at_idx" ON "support_tickets"("requester_user_id", "created_at");
CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_user_id_fkey" FOREIGN KEY ("assigned_admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "employer_subscription_plans" (
    "id", "plan_code", "display_name", "monthly_price_try", "yearly_price_try",
    "max_branches", "max_memberships", "token_bonus_on_purchase",
    "priority_support", "analytics_access", "api_access", "is_active", "updated_at"
) VALUES
    (gen_random_uuid(), 'free', 'Ücretsiz', 0, 0, 1, 2, 0, false, false, false, true, NOW()),
    (gen_random_uuid(), 'starter', 'Başlangıç', 999, 9990, 3, 5, 5, false, false, false, true, NOW()),
    (gen_random_uuid(), 'professional', 'Profesyonel', 2499, 24990, 10, 15, 15, true, true, false, true, NOW()),
    (gen_random_uuid(), 'enterprise', 'Kurumsal', 4999, 49990, 50, 100, 50, true, true, true, true, NOW());
