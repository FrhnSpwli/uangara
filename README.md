# Uangara

Uangara is a personal finance application designed to show where a user's money is held and how it moves between those locations. It treats bank accounts, e-wallets, cash, and custom user-defined wallets as real financial locations rather than reducing everything to income and expense categories.

> **Status:** Phases 0–4 are complete and accepted. Phase 5 wallet transfers are implemented and have passed automated and linked-database verification; manual acceptance is pending. Phase 6 has not started.

## The problem

Many expense trackers explain what money was spent on but make it difficult to see where money currently lives. They may also misclassify a top-up or bank-to-wallet transfer as an expense followed by income, distorting reports and total wealth.

Uangara starts from two questions:

1. Where is the user's money now?
2. How is it moving between wallets?

## Product philosophy

- A wallet is a user-owned location that holds money, such as Mandiri, GoPay, cash, or a custom wallet.
- Income increases total user wealth, and expense decreases it.
- A transfer moves value between wallets without becoming income or expense.
- Transfer fees reduce wealth and are recorded as real expenses or equivalent expense movements.
- Wallet balances are derived from an auditable movement ledger, including a special opening-balance transaction.
- Financial writes involving multiple records must succeed or fail atomically.
- User financial data is private by design.

## Planned core capabilities

- User-created wallets for banks, e-wallets, cash, and other financial locations
- Income and expense recording
- First-class wallet-to-wallet transfers
- Transfer-fee tracking
- Transaction history, search, balance summaries, categories, and reporting
- Mobile-first, installable PWA experience

For example, a transfer of Rp500,000 from Mandiri to GoPay produces a `-500,000` Mandiri movement and a `+500,000` GoPay movement. It does not change total wealth. If Mandiri also pays a Rp1,000 fee, total wealth decreases only by Rp1,000.

## Intended technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Data and identity:** Supabase, PostgreSQL, Supabase Auth, Row Level Security, and database functions/RPC where appropriate
- **PWA:** `vite-plugin-pwa`, web app manifest, service worker, and installable standalone presentation
- **Quality:** ESLint, Prettier, Vitest, and React Testing Library

The browser application uses `@supabase/supabase-js` as its client foundation. A separate Node/Express backend is not planned unless a demonstrated requirement makes one necessary.

## Current foundation

The repository now includes:

- a strict TypeScript React application built with Vite
- a minimal mobile-first shell with public, guest-only, protected, and not-found routes
- Tailwind CSS through its current Vite integration
- a validated Supabase browser client and React auth boundary
- email/password sign-up, sign-in, sign-out, session restoration, and email-confirmation feedback
- a versioned minimal `profiles` migration with owner-scoped RLS and least-privilege grants
- user-owned wallet list, create, detail, metadata edit, opening-balance edit, archive, and restore experiences
- a versioned wallet ledger migration with `BIGINT` movements, atomic wallet RPCs, owner-qualified foreign keys, RLS, and security-invoker balance views
- atomic income/expense create, edit, soft-delete, and restore operations with a minimal recent/deleted transaction experience
- owner-scoped transaction reads, exact-one signed movements, and linked database integrity tests
- atomic wallet-to-wallet transfer create, edit, soft-delete, and restore operations with optional expense-like fees and retry-safe creation
- owner-scoped transfer reads, exact transfer movement shapes, and a unified minimal recent/deleted financial-event surface
- Vitest and React Testing Library auth, wallet, transaction, and transfer tests plus static migration checks
- ESLint and Prettier configuration
- a generated web app manifest and service worker that precaches reviewed static shell assets only

The application exposes the Phase 3 `opening_balance` workflow, Phase 4 ordinary income/expense lifecycle, and the Phase 5 transfer lifecycle. Phase 5 still requires manual acceptance. It contains no categories, full transaction-history/search experience, reports, or mutable wallet balance cache.

## Local development

Uangara currently uses npm and requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and replace its placeholders with a Supabase project URL and browser-safe publishable key. Authentication requires these values. Never place a secret key, service-role key, or database password in a `VITE_*` variable.

Available quality commands:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run preview
```

The Supabase CLI configuration, migrations, and database tests live under `supabase/`. With Docker running, use:

```sh
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

Committed Supabase migrations are the schema source of truth. The matching TypeScript database type in `src/types/database.ts` includes the wallet ledger, income/expense, and transfer read/RPC models; later schema work should retain a reviewed reproducible generation workflow.

## Architecture direction

The financial source of truth will be ledger-oriented: transactions describe business events, while signed wallet movements affect wallet balances. Critical multi-movement operations, especially transfers, will be committed atomically at the database layer. Supabase RLS will scope financial records to their owning user.

Frontend code will keep page rendering separate from data access and financial business rules. See [Architecture](docs/ARCHITECTURE.md), [Domain Rules](docs/DOMAIN_RULES.md), and [Data Model](docs/DATA_MODEL.md).

## PWA direction

The current foundation provides responsive mobile-first presentation, a manifest, temporary development icons, standalone display metadata, and safe static-shell precaching. Full offline financial transaction synchronization is not part of the initial MVP, and no runtime caching is configured for Supabase or financial API responses.

## Roadmap

Development is organized into phases, beginning with documentation, followed by project setup, authentication and security, wallets, transactions, transfers, reporting, PWA polish, hardening, and deployment acceptance. The full sequence and phase definitions are in the [Roadmap](docs/ROADMAP.md).

## Documentation

- [Product definition](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Financial domain rules](docs/DOMAIN_RULES.md)
- [Preliminary data model](docs/DATA_MODEL.md)
- [Security baseline](docs/SECURITY.md)
- [PWA strategy](docs/PWA.md)
- [Roadmap](docs/ROADMAP.md)
- [Agent development contract](AGENTS.md)
- [Phase 0 — Foundation & Documentation](docs/phases/PHASE_00_FOUNDATION.md)
- [Phase 1 — Project Setup & PWA Foundation](docs/phases/PHASE_01_PROJECT_SETUP.md)
- [Phase 2 — Authentication & Security Foundation](docs/phases/PHASE_02_AUTH_SECURITY.md)
- [Phase 3 — Wallet Management](docs/phases/PHASE_03_WALLET_MANAGEMENT.md)
- [Phase 4 — Income & Expense Transactions](docs/phases/PHASE_04_INCOME_EXPENSE_TRANSACTIONS.md)

- [Phase 5 — Wallet-to-Wallet Transfers](docs/phases/PHASE_05_WALLET_TRANSFERS.md)

## Screenshots

Screenshots will be added after the product interface advances beyond the foundation shell.
