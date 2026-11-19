-- Shop360: account profile fields and server-side sessions.
-- Idempotent. Run once against the target database, e.g.:
--   psql "$DATABASE_URL" -f db/migrations/0001_account_sessions.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill usernames from the email local part, de-duplicated with a numeric suffix.
WITH b AS (
  SELECT id,
         COALESCE(NULLIF(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g'), ''), 'user') AS base,
         created_at
  FROM users
  WHERE username IS NULL
),
r AS (
  SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY created_at) AS rn
  FROM b
)
UPDATE users u
SET username = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || r.rn::text END
FROM r
WHERE u.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
