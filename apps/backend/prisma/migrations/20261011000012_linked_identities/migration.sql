CREATE TABLE "linked_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "linked_identities_provider_subject_key" ON "linked_identities"("provider", "subject");
CREATE UNIQUE INDEX "linked_identities_user_id_provider_key" ON "linked_identities"("user_id", "provider");

ALTER TABLE "linked_identities" ADD CONSTRAINT "linked_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
