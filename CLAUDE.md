# SOIL magazine website (soilmag.com)

Framework-free site with a custom admin. Plain HTML/CSS/JS in the browser; plain Node functions
on Vercel; Postgres for content. Two runtime dependencies only: `postgres` and `@vercel/blob`.

## Layout

- `api/site.js`: renders every public page from the database. `vercel.json` rewrites `/`,
  `/stories/:slug`, `/issues`, `/issues/:number`, `/contributors/:slug`, `/unsubscribe` to it
  (original path passed as `?p=`). `?preview=1` shows drafts, only with the admin cookie.
- `api/admin.js`: the admin API, one function routed by `?r=<resource>&id=<id>`. Requires the
  session cookie; every non-GET must send `x-soil-admin: 1` (CSRF guard with SameSite=Strict).
- `api/subscribe.js`: public newsletter signup, unsubscribe form, and RFC 8058 one-click unsubscribe.
- Functions use the Web signature (`export const GET = (request) => Response`).
- `lib/`: `db.js` (connection + `ensureSchema()` on cold start), `content.js` (public queries),
  `render/` (page templates as template strings; `layout.js` is the shell, header, footer),
  `html.js` (escaping + inline markup), `blocks.js` (story/letter body blocks), `auth.js`,
  `storage.js` (Vercel Blob, or `public/uploads/` locally), `email.js` (letter HTML + Resend),
  `art.js` (the 15 drawn SVG fallbacks), `http.js`.
- `db/schema.js` (idempotent DDL), `db/seed-data.js` + `db/seed.js` (Issue No. 04 starter content).
- `public/`: static files. `css/soil.css` + `js/soil.js` for the site; `admin/` is the editor
  (`index.html`, `admin.css`, ES modules in `admin/js/`, views in `admin/js/views/`).
- `dev/server.js`: local server that mirrors Vercel (static files, `vercel.json` rewrites and
  headers, `api/*` functions). `dev/db.js`: local Postgres cluster in `.dev/pgdata` (port 54329).

## Content model

- `issues` (number, season, strap, status, `is_current`, `cover_story_id`, `highlight_ids` for the
  "In This Issue" sidebar). The homepage shows the current published issue.
- `stories` (section `dress|food|home`, position, category, kind, credit, `photos` = candidate URLs
  tried in order, `art` = drawn fallback, `body` = blocks). Section grids exclude the cover and
  sidebar stories. Public only when the story and its issue are published.
- `contributors` ↔ `story_contributors`. `settings` (keys `site`, `sections`, `about`, `newsletter`;
  defaults come from `db/seed-data.js`).
- `subscribers`, `letters`, `letter_sends` (one row per recipient, so sending resumes after errors).
- Inline markup in text fields: `*em*`, `**한글**` (upright Korean, `<b class="ko">`), `[text](url)`.
- Body blocks: `p`, `h`, `quote`, `qa`, `image`, `divider` (see `lib/blocks.js`).

## Gotchas

- `postgres` is v4: pass jsonb values as plain objects/arrays (`${value}::jsonb`), never
  `JSON.stringify` them, or a JSON string is stored. `json()` in `lib/db.js` is just a marker.
- The site CSS styles every `header` element as the fixed site header. Use `<div>` for page headings.
- Postgres on macOS needs `LC_ALL` set to start (handled in `dev/db.js`).
- Node is from Homebrew (`/opt/homebrew/bin`), which may not be on the agent shell's PATH.

## Run locally

```bash
npm install
npm run dev          # starts Postgres + http://127.0.0.1:3000 (admin at /admin)
npm run db:seed      # load Issue No. 04 into an empty database
```

`.env.local` (written on first `npm run dev`, not committed) holds the local admin password.
Without `RESEND_API_KEY`, letters are written to `.dev/outbox/*.html`. Without
`BLOB_READ_WRITE_TOKEN`, uploads go to `public/uploads/` (gitignored).
`.claude/launch.json` has this as the `soil` preview configuration.

## Deploy

- Hosting: Vercel, team "Soil" (slug `soil2`); project URL `soil-website-nu.vercel.app`.
  `vercel.json` sets framework `null` (Other), output `public/`.
- Needs, in Vercel: a Postgres database and a Blob store (Storage tab, which adds `DATABASE_URL`
  and `BLOB_READ_WRITE_TOKEN`), plus `ADMIN_PASSWORD`, `SESSION_SECRET` (32+ chars), `SITE_URL`,
  and for sending letters `RESEND_API_KEY` + `NEWSLETTER_FROM` (domain verified in Resend, DNS at
  GoDaddy). See `.env.example`. The schema is created automatically; the admin dashboard offers
  "Load starter content" when the database is empty.
- Source: GitHub `lak2211-columbia/soil-website`. **Pushing to `main` deploys to production.**
  Work happens on branches; only push when the user asks.
- The Vercel MCP connector sees the Soil team but returns not-found/403 for the project, so check
  deploys over HTTP or `gh api repos/lak2211-columbia/soil-website/deployments`.
- Branch `astro-rebuild` (local only) holds a set-aside Astro + Keystatic version.

## Logo work (in progress)

Direction: lowercase "soil" traced by hand over Cormorant Garamond 500, with a celadon seed for
the dot on the i; the seed doubles as the favicon. Sketches: `design/wordmark-studies.html` (also
the "Soil Wordmark Studies" artifact). Waiting on the user's hand-drawn scans; then trace to a
one-colour SVG (`fill="currentColor"`), put it in `header()`/`footer()` in `lib/render/layout.js`,
and add `public/favicon.svg` linked from `layout()`.

## Warnings

- **Do not run `push.sh`.** It deletes `.git`, re-inits and force-pushes. Use normal git, only when asked.
- `~/Downloads/mag web` (repo `soil-website-demo`) is an older draft, not the live site.

## Before real publication

- Interviews attributed to real people (Min Jin Lee, David Chang, Sandra Oh, Jay Park) are
  placeholder copy that never took place. Replace or remove them.
- Wikimedia photos are hotlinked under their own licences; credit them or replace with uploads.
- Newsletter footer needs a postal address (Site settings → Newsletter box) for anti-spam law.
- Signup has a honeypot field but no rate limiting or double opt-in.
