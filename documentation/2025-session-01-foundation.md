# GeoPulse — Session 01: Foundation

## Overview

This session built the complete GeoPulse application from scratch — a location-centric social PWA (Instagram × Jodel hybrid) where users share anonymous or pseudonymous "pulses" tied to their physical location.

---

## Backend (`apps/api`)

### Tech Stack
- Node.js + Express 4 + TypeScript 4.9
- Sequelize 6 ORM (SQLite for dev/test, PostgreSQL for prod)
- Zod 3 for request validation
- Jest 29 + Supertest for testing

### Architecture
Layered domain-driven design:
```
routes → controller → service → repository → database
```
No cross-layer imports. Services never import other services. Controllers never import other controllers.

### API Base: `/api/v1`

### Modules Built

#### User (enhanced)
- Added fields: `username`, `displayName`, `avatarUrl`, `karmaScore` (default 0), `isTrusted` (default false)

#### Post
| File | Purpose |
|------|---------|
| `post.model.ts` | Sequelize model with `anonymityMode` ENUM (public/local_legend/anonymous), `obfuscatedLat/Lng`, `karmaScore`, `isStory`, soft-delete |
| `post.utils.ts` | Privacy pipeline: `snapToGrid` (100m), `addRandomOffset` (10–50m), `obfuscateCoordinates`; also `haversineDistanceMeters`, `resolveAuthorDisplay` |
| `post.repository.ts` | Single-purpose DB queries: create, findById, findByLocation (bbox+time), incrementKarma, softDelete, deactivateExpiredStories |
| `post.service.ts` | Business logic: createPost, getFeed, deletePost; engagement-weighted DBSCAN for `getHotspots` (ε=300m, minWeight=2) |
| `post.controller.ts` | Express handlers with `sanitizePost` that strips author identity per anonymity mode |
| `post.routes.ts` | `GET /api/v1/posts`, `GET /api/v1/posts/hotspots`, `GET /api/v1/posts/:id`, `POST /api/v1/posts` (auth), `DELETE /api/v1/posts/:id` (auth) |
| `post.schemas.ts` | Zod schemas: CreatePostSchema, GetPostsQuerySchema, PostIdParamSchema, GetHotspotsQuerySchema |

#### Vote
| File | Purpose |
|------|---------|
| `vote.model.ts` | Vote model with `value` ∈ {1, -1}, unique index on `[userId, postId]` |
| `vote.repository.ts` | findByUserAndPost, create, update, deleteByUserAndPost, countForPost |
| `vote.service.ts` | `castVote` handles create/update/unchanged with karma delta propagation to post; returns status + new karmaScore |
| `vote.controller.ts` | castVote, removeVote, getMyVote handlers |
| `vote.routes.ts` | `POST /api/v1/posts/:postId/votes`, `DELETE /api/v1/posts/:postId/votes`, `GET /api/v1/posts/:postId/votes/me` (all auth-required) |

#### Shared Infrastructure
- `asyncHandler.ts` — wraps async route handlers to forward thrown errors to Express `next(err)`
- `error.middleware.ts` — handles ZodError (400 + flattened errors), generic errors
- `models.associations.ts` — User→Post, Post→Vote, User→Vote associations

### Privacy Design
Raw GPS coordinates are **never stored**. Before persistence:
1. Snap to 100m grid: `floor(lat / 0.0009) * 0.0009`
2. Add random 10–50m offset in random direction

This prevents precise location tracking while keeping posts accurate to ~150m.

### Hotspot Clustering
Engagement-weighted DBSCAN implemented in pure TypeScript (`post.service.ts`):
- Epsilon: 300 meters
- Min weight: 2 (weighted by karma + vote count)
- Returns cluster centroids with post count and total weight

### Test Coverage
7 test suites, 53 tests — all passing:

