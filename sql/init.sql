CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role IN ('admin', 'voter')),
  enabled boolean NOT NULL DEFAULT true,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id text NOT NULL,
  candidate_id text NOT NULL,
  voter_hash text NOT NULL,
  request_id text NOT NULL,
  cast_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_votes_election_voter
  ON votes (election_id, voter_hash);

CREATE UNIQUE INDEX IF NOT EXISTS ux_votes_request_id
  ON votes (request_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id text,
  actor_role text,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS ix_audit_logs_actor
  ON audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS ix_audit_logs_action
  ON audit_logs (action);

CREATE INDEX IF NOT EXISTS ix_audit_logs_resource
  ON audit_logs (resource);

CREATE TABLE IF NOT EXISTS report_jobs (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
  params jsonb,
  s3_bucket text,
  s3_key text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS ix_report_jobs_status
  ON report_jobs (status);
