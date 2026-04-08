CREATE TABLE IF NOT EXISTS tables (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gm_token TEXT NOT NULL UNIQUE,
  meta_json TEXT NOT NULL DEFAULT '{}',
  state_json TEXT NOT NULL,
  last_editor TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS table_invites (
  id TEXT PRIMARY KEY,
  table_slug TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  character_id TEXT DEFAULT '',
  label TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (table_slug) REFERENCES tables(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_table_invites_slug ON table_invites(table_slug);
CREATE INDEX IF NOT EXISTS idx_table_invites_token ON table_invites(token);

CREATE TABLE IF NOT EXISTS table_join_codes (
  id TEXT PRIMARY KEY,
  table_slug TEXT NOT NULL,
  role TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  label TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (table_slug) REFERENCES tables(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_table_join_codes_slug ON table_join_codes(table_slug, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_join_codes_code ON table_join_codes(code, active);

CREATE TABLE IF NOT EXISTS table_snapshots (
  id TEXT PRIMARY KEY,
  table_slug TEXT NOT NULL,
  label TEXT NOT NULL,
  actor_name TEXT DEFAULT '',
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (table_slug) REFERENCES tables(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_table_snapshots_slug ON table_snapshots(table_slug, created_at DESC);
