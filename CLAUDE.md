# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Commands

```bash
# All apps in parallel (Turbo)
pnpm dev
pnpm build
pnpm lint
pnpm test

# Individual apps
pnpm --filter @cold-monitor/api dev        # Fastify API (port 3333)
pnpm --filter web dev                      # Next.js web (port 3000)
pnpm dev:collector                         # Electron collector (Vite + Electron)
pnpm dist:collector                        # Build Windows installer

# API database
pnpm --filter @cold-monitor/api db:migrate     # Create/run migrations (dev)
pnpm --filter @cold-monitor/api db:migrate:deploy  # Apply migrations (prod)
pnpm --filter @cold-monitor/api db:studio     # Prisma Studio UI
pnpm --filter @cold-monitor/api db:seed       # Seed database

# Run individual test files
pnpm --filter @cold-monitor/api test
pnpm --filter web test
pnpm --filter @cold-monitor/collector test
```

All apps load environment variables from the root `.env` file via `dotenv-cli` (`pnpm env:load` prefix in scripts).

# Architecture

## Overview

Three-app pnpm/Turbo monorepo monitoring industrial refrigeration equipment (Sitrad protocol):

* **`apps/api`** — Fastify 5 + Prisma + PostgreSQL. Handles REST + WebSocket. Swagger docs at `/docs`.
* **`apps/web`** — Next.js 16 App Router. Dashboard for real-time instrument readings and alerts.
* **`apps/collector`** — Electron desktop app (Windows). Polls Sitrad HTTP API, pushes readings to the API via WebSocket.

Shared:

* **`packages/auth`** — CASL-based authorization. `defineAbilityFor(user)` builds an `AppAbility` from role. Roles: `ADMIN`, `EDITOR`, `OPERATOR`, `VIEWER`.
* **`packages/env`** — Validated env schema via `@t3-oss/env-nextjs`. Single source of truth for all env vars.
* **`config/`** — Shared ESLint, Prettier, and TypeScript configs.

# Project Structure & Module Organization

Applications live in `apps/`:

* `apps/api`: Fastify API, Prisma schema and migrations in `prisma/`, source in `src/`.
* `apps/web`: Next.js app, routes in `src/app`, UI in `src/components`, clients in `src/http`, hooks/stores in `src/hooks` and `src/stores`.
* `apps/collector`: Electron/Vite collector app, renderer code in `src`, Electron entry points in `electron`, static files in `public`.

Shared packages live in `packages/`, including `auth` and `env`.

Shared ESLint, Prettier, and TypeScript config lives in `config/`.

# Data Flow

```text
Sitrad API (industrial hardware)
        ↓ HTTP polling
  Electron Collector
        ↓ WebSocket /ws/agent  (AUTH → INSTRUMENT_CREATE / INSTRUMENT_READING)
    Fastify API
        ├─ Persists readings → PostgreSQL (instrument_data)
        ├─ Evaluates alert levels (normal / warning / critical)
        ├─ Sends email alerts via Resend
        └─ Broadcasts → WebSocket /ws/dashboard
                ↓
          Next.js Web (real-time gauges, history, alerts)
```

# WebSocket Protocol

## `/ws/agent`

Collector authenticates with a device token then sends:

* `INSTRUMENT_CREATE` — register new instruments found in Sitrad
* `INSTRUMENT_READING` — push live readings; triggers alert evaluation and dashboard broadcast

## `/ws/dashboard`

Web clients connect with a user JWT; receive:

* `INSTRUMENT_VALUES`, `INSTRUMENT_UPDATE` — live readings
* `ALERT_NOTIFICATION` — threshold breach events

In-memory maps (`agentConnectionByOrg`, `dashboardConnectionsByOrg`) track active connections per organization.

# Collector Authentication Flow

The collector uses a two-stage token model:

1. **Setup token** — a one-time token generated in the web app (`/org/[slug]/download`). The collector sends it on first connect to exchange for a permanent device token.
2. **Device token** — a JWT stored in `electron-store` that encodes `sub` (userId) and `organizationId`. Used for all subsequent WebSocket connections.

`CollectorDevice` row must have a `stopPassword` set; missing it causes `AUTH_ERROR` and disconnects the agent.

# API Route Organization

Routes in `apps/api/src/http/routes/` are grouped by domain:

* `auth/`
* `orgs/`
* `instruments/`
* `members/`
* `invites/`
* `notifications/`
* `devices/`
* `data/`
* `audit-logs/`
* `ws/`

Each file exports a single Fastify plugin function.

# Web App

* HTTP client: `ky` via `apps/web/src/http/api.ts`.
* Reads JWT from `token` cookie.
* State management with Zustand and React Query.
* UI with Shadcn UI + Radix UI + Tailwind CSS v4 + lucide-react.

# Database

Prisma schema at `apps/api/prisma/schema.prisma`.

Key models and constraints:

