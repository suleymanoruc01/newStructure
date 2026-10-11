-- S7: favorites, ratings, worker documents, shift rating schedule fields

ALTER TABLE "shifts"
  ADD COLUMN "attendance_confirmed_at" TIMESTAMPTZ(6),
  ADD COLUMN "rating_opens_at" TIMESTAMPTZ(6),
  ADD COLUMN "rating_worker_notified_at" TIMESTAMPTZ(6),
  ADD COLUMN "rating_employer_notified_at" TIMESTAMPTZ(6);

CREATE INDEX "shifts_status_rating_opens_at_idx" ON "shifts"("status", "rating_opens_at");

CREATE TABLE "favorites" (
  "id" UUID NOT NULL,
  "owner_user_id" UUID NOT NULL,
  "owner_employer_id" UUID,
  "target_kind" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorites_owner_user_id_target_kind_target_id_key" ON "favorites"("owner_user_id", "target_kind", "target_id");
CREATE INDEX "favorites_owner_employer_id_target_kind_target_id_idx" ON "favorites"("owner_employer_id", "target_kind", "target_id");
CREATE INDEX "favorites_target_kind_target_id_idx" ON "favorites"("target_kind", "target_id");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ratings" (
  "id" UUID NOT NULL,
  "shift_id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "author_role" TEXT NOT NULL,
  "target_worker_user_id" UUID,
  "target_employer_id" UUID,
  "branch_id" UUID,
  "score" INTEGER NOT NULL,
  "comment" TEXT,
  "moderation_status" TEXT NOT NULL DEFAULT 'visible',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ratings_shift_id_author_user_id_key" ON "ratings"("shift_id", "author_user_id");
CREATE INDEX "ratings_target_worker_user_id_moderation_status_idx" ON "ratings"("target_worker_user_id", "moderation_status");
CREATE INDEX "ratings_target_employer_id_moderation_status_idx" ON "ratings"("target_employer_id", "moderation_status");

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_documents" (
  "id" UUID NOT NULL,
  "worker_profile_id" UUID NOT NULL,
  "document_type" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_key" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending_upload',
  "uploaded_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "worker_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worker_documents_storage_key_key" ON "worker_documents"("storage_key");
CREATE UNIQUE INDEX "worker_documents_worker_profile_id_document_type_key" ON "worker_documents"("worker_profile_id", "document_type");
CREATE INDEX "worker_documents_worker_profile_id_status_idx" ON "worker_documents"("worker_profile_id", "status");

ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_worker_profile_id_fkey" FOREIGN KEY ("worker_profile_id") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
