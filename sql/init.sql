CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
