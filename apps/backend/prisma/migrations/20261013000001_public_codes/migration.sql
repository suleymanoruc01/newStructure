CREATE OR REPLACE FUNCTION parton_public_code(prefix text)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
  n int;
BEGIN
  IF prefix NOT IN ('ER', 'EE', 'TR', 'BR') THEN
    RAISE EXCEPTION 'invalid public code prefix';
  END IF;
  FOR n IN 1..32 LOOP
    candidate := prefix;
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + (floor(random() * 62))::int, 1);
    END LOOP;
    RETURN candidate;
  END LOOP;
  RAISE EXCEPTION 'public code exhausted';
END;
$$;

ALTER TABLE "users" ADD COLUMN "employer_public_code" VARCHAR(8);
CREATE UNIQUE INDEX "users_employer_public_code_key" ON "users"("employer_public_code");

ALTER TABLE "worker_profiles" ADD COLUMN "public_code" VARCHAR(8);
ALTER TABLE "employers" ADD COLUMN "public_code" VARCHAR(8);
ALTER TABLE "branches" ADD COLUMN "public_code" VARCHAR(8);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM worker_profiles WHERE public_code IS NULL LOOP
    LOOP
      BEGIN
        UPDATE worker_profiles SET public_code = parton_public_code('EE') WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
  FOR r IN SELECT id FROM employers WHERE public_code IS NULL LOOP
    LOOP
      BEGIN
        UPDATE employers SET public_code = parton_public_code('TR') WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
  FOR r IN SELECT id FROM branches WHERE public_code IS NULL LOOP
    LOOP
      BEGIN
        UPDATE branches SET public_code = parton_public_code('BR') WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
  FOR r IN
    SELECT DISTINCT user_id AS id
    FROM employer_memberships
    WHERE role = 'owner' AND status = 'active'
  LOOP
    LOOP
      BEGIN
        UPDATE users
        SET employer_public_code = parton_public_code('ER')
        WHERE id = r.id AND employer_public_code IS NULL;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE "worker_profiles" ALTER COLUMN "public_code" SET NOT NULL;
ALTER TABLE "worker_profiles" ALTER COLUMN "public_code" SET DEFAULT parton_public_code('EE');
CREATE UNIQUE INDEX "worker_profiles_public_code_key" ON "worker_profiles"("public_code");

ALTER TABLE "employers" ALTER COLUMN "public_code" SET NOT NULL;
ALTER TABLE "employers" ALTER COLUMN "public_code" SET DEFAULT parton_public_code('TR');
CREATE UNIQUE INDEX "employers_public_code_key" ON "employers"("public_code");

ALTER TABLE "branches" ALTER COLUMN "public_code" SET NOT NULL;
ALTER TABLE "branches" ALTER COLUMN "public_code" SET DEFAULT parton_public_code('BR');
CREATE UNIQUE INDEX "branches_public_code_key" ON "branches"("public_code");
