# Called2Serve

A playful, unofficial LDS mission personality quiz built as a static GitHub
Pages site.

## Live site

The quiz will be hosted on GitHub Pages at:

<https://d-chambers.github.io/called2serve/>

![QR code for Called2Serve](assets/qr-code.png)

## Local development

Serve the directory with any static file server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Mission data

Mission data is committed in `data/missions.json`. To regenerate it from the
current seed source:

```sh
node scripts/build-missions.mjs
```

The importer currently uses the public 2026 list at Mission Call and applies
coarse metadata rules for quiz scoring. The committed data currently contains
504 missions. The Church Newsroom says 55 new missions become effective
July 1, 2026, bringing the expected total to 506; the importer prints a warning
whenever the seed source produces a count other than 506 so the JSON can be
manually curated.

Each mission record also includes `churchCountry`, `churchWebsiteUrl`,
`wikipediaTitle`, `wikipediaUrl`, and `photoUrl`. Regenerate the Wikipedia/photo
fields with:

```sh
node scripts/enrich-missions-wikipedia.mjs
```

The enrichment script uses Wikipedia page summaries and commits links only; the
site does not embed remote images. `churchWebsiteUrl` points to an official Church
country/facts page when available, otherwise to an official Church search URL for
the mission name.

## GitHub Pages

This project has no build step. The `Deploy GitHub Pages` workflow publishes the
static site on pushes to `main` and can also be run manually from GitHub Actions.

In the repository settings, configure GitHub Pages to use **GitHub Actions** as
the source.
