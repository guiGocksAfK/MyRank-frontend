# MyRank — Frontend

Web client for **MyRank**, a platform where you rate and rank the movies, TV
shows, games, books and anime you consume, unify everything into a single
ranking, compare with friends and unlock achievements.

This repository contains the **React single-page app**. The Spring Boot API lives
in [`guiGocksAfK/MyRank-backend`](https://github.com/guiGocksAfK/MyRank-backend).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Routes](#routes)
- [Project Structure](#project-structure)
- [Talking to the API](#talking-to-the-api)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Landing page** with a live poster grid (fed by the API's `/external/showcase`
  endpoint) that reveals from two diagonal fronts.
- **Auth** — e-mail/password, Google One Tap and Discord OAuth. JWT is stored in
  `localStorage` and attached to every request by an Axios interceptor.
- **Dashboard** with tabs:
  - **Overview** — real stats, recent activity, top works, badge progress.
  - **Rankings** — per-category tables and a unified cross-category ranking, with
    drag-to-reorder, filters and an optional time-weighted score.
  - **Creators** — ranking of directors / authors / studios derived from your works.
  - **Social** — friends & comparison (mock data for now).
  - **AI Insights** — consumption profile analysis.
  - **Profile** — editable bio, avatar upload with client-side crop/resize,
    highlights, category breakdown and the full achievements grid.
- **Achievements** — 48 badges fetched from the API, grouped by bucket, with a
  toast that pops when you unlock one.

## Tech Stack

| Concern     | Choice                                             |
| ----------- | ------------------------------------------------- |
| Framework   | React 19                                          |
| Build tool  | Vite 8 (`@vitejs/plugin-react`)                   |
| Routing     | React Router 7                                    |
| HTTP        | Axios (single instance + auth interceptor)        |
| OAuth       | `@react-oauth/google`, custom Discord flow        |
| Styling     | Hand-written CSS design system (`mr-*` classes, per-feature stylesheets) |

## Getting Started

### Prerequisites

- Node.js 20+
- The [backend API](https://github.com/guiGocksAfK/MyRank-backend) running on
  `http://localhost:8080`

### Install & run

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

The app starts on `http://localhost:5173` (the origin the backend's CORS config
expects).

### Production build

```bash
npm run build
npm run preview   # serve the built bundle locally
```

## Configuration

Environment variables are read at build time via `import.meta.env` and must be
prefixed with `VITE_`. Copy `.env.example` to `.env`:

| Variable                    | Description                                   |
| --------------------------- | ------------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID`     | Google OAuth client id. If unset, Google login is disabled (with a console warning). |
| `VITE_DISCORD_CLIENT_ID`    | Discord OAuth client id.                     |
| `VITE_DISCORD_REDIRECT_URI` | Discord OAuth redirect, e.g. `http://localhost:5173/auth/discord/callback`. |

> **Note:** the API base URL is currently hard-coded to
> `http://localhost:8080/api` in [`src/services/api.js`](src/services/api.js).
> Making it an env var (`VITE_API_URL`) is on the [roadmap](#roadmap).

## Available Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR    |
| `npm run build`   | Production build into `dist/`         |
| `npm run preview` | Preview the production build          |
| `npm run lint`    | Run ESLint over the project           |

## Routes

| Path                       | Screen                          |
| -------------------------- | ------------------------------ |
| `/`                        | Landing page                   |
| `/cadastrar`               | Register                       |
| `/entrar`                  | Login                          |
| `/auth/discord/callback`   | Discord OAuth callback handler |
| `/dashboard`               | Main app (tabbed)              |
| `/pro`                     | Pro plan page                  |
| `/insights`                | AI insights result            |

## Project Structure

```
src/
├── features/
│   ├── auth/        login, register, Discord callback
│   ├── home/        landing page, Pro page, dashboard Overview
│   ├── dashboard/   shell, header, footer, tab routing
│   ├── rankings/    category tables + unified ranking
│   ├── creators/    creator ranking
│   ├── social/      friends & comparison
│   ├── insights/    AI insights
│   └── profile/     profile, avatar upload, badges grid
├── services/        Axios instance + one module per API resource
├── shared/          cross-cutting React context & hooks
│   ├── userContext.jsx     current user, shared across tabs
│   ├── badges.jsx          badge fetch, unlock detection, toast
│   └── useUnifiedItems.js  works + derived stats
├── utils/           mappers (DTO ⇄ view model), formatters
├── data/            static fallback data
└── components/      shared presentational components
```

## Talking to the API

- [`src/services/api.js`](src/services/api.js) creates the shared Axios instance
  and injects `Authorization: Bearer <token>` from `localStorage` on every
  request.
- Each file in `src/services/` wraps one backend resource
  (`userService`, `WorkService`, `CategoryService`, `badgeService`, …).
- Backend DTOs are converted to view models in
  [`src/utils/mapWork`](src/utils/mapWork) so components never depend on the raw
  API shape.

## Roadmap

- [ ] Move the API base URL to `VITE_API_URL`
- [ ] Replace the mock Social tab with the real follow API
- [ ] Live achievement progress without a manual refresh
- [ ] TypeScript migration

## Contributing

This is a personal project, but issues and PRs are welcome.

1. `npm run lint` and `npm run build` should pass.
2. Follow the existing `mr-*` CSS conventions and the per-feature folder layout.
3. Keep API calls inside `src/services/`; keep DTO ⇄ view-model mapping in
   `src/utils/`.

## License

No license has been chosen yet — all rights reserved by the author until one is
added.
