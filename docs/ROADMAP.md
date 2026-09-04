# Roadmap

This roadmap sequences the intended MVP work. Only a phase explicitly requested by the user is authorized for implementation. Phases 0–4 are complete and accepted; Phase 5 is next/planned with an accepted implementation contract, while later phases remain intentionally high-level until their prerequisites and designs are resolved.

## Phase 0 — Foundation & Documentation

- **Objective:** Establish the shared product and engineering contract before code exists.
- **Major deliverables:** README, agent instructions, product definition, architecture, domain rules, preliminary data model, security and PWA baselines, roadmap, and Phase 0–2 plans.
- **Dependencies:** None.
- **Definition of done:** Documents are complete, internally consistent, linked, and do not introduce implementation artifacts.

Detailed plan: [Phase 0](phases/PHASE_00_FOUNDATION.md)

## Phase 1 — Project Setup & PWA Foundation

- **Objective:** Create a tested TypeScript frontend foundation and installable PWA shell.
- **Major deliverables:** React/Vite setup, styling and routing, Supabase client configuration, quality tools, baseline folders, responsive shell, manifest, service worker, icons, and smoke tests.
- **Dependencies:** Phase 0.
- **Definition of done:** Type checks, lint, tests, production build, application shell, environment validation, and installability baseline pass without implementing database or auth behavior.

Detailed plan: [Phase 1](phases/PHASE_01_PROJECT_SETUP.md)

## Phase 2 — Authentication & Security Foundation

- **Objective:** Establish secure user identity, sessions, protected routes, profile ownership, and initial RLS.
- **Major deliverables:** Supabase Auth flows, profile migration, RLS policies, protected routing, auth states, and ownership tests.
- **Dependencies:** Phases 0–1 and an approved Supabase development environment.
- **Definition of done:** Auth journeys work, profiles are owner-scoped, cross-user and anonymous access tests pass, and no privileged credentials reach the client.

Detailed plan: [Phase 2](phases/PHASE_02_AUTH_SECURITY.md)

## Phase 3 — Wallet Management

- **Objective:** Let users model the locations where they hold money.
- **Major deliverables:** Wallet schema implementing the locked opening-balance ledger semantics, migrations and RLS, wallet create/read/update/archive flows, and balance foundations.
- **Dependencies:** Phase 2 and resolution of relevant data-model questions.
- **Definition of done:** Users can securely manage only their own custom wallets and opening positions without compromising ledger semantics.

Detailed plan: [Phase 3](phases/PHASE_03_WALLET_MANAGEMENT.md)

### Future wallet UX backlog

The current wallet view is functionally accepted. A future UX refinement may consider:

- visual grouping using the existing \`wallet.type\` taxonomy: \`bank\`, \`e_wallet\`, \`e_money\`, \`cash\`, and \`other\`;
- wallet-type-specific visual accents or icons;
- semantic presentation for positive, zero, and negative balances;
- accessibility that does not communicate meaning through color alone.

This is a presentation backlog item only. It does not introduce a new wallet-category data model. Saving goals remain separate future work.

## Phase 4 — Income & Expense Transactions

- **Objective:** Record wealth-changing transactions against wallets.
- **Major deliverables:** Transaction/movement schema extensions implementing the locked lifecycle/time semantics, validated atomic writes, minimal income/expense UI, and ledger-derived balance updates.
- **Dependencies:** Accepted Phase 3 wallet/ledger foundation and the income/expense decisions locked by the Phase 4 contract. Categories remain deferred to Phase 8.
- **Definition of done:** Valid income and expense events produce correct movements and balances, with ownership and rollback tests passing.

Detailed plan: [Phase 4](phases/PHASE_04_INCOME_EXPENSE_TRANSACTIONS.md)

## Phase 5 — Wallet-to-Wallet Transfers

- **Objective:** Implement first-class, wealth-neutral internal transfers with optional wealth-decreasing fees.
- **Major deliverables:** Transfer RPC and validation, source/destination UI, fee treatment, atomic direct-edit and soft-delete behavior, and integrity tests.
- **Dependencies:** Phase 4 and the accepted transfer contract, including fee and mutation design.
- **Definition of done:** Transfer principal is atomic and sums to zero; fees alone reduce wealth and report as expense.

Detailed plan: [Phase 5](phases/PHASE_05_WALLET_TRANSFERS.md)

## Phase 6 — Transaction History & Search

- **Objective:** Make financial events understandable and discoverable.
- **Major deliverables:** Unified history, pagination, filters/search, transaction details, and safe correction actions permitted by the domain policy.
- **Dependencies:** Phases 4–5.
- **Definition of done:** Users can reliably find and interpret their own transactions without transfer double counting.

## Phase 7 — Dashboard & Balance Summary

- **Objective:** Answer where the user's money is now.
- **Major deliverables:** Per-wallet balances, total wealth, summary states, and relevant freshness/error handling.
- **Dependencies:** Phases 3–6.
- **Definition of done:** Displayed balances reconcile with ledger movements and internal transfers do not change total wealth.

## Phase 8 — Categories & Reporting

- **Objective:** Explain actual income and expense patterns.
- **Major deliverables:** Category ownership/default strategy, management UI, period summaries, and basic reports.
- **Dependencies:** Stable transaction history and resolution of category design.
- **Definition of done:** Reports classify wealth-changing events correctly and exclude transfer principal from income and expense.

## Phase 9 — PWA Experience & Installability Polish

- **Objective:** Refine the safe, installable mobile experience.
- **Major deliverables:** Production icons and metadata, install UX, update behavior, responsive polish, and offline fallback.
- **Dependencies:** Stable primary journeys and the Phase 1 PWA baseline.
- **Definition of done:** Installability and service-worker behavior are verified without claiming or introducing full offline financial sync.

## Phase 10 — UX & Reliability Polish

- **Objective:** Improve clarity, accessibility, resilience, and perceived quality.
- **Major deliverables:** Empty/loading/error states, accessibility review, form safeguards, recovery behavior, and performance improvements.
- **Dependencies:** Complete MVP feature journeys.
- **Definition of done:** Core journeys meet documented usability, accessibility, and reliability acceptance criteria.

## Phase 11 — Security & Financial Integrity Hardening

- **Objective:** Challenge and strengthen authorization and ledger correctness before release.
- **Major deliverables:** RLS audit, adversarial ownership tests, RPC/grant review, concurrency and rollback tests, cache review, dependency audit, and data recovery review.
- **Dependencies:** Feature-complete MVP candidate.
- **Definition of done:** No known critical authorization or financial-integrity failures remain, and residual risks are documented.

## Phase 12 — MVP Acceptance & Deployment

- **Objective:** Validate and release the agreed MVP safely.
- **Major deliverables:** End-to-end acceptance, production configuration, deployment and migration runbook, monitoring baseline, backup/recovery confirmation, and release notes.
- **Dependencies:** Phase 11 and a selected deployment environment.
- **Definition of done:** All MVP acceptance criteria pass in the target environment and operational ownership is documented.
