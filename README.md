# A Bit Cold Visual World

Shared visual inbox for the band. Phase 1: tap your name, upload images, view the board.

## Local

```bash
cp .env.example .env.local
```

Set `APP_PASSWORD` and a long random `SESSION_SECRET`. Leave the Supabase keys empty to store images on disk in `.data/` (gitignored). That is only for local testing.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Hosting (cheap)

Zoho Mail cannot host this app. Use:

1. **Supabase** (free) — database + private image storage
2. **Vercel** (Hobby, free) — the website (`*.vercel.app`)

Later you can point `board.abitcold.ca` at Vercel with a CNAME.

### Supabase

1. Create a free project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Storage → New bucket → name `references` → **private**.

The table is quoted as `"references"` because that word is reserved in Postgres.

### Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (service role, never public)
- `APP_PASSWORD`
- `SESSION_SECRET` (long random string)

The password was shared in chat. Change it before the live URL goes to the band.

## Members

Felipe, Alex, Theo, Luis, Marc, SaucePicant. Same password for everyone.

## What Phase 1 does not do

Voting, comments, Core vs Inbox, named boards, curator promote/archive, Instagram paste, AI analysis.
