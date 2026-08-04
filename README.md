# neocities-site

Landing page for a Neocities site. `index.html` shows a card for every
project subfolder, each linking to that folder's own `index.html`.

## Adding a project

1. Drop a new folder in the repo root containing its own `index.html`
   (give it a `<title>` and, optionally, a `<meta name="description">` —
   both get pulled onto its card).
2. Run:

   ```
   node build.js
   ```

   This scans every subfolder, writes `projects.json`, and rewrites the
   embedded data block inside `index.html` so the page needs no live
   fetch — it works the same over `file://` and once uploaded.
3. Upload the whole folder to Neocities (drag-and-drop or their CLI/API) —
   `index.html`, `projects.json`, and the new project folder.

Removing or retitling a project works the same way: change the folder,
rerun `node build.js`, redeploy.

## Current projects

- `jackaroo-solo/` — Jackaroo Solo, a solitaire card-and-marble puzzle game.
- `new-year-2025/` — Global New Year Countdown.
