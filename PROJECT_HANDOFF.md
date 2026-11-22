# Uangara Project Handoff

> **Purpose:** This is the single current-state briefing for transferring Uangara work between AI models or developers. Read it immediately after [`AGENTS.md`](AGENTS.md). It summarizes the repository; when details conflict, follow the source-of-truth precedence in `AGENTS.md` and report the conflict.

## Handoff metadata

- **Last updated:** 2026-11-22
- **Current working branch:** `feat/wallet-cards-and-recap`
- **Accepted `main` baseline:** `3bfb742`
- **Phase 5 planning commit:** `8fa5c4132dcf582cad3ab590a91680b630e5ba0c`
- **Phase 5 implementation commit:** `5261e3163572d0003016288b94d8de8f9ccca24a`
- **Current phase state:** UI enhancements, bank/e-wallet card styling, account number labeling, total balance hero, and financial recap sections implemented and verified
- **Next permitted action:** review and explore the new dashboard and wallet UI
- **Not authorized:** merging this follow-up without the user's review
- **Production Auth action required:** set the Supabase Site URL to `https://uangara.vercel.app` and allow-list `https://uangara.vercel.app/auth/sign-in?confirmed=true`, then request a new confirmation email

## Start here

Every new model should:

1. Read [`AGENTS.md`](AGENTS.md).
2. Read this handoff completely.
3. Read the phase document explicitly named by the user's current request.
4. Read the core documents in the precedence order defined by `AGENTS.md`.
5. Inspect the current Git branch, worktree, recent commits, and actual implementation before changing files.
6. Stop and report any material conflict instead of choosing an interpretation silently.

The user's current explicit request overrides this snapshot. A later phase is never authorized merely because the preceding phase is ready or complete.

## Product in one paragraph

Uangara is a TypeScript-first personal-finance PWA that answers where a user's money exists and how it moves between real or conceptual financial locations called wallets. Income increases wealth, expenses decrease wealth, and wallet-to-wallet transfers move principal without becoming income or expense. Supabase provides PostgreSQL, authentication, RLS, and atomic financial RPCs. The browser never receives privileged database credentials.

## Phase status

| Phase | Status | Result |
| --- | --- | --- |
| 0 — Foundation & Documentation | Complete and accepted | Product, architecture, domain, security, PWA, roadmap, and agent contracts established |
| 1 — Project Setup & PWA | Complete and accepted | React/TypeScript/Vite/Tailwind/Router/Supabase client/PWA/test foundation |
| 2 — Authentication & Security | Complete and accepted | Supabase Auth, protected routes, profiles, RLS, and ownership verification |
| 3 — Wallet Management | Complete and accepted | Wallet lifecycle, opening balances, ledger foundation, balances, provider presets |
| 4 — Income & Expense | Complete and accepted | Atomic income/expense create, edit, soft delete, restore, and minimal visibility |
| 5 — Wallet Transfers | Complete and accepted | Atomic transfers, optional fees, edit/delete/restore, idempotency, and unified recent feed |
| 6+ | Not started | Must be separately planned/authorized |

The detailed Phase 5 contract and implementation record are in [`docs/phases/PHASE_05_WALLET_TRANSFERS.md`](docs/phases/PHASE_05_WALLET_TRANSFERS.md).

## Implemented application capabilities