* `Instrument` — `idSitrad` links to Sitrad device ID; `slug` unique per org.
* `InstrumentData` — indexed by `(instrumentId, createdAt)` for time-series queries.
* `JoinInstrument` — unique pair enforcement.
* `AlertReadLog` — deduplicates acknowledgments.
* `CollectorDevice` — setup token lifecycle.

# Environment Variables

All loaded from root `.env`.

| Variable                        | Used by      |
| ------------------------------- | ------------ |
| `DATABASE_URL`                  | API (Prisma) |
| `JWT_SECRET`                    | API          |
| `PORT`                          | API          |
| `TIMEZONE`                      | API          |
| `GOOGLE_OAUTH_CLIENT_ID/SECRET` | API          |
| `EMAIL_API_KEY`                 | API (Resend) |
| `NEXT_PUBLIC_API_URL`           | Web + API    |
| `NEXT_PUBLIC_APP_URL`           | Web + API    |

The collector reads `COLLECTOR_API_BASE_URL` and `COLLECTOR_WS_URL` from a `.env` next to the executable.

# Build, Test, and Development Commands

Use pnpm from the repository root.

* `pnpm dev`: run development tasks through Turbo.
* `pnpm build`: build packages/apps.
* `pnpm lint`: run configured lint tasks.
* `pnpm test`: run tests.
* `pnpm dev:collector`: start only the Electron collector app.
* `pnpm dist:collector`: build the Windows collector.
* `pnpm --filter @cold-monitor/api dev`: start the API with `.env` loaded.
* `pnpm --filter web dev`: start the Next.js app.
* `pnpm --filter @cold-monitor/api db:migrate`: run Prisma migrations.

After changes, always suggest running:

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```

# Coding Style & Naming Conventions

Write strongly typed TypeScript and avoid `any`.

Always follow:

* Small functions.
* Explicit names.
* Clear responsibilities.
* Reusable components.
* SOLID whenever possible.
* Avoid duplicated code.
* Production-ready code.
* Maintain performance.

Prettier uses:

* 2 spaces
* 80 columns
* semicolons
* single quotes
* Tailwind class sorting

ESLint extends `config/eslint-config` and enforces sorted imports.

Use kebab-case for route and utility files.

Use PascalCase for React component exports.

Prefer:

* Shadcn UI
* Radix UI
* Tailwind CSS variables
* Consistent spacing and layout patterns
* Primary color patterns based on blue
* lucide-react icons

# Front-end Standards

## Forms

All forms should use:

* React Hook Form
* Zod validation
* Friendly error messages
* Loading state
* Success state
* Error state
* Disabled submit button while submitting
* Input sanitization
* Automatic trim
* XSS-safe inputs
* Accessibility best practices

When editing forms, always include:

* Zod schema
* Sanitization
* Error messages
* Accessibility

## UI Components

Prefer reusable components and shared UI patterns.

Maintain consistency for:

* spacing
* padding
* colors
* alerts
* buttons
* validation states

# Back-end Standards

## APIs / Server Actions

Always:

* Validate payloads with Zod
* Validate authentication on backend routes
* Validate authentication on server actions
* Sanitize inputs
* Handle errors properly
* Return correct HTTP status codes
* Use clear logs
* Never expose stack traces

## Protected Routes Must Be Tested For

* no token
* invalid token
* unauthorized role
* authorized role

# Database Standards

Use Prisma whenever possible.

Always validate:

* indexes
* pagination for heavy queries
* necessary includes only
* avoid N+1 queries

Protect against:

* SQL Injection
* Mass Assignment
* Invalid data
* Heavy unpaginated queries

# Testing Guidelines

Project rules require tests for every new or changed feature.

## Unit Tests

Use Jest for:

* utils
* services
* validations
* business rules

## Front-end Tests

Use:

* Jest
* React Testing Library

Cover:

* rendering
* user interaction
* forms
* submit flows
* loading states
* error states

## E2E Tests

Use Playwright.

Cover:

* login
* primary CRUD flows
* critical navigation

## Security Tests

Create coverage for:

* XSS
* auth bypass
* invalid input
* protected route role cases

If adding test scripts, expose them through package `scripts` and Turbo.

# Security & Configuration Tips

Load environment variables through the existing `env:load` scripts.

Always:

* Validate payloads with Zod
* Trim and sanitize inputs
* Never expose stack traces
* Validate authentication/authorization
* Protect API routes
* Protect server actions
* Suggest rate limiting on login and critical routes

Block common XSS payloads such as:

```html
<script>alert(1)</script>
```

Use Prisma for database access.

# Workflow Rules

Whenever receiving a task:

1. Analyze existing architecture.
2. Respect current patterns.
3. Create tests.
4. Implement code.
5. Validate security.
6. Suggest improvements.

If something is missing tests, incomplete, or insecure:

STOP and fix it.

# Commit & Pull Request Guidelines

Git history follows Conventional Commit prefixes:

* `feat:`
* `fix:`
* `refactor:`

Keep subjects short and imperative.

Example:

```text
feat: add collector sync status
```

Pull requests should:

* describe the change
* list validation commands run
* link related issues
* include screenshots for UI changes
* call out migrations or environment changes
