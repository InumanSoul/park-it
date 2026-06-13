CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  level INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rank ON scores (difficulty, level DESC, stars DESC, created_at ASC);
