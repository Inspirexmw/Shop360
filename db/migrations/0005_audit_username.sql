-- Stamp every audit row with the actor's username. Apply with: psql "$DATABASE_URL" -f db/migrations/0005_audit_username.sql
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_username text;

-- Backfill history from the current user record. Rows with no resolvable user stay blank.
UPDATE audit_log a
SET actor_username = u.username
FROM users u
WHERE a.actor_user_id = u.id
  AND (a.actor_username IS NULL OR a.actor_username = '');

CREATE INDEX IF NOT EXISTS audit_log_actor_username_idx ON audit_log (actor_username, at DESC);
