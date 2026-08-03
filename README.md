# Civic Reporting

A web-first, synthetic civic-reporting pilot for local and staging engineering.
Harborfield Pilot District and Harborfield Civic Works Lab are fictional. This
repository is not a real government service and is not production-ready.

## Phase 1 runtime

Requirements:

- Node.js 20.9 or newer
- pnpm 11.13.0 through Corepack
- No global packages are required

Install and run the Phase 1 application:

    pnpm install
    pnpm dev

The app listens on http://127.0.0.1:3010. Ports 3000 and 3001 are intentionally
not used.

Run the Phase 1 quality gates:

    pnpm format
    pnpm lint
    pnpm typecheck
    pnpm test:component
    pnpm build

Browser tests require a built app running under the project-local PM2:

    pnpm build
    pnpm qa:start
    pnpm test:e2e
    pnpm qa:stop

CI must start the built application on the configured Playwright base URL with a
bounded, health-checked process before running the browser suite. Local
verification uses the named PM2 process above so it cannot disturb unrelated
runtimes.

## Safety and launch status

Public media is disabled. There is no production service, real jurisdiction,
remote Supabase project, delivery provider, or approved legal/privacy process.
See docs/operations/launch-gates.md before treating any later phase as launch
work.
