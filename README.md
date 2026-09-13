# A Bit Cold Visual World

Shared visual inbox for the band. Phase 1: tap your name, upload images, browse all or by member, edit or delete your own.

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
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. That creates the table, the private `references` bucket, and the policies that let the website insert, update, and delete rows.

The table is quoted as `"references"` because that word is reserved in Postgres.

`SUPABASE_SERVICE_ROLE_KEY` must be the **secret** / `service_role` key, not the publishable / `anon` key. The secret key is the one that can bypass a locked-down database. If you already ran an older schema, run the file again — it is safe to repeat.

### Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add these environment variables (Production, Preview, and Development). Keep them **Sensitive** — do not use a `NEXT_PUBLIC_` prefix.

- `SUPABASE_URL` — **Project URL** from Supabase → Settings → API. It must look like `https://xxxx.supabase.co`. Not the database URI (`postgresql://...`), not the project id alone.
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` secret from the same API page
- `APP_PASSWORD`
- `SESSION_SECRET` (long random string)

Redeploy after changing env vars.

The password was shared in chat. Change it before the live URL goes to the band.

## Members

Felipe, Alex, Theo, Luis, Marc, SaucePicant. Same password for everyone.

## What Phase 1 does not do

Voting, comments, Core vs Inbox, named boards, curator promote/archive, Instagram paste, AI analysis.
