CREATE TABLE IF NOT EXISTS devices (
  mac TEXT PRIMARY KEY,
  ip TEXT,
  hostname TEXT,
  vendor TEXT,
  status TEXT CHECK(status IN ('ONLINE', 'OFFLINE')),
  source TEXT CHECK(source IN ('UNIFI', 'SCAN', 'BOTH')),
  last_seen INTEGER,
  updated_at INTEGER
);
