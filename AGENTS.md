# Agent Development Contract

This file governs all work in the Uangara repository. Read it before changing the project.

## Project Mission

Uangara is a personal finance application that answers where a user's money is held and how it moves. Wallets are real or conceptual money locations. Income and expense change total wealth; internal transfers do not, except for any fee. The product is planned as a TypeScript-first React PWA backed by Supabase.

## Source of Truth

Use this precedence, from highest to lowest:

1. `AGENTS.md`
2. The current phase document in `docs/phases/`
3. `docs/DOMAIN_RULES.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/SECURITY.md` and `docs/PWA.md`
7. `docs/ROADMAP.md`
8. `README.md`

The user's current explicit request overrides repository documentation. A phase is current only when the request identifies it; do not infer that the next numbered phase is authorized. If applicable documents conflict, stop and report the conflict explicitly rather than choosing silently.

## Development Rules

- Use TypeScript first. Avoid untyped escape hatches unless they are justified and contained.
- Do not introduce a separate backend server unless a documented requirement cannot be met safely with the browser client, Supabase, RLS, constraints, and database functions.
- Make database changes through versioned Supabase migrations; never rely on undocumented dashboard-only edits.
- Enable and test RLS for every table containing user-owned financial data. A user may access only records they own or are explicitly authorized to access.
- Never expose Supabase service-role credentials or other privileged secrets in frontend code, logs, tests, or committed environment files.
- Keep business-critical financial rules out of React page components and do not duplicate them across UI code.
- Preserve ledger semantics: wallet balance equals the sum of signed movements from active transactions. Opening balance is a special `opening_balance` transaction and movement, never a separate mutable balance source that is counted again.
- Treat transfers as first-class operations, never as unrelated income and expense records.
- Make financial operations that write multiple records atomic at the database layer.
- Model transfer fees as wealth-decreasing expense behavior; do not hide them inside a wealth-neutral transfer.
- Do not implement offline financial queues, background transaction sync, or conflict resolution before a dedicated phase approves their integrity and security design.
- Cache sensitive financial responses conservatively; PWA installability does not imply offline financial functionality.
- Prefer the existing stack and avoid dependencies that do not provide clear value.
- Change only what the requested phase requires. Do not refactor unrelated functionality or silently implement later phases.
- Keep migrations backward-compatible where practical. Document and explicitly plan any destructive or irreversible migration.
- Update relevant documentation whenever an architectural, domain, security, or phase decision changes.
- Preserve user changes already present in the worktree and do not fabricate implementation or verification results.

## Phase Discipline

Implement only the phase explicitly requested by the user. Every executable phase document must define:

- objective
- scope
- out of scope
- technical requirements
- acceptance criteria
- verification

Resolve phase prerequisites before implementation. If a requirement belongs to a later phase, record the dependency or open question instead of implementing it. Phase 1 and Phase 2 documents are plans until the user explicitly authorizes those phases.

## Completion Requirements

Before declaring an implementation phase complete, run and report every relevant check:

- TypeScript type checking
- linting and formatting checks
- automated tests
- production build
- manual acceptance criteria
- security and ownership assumptions, including RLS where applicable
- documentation updates

Report commands and actual outcomes. If a check cannot run, state why and leave the phase incomplete unless its acceptance criteria explicitly permit that limitation. Never infer or invent a passing result.
