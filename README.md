# Frontierer

A flight route explorer for Frontier Airlines — find every possible itinerary between any two cities, including multi-stop paths, with an interactive dark-mode map.

![Black noir UI with split map/results layout](https://placehold.co/1200x600/0a0a0a/00853e?text=Frontierer)

## Features

- **Multi-city search** — select multiple departure and/or arrival cities at once
- **Unlimited layovers** — slider from 1 stop up to unlimited to control path depth
- **Graph pathfinding** — BFS over 854 direct routes across 96 Frontier cities
- **Interactive map** — Leaflet split-view with dark-inverted OSM tiles; click any route row to highlight it on the map
- **Distance sorting** — all route options sorted by total great-circle distance (miles)
- **Booking links** — one-click deep-link to Frontier's booking flow for each city pair
- **Past searches** — last 5 searches stored in localStorage and restored on revisit
- **Location-aware suggestions** — browser geolocation used to surface nearby airports first
- **Black noir dark theme** — shadcn/ui components on a near-black (`#0a0a0a`) surface with Frontier green (`#00853e`) as the sole accent

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI components | shadcn/ui (Radix primitives + Tailwind) |
| Styling | Tailwind CSS v3, CSS custom properties |
| Map | Leaflet + react dynamic import (SSR-disabled) |
| Language | TypeScript |
| Data | Static JSON — 854 Frontier route pairs |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx          # Home — search form + past searches
  search/page.tsx   # Results — split map + route cards
  CityInput.tsx     # Multi-select city autocomplete
  MapView.tsx       # Leaflet map (dynamically imported)
  globals.css       # Noir CSS variables + Leaflet dark overrides
  layout.tsx        # Root layout with dark class

lib/
  pathfinder.ts     # BFS graph pathfinding over route adjacency list
  frontier.ts       # cityToIata map, MONTHS, Frontier booking URL builder
  coords.ts         # City lat/lon coordinates + haversine distance

data/
  routes.json       # 854 direct Frontier city-pair routes

components/ui/      # shadcn/ui components (Button, Card, Slider, etc.)
```

## How Pathfinding Works

`buildAdjacency` converts the flat route list into a bidirectional adjacency map. `findPaths` runs a BFS capped at `maxLayovers` intermediate stops, deduplicating paths by their stop sequence. Results are grouped by origin→destination pair, then further bucketed by layover count and sorted by total distance.

## Data

Route data is sourced from Frontier's published network and stored as static JSON. The dataset covers 96 cities and 854 direct city pairs. City coordinates (`lib/coords.ts`) are used for distance calculations and map rendering only — they do not affect route availability.
