# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Developer Job Hunt CRM** (程序员求职作战台) — a local-first, browser-based MVP for Chinese software developers to track job applications, analyze JDs, manage resume versions, record interviews, and review funnel analytics. No backend, no login, no cloud sync. All data lives in IndexedDB.

All user-facing copy is in simplified Chinese. All markdown docs are in Chinese.

## Commands

```bash
npm run dev -- --host 127.0.0.1   # Start dev server at http://127.0.0.1:5173
npm run build                       # Type-check (tsc) then Vite production build
npm run preview                     # Preview production build locally
```

No test runner, linter, or formatter is configured.

## Architecture

**Stack:** React 19 + TypeScript (strict) + Vite 6. ESM throughout. No path aliases — all imports are relative.

**Three-layer separation (partially realized):**

- **UI Layer** — Currently a single `src/app/App.tsx` (~1400 lines) containing all components, page routing, and state. Routing is manual via `useState<Page>` with 6 page values (`dashboard | applications | resumes | interviews | analytics | settings`). No react-router.
- **Feature Layer** — `src/features/*/` each contain `types.ts`, `repositories/`, and `services/`. Features: `applications`, `resumes`, `jd-analysis`, `resume-match`, `interviews`, `analytics`, `data-portability`.
- **Shared Layer** — `src/shared/storage/indexedDb.ts` is a generic IndexedDB wrapper (open, getAll, put, delete, clear). Single connection cached as a promise.

**Key patterns:**
- **Repository pattern**: Each data feature has a repository wrapping IndexedDB CRUD via the shared wrapper.
- **Service pattern**: Business logic (ID generation via `crypto.randomUUID()`, timestamps, orchestration) lives in `services/`.
- **Type-first**: Each feature has a `types.ts` with domain types, input types, and label/status maps.
- **Synchronous analysis**: JD analysis (`keyword-rules.ts`, 47 rules) and resume matching are pure synchronous functions — no async.
- **State refresh pattern**: Root `App` component fetches all data from IndexedDB on mount via `refresh()`. Every mutation calls `refresh()` to re-read.

**IndexedDB schema:**
- Database: `developer-job-hunt-crm`, version 3
- Stores: `applications` (indexes: status, appliedAt, updatedAt), `resumes` (indexes: targetRole, updatedAt), `interviews` (indexes: jobApplicationId, scheduledAt, updatedAt)

**Styling:** Single global CSS file `src/styles.css` (~620 lines). CSS custom properties on `:root`. Dark sidebar (`#111827`), light main area (`#f5f7fb`), teal accent (`#0f766e`/`#14b8a6`). Responsive breakpoint at 980px collapses sidebar to horizontal nav.

## Phase 1 Boundaries

Follow the scope defined in `development-slices.md` (slices 1–5 complete, 7 partially complete, 6 not started). Do NOT introduce:

- Backend services, login, authentication, or cloud sync
- Multi-user collaboration or enterprise ATS features
- Browser extensions, scraping, or mobile apps
- Payment systems

AI features must remain optional and behind a provider abstraction (`RuleBasedProvider` is the only current implementation; `OpenAICompatibleProvider` and `OllamaProvider` are reserved for later).

## Design Documents

Key specs live in repo root (all Chinese):

- `mvp-requirements.md` — Full MVP requirements
- `architecture.md` — Phase 1 technical architecture
- `data-model.md` — Core domain type definitions
- `development-slices.md` — 7 development slices with acceptance criteria
- `agents.md` — AI agent development guide (bilingual)
- `screens.md` — Page and interaction checklist

Keep implementation aligned with these documents. Before adding new scope, verify it serves the core loop: **record job → analyze JD → connect resume → track interview → review data**.
