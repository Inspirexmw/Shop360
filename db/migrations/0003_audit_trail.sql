-- Append-only audit trail. Apply with: psql "$DATABASE_URL" -f db/migrations/0003_audit_trail.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamp without time zone NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  summary text,
  before jsonb,
  after jsonb,
  intent text
);

CREATE INDEX IF NOT EXISTS audit_log_at_idx ON audit_log (at);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_action_email_idx ON audit_log (action, actor_email, at);
