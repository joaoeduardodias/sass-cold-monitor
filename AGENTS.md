# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm/Turbo monorepo. Applications live in `apps/`:

- `apps/api`: Fastify API, Prisma schema and migrations in `prisma/`, source in `src/`.
- `apps/web`: Next.js app, routes in `src/app`, UI in `src/components`, clients in `src/http`, hooks/stores in `src/hooks` and `src/stores`.
- `apps/collector`: Electron/Vite collector app, renderer code in `src`, Electron entry points in `electron`, static files in `public`.

Shared packages live in `packages/`, including `auth` and `env`. Shared ESLint, Prettier, and TypeScript config lives in `config/`.

## Build, Test, and Development Commands

Use pnpm from the repository root.

- `pnpm dev`: run development tasks through Turbo.
- `pnpm build`: build packages/apps.
- `pnpm lint`: run configured lint tasks.
- `pnpm dev:collector`: start only the Electron collector app.
- `pnpm dist:collector`: build the Windows collector.
- `pnpm --filter @cold-monitor/api dev`: start the API with `.env` loaded.
- `pnpm --filter web dev`: start the Next.js app.
- `pnpm --filter @cold-monitor/api db:migrate`: run Prisma migrations.

After changes, always suggest running:

- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm test:e2e`

## Coding Style & Naming Conventions

Write strongly typed TypeScript and avoid `any`.

Always follow:

- Small functions.
- Explicit names.
- Clear responsibilities.
- Reusable components.
- SOLID whenever possible.
- Avoid duplicated code.
- Production-ready code.
- Maintain performance.

Prettier uses:

- 2 spaces
- 80 columns
- semicolons
- single quotes
- Tailwind class sorting

ESLint extends `config/eslint-config` and enforces sorted imports.

Use kebab-case for route and utility files such as `create-organization.ts`.

Use PascalCase for React component exports.

Prefer:

- Shadcn UI
- Radix UI
- Tailwind CSS variables
- Consistent spacing and layout patterns
- Primary color patterns based on blue
- lucide-react icons

## Front-end Standards

## Forms

All forms should use:

- React Hook Form
- Zod validation
- Friendly error messages
- Loading state
- Success state
- Error state
- Disabled submit button while submitting
- Input sanitization
- Automatic trim
- XSS-safe inputs
- Accessibility best practices

When editing forms, always include:

- Zod schema
- Sanitization
- Error messages
- Accessibility

## UI Components

Prefer reusable components and shared UI patterns.

Maintain consistency for:

- spacing
- padding
- colors
- alerts
- buttons
- validation states

## Back-end Standards

## APIs / Server Actions

Always:

- Validate payloads with Zod
- Validate authentication on backend routes
- Validate authentication on server actions
- Sanitize inputs
- Handle errors properly
- Return correct HTTP status codes
- Use clear logs
- Never expose stack traces

## Protected Routes Must Be Tested For:

- no token
- invalid token
- unauthorized role
- authorized role

## Database Standards

Use Prisma whenever possible.

Always validate:

- indexes
- pagination for heavy queries
- necessary includes only
- avoid N+1 queries

Protect against:

- SQL Injection
- Mass Assignment
- Invalid data
- Heavy unpaginated queries

## Testing Guidelines

Project rules require tests for every new or changed feature.

## Unit Tests

Use Jest for:

- utils
- services
- validations
- business rules

## Front-end Tests

Use:

- Jest
- React Testing Library

Cover:

- rendering
- user interaction
- forms
- submit flows
- loading states
- error states

## E2E Tests

Use Playwright.

Cover:

- login
- primary CRUD flows
- critical navigation

## Security Tests

Create coverage for:

- XSS
- auth bypass
- invalid input
- protected route role cases

If adding test scripts, expose them through package `scripts` and Turbo.

## Security & Configuration Tips

Load environment variables through the existing `env:load` scripts.

Always:

- Validate payloads with Zod
- Trim and sanitize inputs
- Never expose stack traces
- Validate authentication/authorization
- Protect API routes
- Protect server actions
- Suggest rate limiting on login and critical routes

Block common XSS payloads such as:

- `<script>alert(1)</script>`
- unsafe HTML payloads

Use Prisma for database access.

## Workflow Rules

Whenever receiving a task:

1. Analyze existing architecture.
2. Respect current patterns.
3. Create tests.
4. Implement code.
5. Validate security.
6. Suggest improvements.

If something is missing tests, incomplete, or insecure:

STOP and fix it.

## Commit & Pull Request Guidelines

Git history follows Conventional Commit prefixes, mainly:

- `feat:`
- `fix:`
- `refactor:`

Keep subjects short and imperative, for example:

- `feat: add collector sync status`

Pull requests should:

- describe the change
- list validation commands run
- link related issues
- include screenshots for UI changes
- call out migrations or environment changes