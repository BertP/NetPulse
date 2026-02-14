CREATE TABLE IF NOT EXISTS devices (
  mac TEXT PRIMARY KEY,
  ip TEXT,
  hostname TEXT,
  vendor TEXT,
  status TEXT CHECK(status IN ('ONLINE', 'UNSTABLE', 'OFFLINE')),
  source TEXT CHECK(source IN ('UNIFI', 'SCAN', 'BOTH')),
  last_seen INTEGER,
  is_fixed_ip INTEGER DEFAULT 0,
  updated_at INTEGER
);
