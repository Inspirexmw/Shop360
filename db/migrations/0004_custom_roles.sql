-- Owner-defined access categories. Apply with: psql "$DATABASE_URL" -f db/migrations/0004_custom_roles.sql
CREATE TABLE IF NOT EXISTS custom_roles (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_roles_name_idx ON custom_roles (name);
