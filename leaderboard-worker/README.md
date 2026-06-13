# Park It! — leaderboard worker

A Cloudflare Worker + D1 (SQLite) backend for the public leaderboard. Free tier, deployed
separately from the game (GitHub Pages only serves `dist/`, not this folder).

## Endpoints

- `GET /scores?mode=normal|hard&limit=10` → `[{ nickname, level, stars }, ...]`
- `POST /scores` with `{ nickname, level, stars, difficulty }` → `{ ok: true, nickname }`

Writes are validated server-side: nickname sanitized + length-capped + profanity-screened,
`level`/`stars` range-checked, and rate-limited to 10 writes/minute per IP.

## Deploy (run from this folder)

```sh
npx wrangler login
npx wrangler d1 create parkit-leaderboard          # copy database_id → wrangler.toml
npx wrangler d1 execute parkit-leaderboard --file=./schema.sql --remote
npx wrangler kv namespace create RL                # copy id → wrangler.toml
npx wrangler deploy                                # prints your Worker URL
```

Then paste the printed Worker URL into `LEADERBOARD_URL` in `../src/config.js`.

## Verify

```sh
curl "https://<your-worker-url>/scores?mode=normal"
curl -X POST "https://<your-worker-url>/scores" \
  -H 'Content-Type: application/json' \
  -d '{"nickname":"TEST","level":3,"stars":5,"difficulty":"normal"}'
```
