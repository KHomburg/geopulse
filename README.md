# GeoPulse

GeoPulse is a hyperlocal social app built as a Turborepo workspace with an Express API and a React client. The product centers on a live map, a local feed, realtime direct messages, notifications, and karma-driven community features such as trusted spaces, lounge rooms, drops, and cosmetic perks.

## Workspace

- `apps/api`: Express + TypeScript + Sequelize API
- `apps/home`: React 19 + Vite + Mantine + Zustand client
- `e2e`: Playwright end-to-end coverage
- `documentation`: Product and implementation notes

## Core Product Surfaces

- Realtime messaging and notifications delivered over a single authenticated SSE stream
- Five-tab mobile shell: Map, Feed, Create, Messages, Profile
- Map discovery with post markers, activity heat trails, hotspots, friend ghost markers, and live lounge prompts
- Feed and map tag filtering for local vibes such as food, events, music, and outdoors
- Karma-backed perks including pin avatars, username colors, and Super Local Legend boosts
- Trusted Locals feed and room access once a user reaches the required karma threshold
- Geo-locked Drops that stay blurred until a user is within the unlock radius
- Ghost Mode for time-boxed, fuzzed location sharing with accepted friends only

## Setup

1. Install dependencies from the repo root.

```bash
npm install
```

2. Create the API environment file.

```bash
cp apps/api/.env.example apps/api/.env
```

3. Start PostgreSQL locally. One simple option is Docker.

```bash
docker run --name geopulse-postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=geopulse -d postgres
```

## Development

Run the full workspace:

```bash
npm run dev
```

Run individual apps when you only need one surface:

```bash
npm run dev -w apps/api
npm run dev -w apps/home
```

## Build

Build the full workspace:

```bash
npm run build
```

Build a single app:

```bash
npm run build -w apps/api
npm run build -w apps/home
```

## Implementation Notes

- Realtime delivery uses Server-Sent Events instead of polling for direct messages, typing indicators, unread counts, and notification pushes.
- Presence samples and activity aggregation drive live lounges and map heat trails.
- React Router v7 ships its own types; the client should not install `@types/react-router-dom`.

## Stack

- [Turborepo](https://turbo.build/repo)
- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Mantine](https://mantine.dev/)
- [MapLibre GL](https://maplibre.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript](https://www.typescriptlang.org/)