- Email/password sign-up, sign-in, sign-out, session restoration, confirmation-required feedback, and protected application routes.
- One owner-scoped profile per authenticated user.
- Wallet list, creation, detail, metadata editing, opening-balance editing, archival, and restoration.
- Wallet types: `bank`, `e_wallet`, `e_money`, `cash`, and `other`, with editable frontend provider presets and custom providers.
- Modern bank & e-wallet card layouts with institution brand logos (BCA, Mandiri, BNI, BRI, Jago, SeaBank, CIMB Niaga, BTN, BSI, GoPay, DANA, OVO, ShopeePay, LinkAja), smart chip graphics, and wallet type icons.
- Adaptive wallet form labeling and display: bank wallets adapt "Wallet name" to "Account number" / "No. Rekening", e-wallets to "Account / Phone number" / "No. Akun / HP".
- Accumulated total balance card displaying the sum of active wallet balances with Month-to-Date (MTD) Pemasukan and Pengeluaran recap.
- Interactive Financial Recap Section with instant switching between Today (Hari Ini), Weekly (Minggu Ini), Monthly (Bulan Ini), and Custom (Kustom date range), categorizing income, expense (including transfer fee), and net cashflow.
- Visual card selectors for wallet creation (wallet type with icons, provider/bank with brand logos).
- Card-based transaction creation flow with 3 unified transaction kinds: Pengeluaran (Expense), Pemasukan (Income), and Transfer, with transfer flow merged directly inside the main transaction form.
- Visual wallet card selector (`WalletCardSelector`) displaying provider logo, account number/name, wallet balance, and type icon, limited to 5 cards with an expandable "Lainnya" tile and search filter when > 6 wallets.
- Atomic income and expense creation, direct editing, soft deletion, restoration, and recent/deleted visibility.
- Atomic wallet-to-wallet transfer creation, direct editing, soft deletion, restoration, optional fee handling, and retry-safe idempotency.
- A unified minimal recent financial-event feed for income, expense, and transfers. Full history/search remains Phase 6.
- Installable PWA shell with static-asset precaching only; no authenticated financial runtime cache or offline mutation queue.

## Non-negotiable financial rules

- Persisted money is whole integer value. PostgreSQL monetary columns use `BIGINT`; never persist floating-point money.
- Frontend monetary values cross the boundary as strings and are parsed through [`src/utils/money.ts`](src/utils/money.ts). Avoid unsafe `Number(...)` conversion.
- Wallet balance is derived from active transaction movements. There is no mutable `wallet.balance` source of truth.
- Negative wallet balances are valid. Do not reject an expense or transfer merely for insufficient funds.
- Opening balance is one special `opening_balance` transaction with exactly one corresponding movement per wallet.
- Every wallet receives that opening pair, including a zero-opening wallet.
- Wallet movements must be non-zero except for the single active opening-balance movement, which may be zero.
- Income has exactly one positive `income` movement.
- Expense has exactly one negative `expense` movement.
- Transfer principal has exactly one negative `transfer_source` movement and one equal positive `transfer_destination` movement.
- A positive transfer fee is a separate negative `transfer_fee` movement on the source wallet. A zero fee has no fee movement.
- Transfer principal is neither income nor expense and has zero net wealth impact. Only its fee decreases wealth.
- Financial multi-record writes are atomic database operations, not independent browser inserts.
- Transaction edits use direct-update semantics and preserve exact ledger shape atomically.
- Transaction deletion is soft deletion through `deleted_at`; movements remain stored but deleted transactions do not affect active balances.
- Restore reuses the same transaction and movements and must not double-count.
- `occurred_at` is the financial event time; `created_at` and `updated_at` are record lifecycle times.
- Future `occurred_at` values are rejected; backdating is allowed.
- Wallet archival preserves history and balance. Archived wallets are not eligible for new activity, but historical references and permitted restoration remain valid.
- Ownership isolation is enforced by owner-qualified foreign keys, RLS, grants, and RPC validation—not merely by React routes.

## Current database architecture

Versioned migrations are immutable once applied:

1. `20260830000000_create_profiles.sql`
2. `20260901000000_create_wallet_ledger.sql`
3. `20260901010000_add_e_money_wallet_type.sql`
4. `20260902000000_add_income_expense_transactions.sql`
5. `20260904000000_add_wallet_transfers.sql`

Core structures:

- `profiles`: minimal one-to-one extension of `auth.users`.
- `wallets`: user-owned money locations with metadata and `archived_at`; no balance column.
- `transactions`: user-owned financial events with kind, timestamps, metadata, `deleted_at`, and transfer-create idempotency where applicable.
- `wallet_movements`: signed `BIGINT` ledger effects with explicit roles and owner-qualified transaction/wallet relationships.
- `wallet_balances`: security-invoker view summing movements from active transactions.
- `transaction_feed`: security-invoker minimal read model for income, expense, and transfer events.

Critical financial writes are hardened `SECURITY DEFINER` RPCs with an empty/pinned search path, ownership derived from `auth.uid()`, narrow authenticated execution grants, input validation, and transactional atomicity. Relevant RPC families cover wallet/opening-balance lifecycle, income/expense lifecycle, and transfer lifecycle. Consult the migrations and [`src/types/database.ts`](src/types/database.ts) for exact signatures.

