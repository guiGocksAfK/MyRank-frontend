# MyRank — Web App

Rate and rank anything you love. MyRank is built around pop culture (movies,
series, games, books and anime), but a table can hold music, food, football
teams or school subjects just as well. Scores become tables, tables merge into
a single ranking, and your ranking becomes a profile of your taste.

Live at **[myrank-oficial.vercel.app](https://myrank-oficial.vercel.app/)**.
This repository contains the web app; the API, database and infrastructure live
in [MyRank-backend](https://github.com/guiGocksAfK/MyRank-backend).

## Features

- **Tables your way.** One table per category, per genre or mixed, with
  scores from 0 to 10 and drag-to-reorder.
- **Unified ranking** that merges any selection of tables into a single list,
  with an optional **time-weighted score** that rewards what you spent more
  time on.
- **Automatic metadata.** Directors, studios, authors and posters are fetched
  when a title is added; nothing is filled in by hand.
- **Creators ranking** of directors, authors and studios, derived from your
  own scores.
- **AI Insights**: a consumer profile generated from your scores, with a
  follow-up chat.
- **Optional social layer.** Profiles and tables can stay private. Open ones
  can be followed (private profiles use follow requests), compared through a
  **taste affinity** score and discussed in **takes** with threaded comments.
- **Chat** with direct messages, groups and invite links.
- **Achievements**: badges unlocked from what you consume, with a toast when
  one is earned.
- **Accounts** with e-mail and password (with e-mail confirmation), Google or
  Discord, plus account deletion.

## User experience

Most visitors arrive curious about a single thing, their taste, and many are
on a phone. A few decisions follow from that:

- **Show, don't explain.** The landing page uses product mini-mockups and a
  few one-time animations (a ranking re-sorting itself, an affinity chart
  drawing its wires, film-style end credits) instead of feature lists.
- **Three languages.** Portuguese, English and Spanish, switchable at any time
  from the navbar and saved to the account.
- **Motion with restraint.** Animations play once, and every one of them
  respects `prefers-reduced-motion`, falling back to the final state.
- **One visual base.** Tokens, scales, buttons, menus and panels live in
  `src/styles/base.css`, so every screen shares the same black-and-gold
  system instead of re-styling its own components.
- **Real data in examples.** Scores shown on the landing page are real public
  averages (MyAnimeList, IMDb, Metacritic), and the affinity example uses the
  same formula as the product.

## Hosting

Deployed on **Vercel**, with every push to `main` going live automatically.
The API runs on a separate Oracle Cloud VM; see the
[backend README](https://github.com/guiGocksAfK/MyRank-backend#architecture)
for the full architecture.

## Tech stack

| Technology | Purpose |
|---|---|
| React 19 | UI |
| Vite 8 | Dev server and production build |
| React Router 7 | Client-side routing |
| Axios | HTTP client with an auth interceptor |
| STOMP over SockJS | Real-time chat |
| `@react-oauth/google` | Google sign-in (Discord uses a custom OAuth flow) |
| Plain CSS | Shared design system in `src/styles/base.css` plus per-feature stylesheets |

The Geist font is self-hosted through `@fontsource-variable`, so the app makes
no requests to font CDNs.

## Security

- **Strict Content Security Policy** served as an HTTP header: scripts only
  from the app's own origin and Google sign-in, no `eval`, network access
  limited to the API and Google, and no plugins (`object-src 'none'`).
- **Hardened headers**: clickjacking protection (`frame-ancestors 'none'` and
  `X-Frame-Options: DENY`), `nosniff`, a strict referrer policy and a
  Permissions-Policy that disables camera, microphone, geolocation and
  payments.
- **Token sent only to the API.** The session token is attached by the API's
  own Axios instance, never to other URLs.
- **Fonts and scripts served locally**, keeping third-party origins to the
  minimum the CSP allows.

Authorization is always enforced by the API; route checks on the frontend only
shape the navigation.

## Running locally

Requirements: Node.js 20+, and the
[backend](https://github.com/guiGocksAfK/MyRank-backend) running on
`http://localhost:8080`.

```bash
npm install
cp .env.example .env    # then fill in the values
npm run dev             # http://localhost:5173
```

The app must run on `http://localhost:5173`, the origin the backend's CORS
configuration expects.

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint over the project. |

### Environment variables

Read at build time and prefixed with `VITE_`:

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Defaults to `http://localhost:8080/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id. Google sign-in is disabled if empty. |
| `VITE_DISCORD_CLIENT_ID` | Discord OAuth client id. |
| `VITE_DISCORD_REDIRECT_URI` | Discord redirect, e.g. `http://localhost:5173/auth/discord/callback`. |

Changing the production API domain also requires updating `connect-src` in the
CSP in `vercel.json`.

## Project structure

```
src/
├── features/
│   ├── home/        landing page sections
│   ├── auth/        login, register, e-mail confirmation, Discord callback
│   ├── dashboard/   authenticated shell and tabs
│   ├── rankings/    category tables and the unified ranking
│   ├── creators/    creators ranking
│   ├── insights/    AI Insights
│   ├── social/      feed, discover, compare, takes and profiles
│   ├── chat/        direct messages, groups and invites
│   └── profile/     profile, avatar and achievements
├── services/        Axios instance and one module per API resource
├── shared/          contexts (user, works, chat, notifications), i18n, shared components
├── styles/          base.css: tokens, scales and reusable pieces
└── utils/           formatters and DTO to view-model mappers
```
