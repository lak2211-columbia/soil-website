# SOIL

**소소한 일상** — the small, ordinary day. And *soil*: the ground a life takes root in.

A single-page magazine homepage built around the double meaning of its name. Each issue is
organised around **의식주** — dress, food, and dwelling: the three plain needs every life is
built from, and the three places where a culture quietly keeps itself.

## What's here

A hand-built magazine site and its own editor, with no framework and no build step.

- **The magazine**: pages rendered on Vercel from a Postgres database. The current issue on the
  homepage, a page for every story, an archive of past issues, and contributor pages.
- **The editor** at `/admin`: write stories in a block editor (paragraphs, subheadings, pull
  quotes, Q&A, images, dividers), arrange each issue, manage contributors and the site's text, and
  write and send *The SOIL Letter* to subscribers.

```bash
npm install
npm run dev      # http://127.0.0.1:3000 · editor at /admin
```

Deployment and environment variables: see `CLAUDE.md` and `.env.example`.

## Design

Cormorant Garamond (with its italic) for display, Inter for navigation and metadata, both from
Google Fonts. Five colour schemes ship with the page and switch live from the palette bar at the
bottom of the screen; every colour is a CSS custom property scoped to a `data-palette` attribute,
so one click recolours accents, hairlines, tags, photo grading and the header together.

Porcelain & Celadon · Hanji & Persimmon · Bojagi Indigo · Pine & Clay · Ink (dark)

To ship a single scheme, delete the other four blocks at the top of `public/css/soil.css` and the
`paletteBar` markup in `lib/render/layout.js`.

## Imagery

Every image slot holds two layers: a hand-built SVG illustration underneath, and a photograph that
fades in over it once it decodes. Each slot tries a list of candidate URLs in order, so a dead link
falls through to the next and finally to the illustration — the page can never show a broken image
frame, and still reads well offline.

Photographs are hotlinked from Wikimedia Commons and graded in CSS to sit inside the palette.
They remain under their original licences, which vary between public domain and Creative Commons
terms requiring attribution. **Check each file's licence before using this commercially.**

## Editorial content

Articles, bylines and interviews are **placeholder copy written for design purposes.** The
interviews attributed to named public figures did not take place. Replace them before publishing.

## Licence

Code under MIT. This does not extend to the photographs, which keep their own licences.
