# Trend Hunter — Automated AI Storefront

> Type a trend. Claude writes the campaign. Sanity publishes it. One shot.

Trend Hunter is a full-stack, AI-powered storefront built as a hackathon project. It lets you turn any product trend into a fully-published e-commerce campaign page in seconds — no manual content entry required. The user types a trend idea, Claude (Anthropic's AI) generates structured product copy, and the app automatically writes the campaign to Sanity CMS and renders a live product page.

---

## What We Built

### The Core Idea

The app solves a real problem for dropshippers, trend-chasers, and rapid-launch teams: going from "I saw this trending on TikTok" to a live product page with copy, pricing, and a URL takes hours manually. Trend Hunter collapses that to under 10 seconds.

**The flow:**

```
User types trend → POST /api/generate → Claude Haiku writes JSON →
Sanity writeClient saves document → Live product page renders at /campaign/[slug]
```

### Key Features

- **AI Campaign Generation** — Claude Haiku generates a complete product campaign (title, slug, headline, price, 5-paragraph Portable Text body) from a single trend keyword
- **Instant Publishing** — The generated document is written directly to Sanity CMS via a write-token API route; no Studio interaction needed
- **Live Content** — Uses Sanity's Live Content API (`SanityLive`) so new campaigns appear on the home page in real time without a page reload
- **Campaign Detail Pages** — Each campaign gets a full product page at `/campaign/[slug]` with a hero image, Portable Text body, metadata sidebar, and CTA buttons
- **Dark / Light Mode** — Full theme support via CSS custom properties, persisted in `localStorage`, with a flash-free inline script that applies the saved theme before first paint
- **Tactical Aesthetic** — Custom Bebas Neue + IBM Plex Mono font pairing with a red/dark intelligence-ops visual theme throughout

---

## Architecture

The project is a **pnpm Turborepo monorepo** with three apps and one shared package:

```
hackathon-amd/
├── apps/
│   ├── web/           → Next.js 15 frontend (React 19, Tailwind CSS v4)
│   ├── studio/        → Sanity Studio v5 (content editing UI)
│   └── sanity-app/    → Sanity App SDK (dashboard-embedded app)
├── packages/
│   └── typescript-config/  → Shared tsconfig (base, nextjs, sanity presets)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### App: `web` (Next.js — port 3000)

The main user-facing application. It handles both the campaign generation UI and the public storefront.

```
apps/web/src/
├── app/
│   ├── layout.tsx              → Root layout: fonts, ThemeToggle, SanityLive
│   ├── globals.css             → CSS variables (light/dark), base styles, keyframes
│   ├── page.tsx                → Home page: CommandCenterForm + campaign grid
│   ├── ThemeToggle.tsx         → Client component: dark/light toggle button
│   ├── CommandCenterForm.tsx   → Client component: trend input + generation UI + result card
│   └── campaign/
│       └── [slug]/
│           └── page.tsx        → Campaign detail page (server component)
├── api/
│   └── generate/
│       └── route.ts            → POST endpoint: calls Claude → writes to Sanity
└── sanity/
    └── lib/
        ├── client.ts           → Read-only Sanity client (CDN)
        ├── live.ts             → SanityLive setup for real-time content
        └── writeClient.ts      → Write-enabled Sanity client (server-only)
```

### App: `studio` (Sanity Studio — port 3333)

The Sanity content management interface for manually editing campaigns. The `campaign` schema is defined here.

```
apps/studio/
├── sanity.config.ts    → Studio config (projectId, dataset, plugins)
├── schemas/
│   └── campaign.ts     → Campaign document type definition
└── schemaTypes/
    └── index.ts        → Registers all schema types
```

### App: `sanity-app` (Sanity App SDK — port 3334)

A Sanity Dashboard-embedded app built with `@sanity/sdk-react`. Deployable directly into the Sanity Studio dashboard as a custom panel. Currently a starter that can be extended with custom analytics or tooling.

---

## Content Schema

### Campaign Document (`_type: "campaign"`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Product/campaign name (2–6 words) |
| `slug` | `slug` | Yes | URL-safe identifier, auto-generated from title |
| `headline` | `string` | Yes | Marketing tagline (8–15 words) |
| `heroImage` | `image` | No | Hero image with hotspot + alt text |
| `content` | `array<block>` | No | Portable Text body copy |
| `price` | `number` | Yes | USD price (e.g. 49.99) |

The AI generation endpoint produces exactly 5 Portable Text blocks following a structured copywriting formula: **problem → features → benefit → social proof → CTA**.

---

## How the AI Generation Works

### Endpoint: `POST /api/generate`

**Request:**
```json
{ "topic": "viral Stanley cup phone holder" }
```

**What happens inside:**

1. **Input validation** — rejects missing or non-string `topic`
2. **Claude Haiku call** — sends a tightly-constrained prompt to `claude-haiku-4-5` (the most cost-efficient Claude model at $1/1M input tokens). The system prompt instructs Claude to output **only raw JSON** — no markdown fences, no explanation
3. **JSON parsing + schema validation** — strips any accidental markdown fences, parses JSON, validates that all required fields are present and the right types
4. **Key injection** — Claude cannot generate globally unique IDs, so `_key` values are injected server-side into every Portable Text block and span before writing to Sanity
5. **Sanity write** — calls `writeClient.create(campaign)` using a server-only write token
6. **Response** — returns the created Sanity document (including `_id`) with HTTP 201

**Response:**
```json
{
  "_id": "abc123",
  "_type": "campaign",
  "title": "StanPhone Pro",
  "slug": { "current": "stanphone-pro" },
  "headline": "Your Stanley cup finally meets your iPhone in perfect harmony",
  "price": 34.99,
  "content": [...]
}
```

**Error handling:**
- `400` — missing/invalid topic
- `401` — bad Anthropic API key
- `429` — Claude rate limit hit
- `502` — Claude returned invalid JSON, or Sanity write failed

### The Prompt Strategy

The prompt is deterministic and schema-anchored. It provides Claude with the exact JSON structure to fill in, explicit word counts, and hard rules (no `_key` fields, `price` must be a number not a string, exactly 5 blocks). This keeps outputs consistent and parseable.

---

## The Frontend

### Home Page (`/`)

Two sections:

**1. Command Center** (`CommandCenterForm.tsx` — client component)
- Text input for the trend topic
- GENERATE button that calls `/api/generate`
- Animated mission log showing 3 steps: Scoping Trend → Claude Brainstorming → Publishing to Sanity
- Each step has a status badge: STANDBY → PROCESSING → COMPLETE / FAILED
- On success: shows a ResultCard with the campaign title, headline, price, slug, Sanity ID, and links to the Studio and the live campaign page
- Input clears automatically after a successful generation

**2. Active Deployments** (server-rendered, live-updating)
- Grid of all published campaigns fetched via GROQ query
- Each card shows hero image (or a letter placeholder), title, headline, price badge, sequence number
- Cards link to `/campaign/[slug]`
- Disappears if no campaigns exist yet

### Campaign Detail Page (`/campaign/[slug]`)

A server component that fetches the campaign by slug and renders:

- **Hero section** — full-bleed image (or fallback grid pattern) with dark overlay, campaign title in large Bebas Neue type (always white over overlay), headline subtitle, price badge
- **Navigation bar** — back link, deploy date, CLASSIFIED badge (overlaid on hero)
- **Body** — two-column layout:
  - Left: Portable Text content rendered with `<PortableText>` from `next-sanity`
  - Right: sticky metadata sidebar (price, route, deploy date, doc ID, ACQUIRE TARGET CTA button)
- **Full-width CTA banner** — repeated acquisition button at page bottom
- **Sticky Next Mission banner** — floating link to the previous chronological campaign, with smooth entrance animation

### Theme System

The design uses CSS custom properties for complete theme awareness:

```css
:root {
  --bg, --surface, --border, --text, --muted, --red, --green
  --toggle-bg, --toggle-border, --toggle-text, --toggle-shadow
}

html[data-theme="dark"] {
  /* all vars overridden for dark mode */
}
```

**Flash prevention:** An inline `<script>` in `<head>` runs synchronously before React hydrates, reading `localStorage` and applying `data-theme="dark"` immediately if the user's preference is dark. This prevents the white flash that normally happens with client-side theme reads.

**Persistence:** `ThemeToggle.tsx` writes to `localStorage` on every toggle. The toggle button is fixed top-right and shows a sun/moon icon.

### Typography

| Role | Font | Variable |
|---|---|---|
| Display / Headlines | Bebas Neue (Google Fonts) | `--font-display` |
| Body / Mono / Labels | IBM Plex Mono (Google Fonts) | `--font-mono` |

Both fonts are loaded via `next/font/google` with `display: swap` and exposed as CSS variables.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4 (CSS-first config) + inline JSX styles |
| CMS | Sanity v5 (Sanity Studio + Content Lake) |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Monorepo | Turborepo + pnpm workspaces |
| TypeScript | Strict mode with `noUncheckedIndexedAccess` |
| Fonts | Bebas Neue + IBM Plex Mono via `next/font/google` |
| Real-time | Sanity Live Content API (`@sanity/client/stega`) |
| Image CDN | Sanity Image CDN via `@sanity/image-url` |

---

## Environment Variables

Create `apps/web/.env.local` (copy from `apps/web/.env.example`):

```env
# Sanity project (required)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production

# Sanity tokens
SANITY_API_READ_TOKEN=           # Optional — enables live draft previews
SANITY_API_WRITE_TOKEN=          # Required — campaign creation via API route

# Anthropic (required for AI generation)
ANTHROPIC_API_KEY=sk-ant-...
```

**Where to get these:**
- `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET` — from [sanity.io/manage](https://sanity.io/manage)
- `SANITY_API_WRITE_TOKEN` — Sanity project → API → Tokens → Add API token (Editor role)
- `SANITY_API_READ_TOKEN` — Sanity project → API → Tokens → Add API token (Viewer role)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

---

## Getting Started

### Prerequisites

- Node.js >= 20.9
- pnpm 9.15.4 (`npm i -g pnpm@9.15.4`)

### Installation

```bash
git clone <repo>
cd hackathon-amd
pnpm install
```

### Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your keys
```

### Run all three apps concurrently

```bash
pnpm dev
```

This starts:
- `http://localhost:3000` — Next.js web app
- `http://localhost:3333` — Sanity Studio
- `http://localhost:3334` — Sanity App SDK

### Run a single app

```bash
pnpm --filter @repo/web dev       # Web only
pnpm --filter @repo/studio dev    # Studio only
```

### Other commands

```bash
pnpm build        # Build all apps
pnpm typecheck    # TypeScript check all apps
pnpm format       # Prettier format everything
```

---

## Development Decisions & Notes

### Why Claude Haiku?
At $1/1M input tokens, Haiku is the most cost-effective Claude model. For this use case (structured JSON generation from a short prompt), Haiku's quality is indistinguishable from Sonnet at a fraction of the cost.

### Why Portable Text?
Sanity's Portable Text is a structured content format that stores rich text as a JSON array of block objects. This allows the content to be rendered in any medium (web, mobile, email) without being tied to HTML. The AI generates the content in this format directly.

### Why no `_key` from Claude?
Sanity requires globally unique `_key` values within arrays. Since Claude cannot guarantee uniqueness across requests, `_key` generation is excluded from the prompt and injected server-side using `Date.now()` + positional indices.

### Dark Mode without Flash
Most dark mode implementations read `localStorage` in a `useEffect`, which runs after React hydrates — causing a white flash on reload. The solution used here is an inline synchronous `<script>` tag in `<head>` that runs before any React code, setting `data-theme="dark"` immediately if needed.

### Live Content API
`SanityLive` from `next-sanity` subscribes to Sanity's Content Lake over a persistent connection. When a new campaign is published (either via AI generation or manually in Studio), the home page campaign grid updates in real time without a browser refresh.

---

## File Reference

| File | Purpose |
|---|---|
| `apps/web/src/app/page.tsx` | Home page — campaign grid + command center |
| `apps/web/src/app/CommandCenterForm.tsx` | AI generation form with step log and result card |
| `apps/web/src/app/ThemeToggle.tsx` | Dark/light mode toggle button |
| `apps/web/src/app/globals.css` | CSS variables, base styles, keyframe animations |
| `apps/web/src/app/layout.tsx` | Root layout with fonts, theme script, SanityLive |
| `apps/web/src/app/campaign/[slug]/page.tsx` | Campaign detail page (server component) |
| `apps/web/src/app/api/generate/route.ts` | POST endpoint — Claude call + Sanity write |
| `apps/web/src/sanity/lib/client.ts` | Read-only Sanity client |
| `apps/web/src/sanity/lib/writeClient.ts` | Write-enabled Sanity client (server-only) |
| `apps/web/src/sanity/lib/live.ts` | Sanity Live Content API setup |
| `apps/studio/schemas/campaign.ts` | Campaign document schema definition |
| `apps/studio/sanity.config.ts` | Sanity Studio configuration |