Transfer creation additionally uses a client-generated UUID idempotency key scoped to the authenticated user. An identical retry returns the existing transfer; reuse with a materially different payload is rejected. Source and destination wallet rows are locked in deterministic order.

## Frontend architecture

- Stack: React 19, TypeScript, Vite, Tailwind CSS, React Router, and `@supabase/supabase-js`.
- Application wiring and providers: `src/app/` and `src/main.tsx`.
- Feature boundaries: `src/features/auth/`, `wallets/`, `transactions/`, and `transfers/`.
- Supabase calls live in feature service modules, not page components.
- Shared monetary parsing/formatting lives in `src/utils/money.ts`; the wallet compatibility wrapper delegates to it.
- Supabase schema/RPC/view typing lives in `src/types/database.ts`.
- Tests use Vitest, React Testing Library, mocked frontend service boundaries, static migration checks, and linked transactional pgTAP suites.
- PWA configuration keeps `runtimeCaching: []`; do not cache authenticated Supabase or financial data.
- `vercel.json` rewrites direct requests to the SPA entry point so authentication callback routes load on Vercel.
- Signup passes `${window.location.origin}/auth/sign-in?confirmed=true`; Supabase production URL Configuration must independently allow that exact callback.

Important authenticated routes currently include:

- `/app/wallets`
- `/app/wallets/new`
- `/app/wallets/:walletId`
- `/app/transactions`
- `/app/transactions/new`
- `/app/transactions/:transactionId`
- `/app/transfers/new`
- `/app/transfers/:transferId`

## Verification snapshot

The latest recorded verification passed:

- TypeScript (`tsc -b --pretty false`): passed with 0 errors.
- ESLint (`eslint . --max-warnings 0`): passed with 0 errors and 0 warnings.
- Prettier: formatted and verified across all changed and added files.
- Frontend/static test suite: 125/125 passed across 21 test files with Vitest.
- Production build (`vite build`): passed; static assets, manifest, and service worker generated.
- `git diff --check`: passed with zero whitespace or line ending issues.
- Secret audit: `.env` ignored; no tracked privileged credentials, database passwords, or CLI access tokens detected.

Do not reuse this snapshot as proof after changing implementation. Rerun checks relevant to the new change and replace or qualify these results accurately.

## Immediate pending work

Production email confirmation configuration currently requires a remote Supabase dashboard correction:

1. Set **Authentication → URL Configuration → Site URL** to `https://uangara.vercel.app`.
2. Add `https://uangara.vercel.app/auth/sign-in?confirmed=true` to **Redirect URLs**.
3. Preserve localhost callbacks as additional development URLs.
4. Request a new email; previously issued confirmation links retain the old localhost redirect and may be expired.

The application now safely explains expired/invalid callback errors and strips their URL fragment, and Vercel direct-route rewrites are present. The dashboard setting itself is remote configuration and was not changed by this repository update.

The Phase 5 manual acceptance checklist covered these journeys:

1. A normal transfer debits and credits the two wallets without changing total wealth.
2. A fee reduces source balance and total wealth by exactly the fee.
3. A transfer can make the source balance negative.
4. Amount, source, destination, fee, occurrence time, description, and notes can be edited without duplicate/stale effects.
5. Fee add/change/removal works.
6. Soft delete removes every active effect; restore returns each effect exactly once.
7. Archived historical wallet references remain readable while new activity against archived wallets is rejected.
8. Refresh and sign-out/sign-in preserve correct owner-scoped state.
9. PWA installability remains intact.
10. A practical retry/double-submit does not create duplicate transfers.

The user subsequently confirmed that Phase 5 manual acceptance passed and the original Phase 5 PR was merged. The discoverability follow-up is separate and must not be treated as merged before review.

## Deliberately deferred

- Phase 6 advanced transaction history, search, filters, and pagination.
- Categories and reporting (later roadmap phase).
- Dashboard analytics and balance summaries beyond current wallet balances.
- Wallet visual grouping, type-specific icons/accents, and semantic balance styling backlog.
- Saving goals; they are not wallets and must not be represented as `other` wallets.
- Multi-currency and exchange rates.
- Recurring transactions, budgeting, bank integrations, and payment processing.
- Offline financial queues, IndexedDB synchronization, and conflict resolution.
- Mutable/materialized wallet balance caches.

