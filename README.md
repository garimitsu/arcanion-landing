# Arcanion — landing page

The Arcanion marketing landing page. One self-contained HTML document with a
three.js scene: hero → games → models → an explore corridor you fly through on
scroll.

No build step, no bundler, no framework. `index.html` is the whole site.

## Run it locally

It must be served over http (ES modules and `fetch` don't work from `file://`):

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL.

## Deploy on Vercel

Import the repo and deploy — `vercel.json` already declares it as a static site
with no build step, so the defaults are correct:

- Framework preset: **Other**
- Build command: none
- Output directory: repository root

Or from the CLI:

```sh
npx vercel deploy --prod
```

## Wiring up the buttons

Every call to action — the nav's **Enter Studio** and **Pricing**, both **Start
Building** bars, and each corridor card's open button — is inert until you give
it a destination. Find `STANDALONE_LINKS` in the module script near the bottom
of `index.html`:

```js
const STANDALONE_LINKS = {
  enter:   '',   // e.g. 'https://app.example.com/'
  pricing: '',   // e.g. 'https://example.com/pricing'
};
```

Fill those in. The prompt typed into a Start Building bar is forwarded as
`?prompt=`, and opening a corridor card adds `?model=`.

Left empty the buttons only log to the console — the safe default for a page
with nowhere to send anyone.

## Layout

```
index.html                  the entire site — markup, styles, scene, controller
fonts/                      the two local typefaces (the rest come from Google Fonts)
images/                     brand mark and provider logos
images/games/               key art for the titles in the Games section
vercel.json                 static-site config + asset cache headers
```

Third-party runtime dependencies are loaded from CDNs and pinned:
[three.js](https://threejs.org) r0.162 and [Lenis](https://lenis.darkroom.engineering)
1.3.19 from unpkg, plus Orbitron / Rajdhani / JetBrains Mono from Google Fonts.
If any of them is unreachable the page fails soft: the 3D scene is skipped and
all the copy is revealed rather than staying hidden behind a reveal animation.

Model preview images are hotlinked from Hugging Face and GitHub. A preview that
fails to load simply leaves its plate empty.

## Notice

**This repository is public, not open source.** All rights reserved. The source
is visible so it can be deployed and reviewed; no licence to copy, modify or
redistribute it is granted.

Some third-party material ships alongside it:

- `fonts/AstronBoy.otf` — Astron Boy by Raymond Larabie, released under
  [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Free to
  redistribute.
- `fonts/DigitalCards-Regular.ttf` — Digital Cards, © 2023 177Studio.com.
  Bundled deliberately: it is the display typeface the whole design is set in.
- `images/*.png` — provider and engine logos, used nominatively to name the
  services Arcanion connects to. Each mark belongs to its owner.
- `images/games/*.jpg` — key art for the linked titles. Each belongs to its game.
