CREATE TABLE "token_packages" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL,
    "price_try" INTEGER NOT NULL,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "token_packages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "token_packages_active_sort_idx" ON "token_packages"("is_active", "sort_order");

INSERT INTO "token_packages" (
    "id", "label", "token_count", "price_try", "discount_percent",
    "is_popular", "is_active", "sort_order", "updated_at"
) VALUES
    (gen_random_uuid(), '10 jeton', 10, 199, 0, false, true, 0, NOW()),
    (gen_random_uuid(), '25 jeton', 25, 449, 5, true, true, 1, NOW()),
    (gen_random_uuid(), '50 jeton', 50, 849, 8, false, true, 2, NOW()),
    (gen_random_uuid(), '100 jeton', 100, 1599, 10, false, true, 3, NOW()),
    (gen_random_uuid(), '250 jeton', 250, 3799, 15, false, true, 4, NOW());