## Development and verification commands

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run format:check
```

Use targeted Prettier checks for changed files when the full repository reports known warnings in untouched files. Always run `git diff --check` before committing.

For remote Supabase changes, preserve the established safe sequence:

1. Inspect linked migration history.
2. Run a dry run and confirm only the expected forward migration is pending.
3. Push without reset or migration-history repair.
4. Confirm local/remote history agreement.
5. Run database lint.
6. Run every linked database suite transactionally and verify rollback cleanup.

Never use a linked remote reset, expose credentials, or edit an already-deployed migration.

## Handoff maintenance rule

This file must change in the same change set as every repository update. A future model must:

1. Update the date, branch/status/commit references when they change.
2. Update phase status and the next permitted action.
3. Update implemented capabilities, architecture, schema, routes, or invariants affected by the change.
4. Replace verification numbers only with checks actually run; explicitly record checks that remain pending or failed.
5. Update pending/deferred work when scope decisions change.
6. Add a concise entry to **Recent handoff updates** below.
7. Keep this file free of `.env` values, tokens, passwords, service-role keys, project secrets, personal data, and unsupported claims.

Keep the recent-update list concise—retain roughly the latest ten material entries and rely on Git history for older detail.

## Recent handoff updates

- **2026-11-22 — Card-based Transaction Form, Merged Transfer Flow, Source/Destination Mutual Exclusion & Wallet Detail Layout:** Merged wallet transfers directly into the main transaction form (`/app/transactions/new`), expanding transaction types to three: Pengeluaran (Expense), Pemasukan (Income), and Transfer, selectable via interactive visual cards. Replaced wallet dropdowns with `WalletCardSelector` showing provider logo, account number/name, wallet balance, and wallet type icon, with a 5-card maximum limit and expandable "Lainnya" tile with quick search when > 6 wallets. Enforced mutual exclusion between source and destination wallets (disabling the selected source from destination options and vice-versa). Removed the redundant "Transfer money" buttons from both the homepage (`/app`) and the transactions page (`/app/transactions`), and added the interactive `FinancialRecapSection` directly to the transactions page. Reorganized the wallet detail page (`/app/wallets/:id`) to a clean vertical single-column layout so provider cards and forms display comfortably without horizontal truncation. 135/135 tests passed.
- **2026-11-22 — Visual Card Selectors for Wallet Type and Provider:** Replaced dropdown select menus in wallet create/edit forms with interactive visual card selectors featuring wallet type SVG icons and Indonesian institution brand logos. Preserved accessible hidden select controls for full backward compatibility. 125/125 tests passed.
- **2026-11-22 — Dashboard & Wallet Card UI Enhancements & Financial Recap:** Added bank and e-wallet card layouts with Indonesian institution brand logos, wallet type icons, adaptive "Account number" / "No. Rekening" labeling for banks and phone/account numbers for e-wallets. Added the Total Accumulated Balance Hero Card with MTD income and expense recap. Added an interactive single-section Financial Recap with Today, Weekly, Monthly, and Custom date ranges categorizing income, expense (including transfer fee), and net cashflow. 125/125 tests passed.
- **2026-11-22 — Phase 5 discoverability follow-up:** Added a direct authenticated homepage entry to the existing transfer flow and corrected stale Phase 5 acceptance wording. The follow-up awaits review; transfer backend behavior is unchanged.
- **2026-11-22 — Production email confirmation hardening:** Added Vercel SPA rewrites, safe expired/invalid confirmation callback handling, regression tests, and exact Supabase production URL instructions. Remote Supabase URL Configuration still requires the documented dashboard change and a newly issued email.
- **2026-11-22 — AI handoff contract:** Created this cross-model project briefing and made synchronization mandatory through `AGENTS.md`. No application, database, dependency, migration, or remote Supabase behavior changed.
- **2026-09-04 — Phase 5 implementation:** Added atomic wallet transfers, optional source fees, retry-safe creation, direct edit, soft delete/restore, unified recent visibility, and linked verification totaling 271/271 database assertions. The user later confirmed manual acceptance and merge.