| Suite | Tests |
|-------|-------|
| `post.utils.test.ts` | 8 — grid snap, offset, obfuscate, haversine, author display |
| `post.repository.test.ts` | 5 — CRUD operations |
| `post.routes.test.ts` | 12 — full integration (create, read, feed, delete, hotspots) |
| `vote.routes.test.ts` | 8 — cast, switch, remove, auth enforcement |
| `user.repository.test.ts` | 5 — user CRUD |
| `user.routes.test.ts` | 8 — user API |
| `auth.routes.test.ts` | 7 — register, login, refresh, logout |

---

## Frontend (`apps/home`)

### Tech Stack
- React 18 + TypeScript 5 + Vite 4
- Mantine 9 (dark theme, violet primary)
- Zustand for state management
- React Router DOM v6
- Mapbox GL JS
- Axios with JWT interceptor + auto-refresh
- vite-plugin-pwa (PWA manifest, service worker)

### Design System
- Dark background: `#0a0a0a`
- Surface: `#141414`, `#1e1e1e`
- Accent: `#6c63ff` (violet)
- Text: `#f0f0f0`
- Danger: `#ff4757`

### State Management

#### `auth.store.ts` (Zustand)
- `login(email, password)` — calls API, stores JWT + userId in localStorage
- `register(email, password)` — registers + auto-logs in
- `logout()` — clears state + localStorage
- Rehydrates from localStorage on page load

#### `feed.store.ts` (Zustand)
- `posts[]`, `hotspots[]`, `location`, `filter`, `radiusKm`, `isLoadingFeed`, `hasMore`
- `loadFeed(reset?)` — paginated feed loading with bbox from current location
- `loadHotspots()` — fetches DBSCAN cluster data
- `votePost(id, value)` — optimistic vote with karma update
- `addPost`, `removePost` for local state updates

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `MapPage` | `/map` | Mapbox GL map with post clusters (GeoJSON), heatmap overlay for hotspots, time filter, user location marker |
| `FeedPage` | `/feed` | Infinite-scroll feed with PostCard, voting buttons, anonymity-aware author display, story badges |
| `CreatePostPage` | `/post/new` | Anonymity mode selector (SegmentedControl), pseudonym input, content textarea, 24h story toggle, location status |
| `ProfilePage` | `/profile` | Auth-gated; shows email + userId, logout, settings placeholders |
| `LoginPage` | `/login` | Email/password form, gradient submit button |
| `RegisterPage` | `/register` | Registration with password strength indicator |

### Routing (`App.tsx`)
```
/login           → LoginPage (no layout)
/register        → RegisterPage (no layout)
/map             → MapPage (AppLayout)
/feed            → FeedPage (AppLayout)
/post/new        → CreatePostPage (AppLayout, auth-gated)
/profile         → ProfilePage (AppLayout)
*                → redirect to /map
```

### PWA
- `vite-plugin-pwa` with `standalone` display mode
- App name: "GeoPulse", short name: "Pulse"
- Theme color: `#0a0a0a`, background: `#0a0a0a`
- Apple mobile web app meta tags in `index.html`

---

## Environment Variables

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PORT=8080
```

### Frontend (`apps/home/.env`)
```
VITE_API_URL=http://localhost:8080
VITE_MAPBOX_TOKEN=pk.eyJ1...  # Get from mapbox.com
```

---

## Key Technical Decisions

1. **No raw GPS storage** — Obfuscated coordinates protect user privacy while maintaining local relevance.
2. **Anonymous posting by default** — Three modes: public (userId visible to owner), local_legend (pseudonym), anonymous.
3. **Soft deletes on posts** — `paranoid: true` in Sequelize; deleted posts not returned in feed but preserved for analytics.
4. **asyncHandler pattern** — Express 4 doesn't catch async errors natively; all route handlers wrapped.
5. **DBSCAN over k-means** — Better for geographic clustering; doesn't require pre-specifying k; handles noise.
6. **Mantine v9** — Uses `style` prop instead of `sx`, `gap` instead of `spacing`, `justify` instead of `position`, `c` instead of `color`, `fw` instead of `weight`.
