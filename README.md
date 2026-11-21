[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Hoppererin/gta6-trophy-guide-01-v5/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Hoppererin/gta6-trophy-guide-01-v5/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Vice Platinum II — GTA VI Trophy Guide & Tracker

An offline web app that guides and tracks all **55 PlayStation 5 trophies** of
Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden).
Built for the [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01)
competition on make.fun.

## What it does

- **Tracker first:** every trophy with its official name, description and grade;
  a checklist saved in the browser (localStorage) with **export and import**;
  filters by kind (story, missable, collectibles, activities, characters,
  robbery, money, misc) plus search; a **spoiler setting** that hides story and
  hidden trophies until they are earned; per-trophy count steppers
  (e.g. 7/18 meditations).
- **Roadmap S1–S5:** story first (60–80 h) → partner play → the 100% grind
  (~100 h) → Strangers & Freaks (~10 h) → cleanup & platinum, with the full
  100% Completion checklist table (robberies, collectibles, activities).
- **Cited guidance:** every guide step cites its sources inline as numbered
  references **[n]**; each trophy shows its sources with full titles,
  “N claims here” and the date read (21 Nov 2026). **159 atomic claims,
  318 citations, 100% of steps backed by 2+ sources, 15 sources.**
- **Sources differ:** 20 disputed claims are shown with **both versions and
  “Our call”** instead of silently picking a side — including the only
  possibly-missable trophy (Positive Mental Attitude, Chapter 1 balcony
  meditation) and the 5 trophies whose methods are still unsolved
  (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out
  There, Ten Pin), which this guide marks **unconfirmed** rather than guessing.
- **Audit strip:** claims 159/159, backed 2+ 100%, sources 15, disputes 20,
  missable 1, at-risk 9, unconfirmed 5 — computed live from the data files.

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

Open `app/index.html` in a desktop browser. No network requests: the app
loads only its own files and works with the network off.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
node cli/makefun.mjs check --kit <kit> --repo <this repo>
```

## Data

- `app/data/trophies.json` — the 55 official trophies with a guide in this
  entry's own words per trophy (nothing copied from another guide).
- `app/data/sources.json` — 15 numbered sources; sources 10–15 are cited
  second-hand through the page that quotes them, and the app says so.
- `app/data/disputes.json` — the 20 disputed claims, both versions + our call.
- `app/data/roadmap.json` — stages S1–S5 and the 100% checklist numbers.

Official names, descriptions and grades are shown as PlayStation publishes
them (via Exophase and Push Square, cross-checked against PowerPyx,
KeenGamer, GameMapa, CryptoGames and Insider Gaming).

## License

MIT — see [LICENSE](LICENSE).
