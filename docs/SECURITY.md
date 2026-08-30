# Security Baseline

## Scope

Uangara handles sensitive personal financial records. Security must be designed into authentication, authorization, data modeling, PWA behavior, and financial writes. This document states a baseline, not a claim of regulatory compliance or completed controls.

Uangara is a personal finance tracking product. It is not a bank, custodian, or payment processor.

## Authentication

Supabase Auth is the intended identity provider. The application must handle sign-up, sign-in, sign-out, session restoration, expiry, loading, and errors without treating client state as proof of database authorization.

## Ownership and Row Level Security

- Every user-owned financial record must have an enforceable path to its owner.
- RLS must be enabled on profiles, wallets, categories where user-owned, transactions, movements, and any later user-data tables.
- Policies must use `auth.uid()` or an equivalently secure ownership relationship for reads and writes.
- Cross-user references must be prevented by constraints, policies, or trusted database functions—not only UI filtering.
- RLS must be tested with at least two distinct user identities and unauthenticated access where applicable.
- Tables must not become exposed between migration steps; enable secure policies as part of the same reviewed migration sequence.

The Phase 2 `profiles` migration applies this baseline with an `auth.users.id` ownership key, RLS enabled in the creating migration, explicit owner-only select/insert/update policies, no client delete permission, and column-level write grants. A restricted database trigger creates new profiles; route guards remain only a frontend navigation boundary. These controls require integration verification against a running Supabase-compatible database before Phase 2 is fully accepted.

## Credentials and secrets

The Supabase project URL and browser publishable/anon key are expected frontend configuration, not authorization substitutes. RLS must make use of them safe. Service-role keys, database passwords, signing secrets, and privileged credentials must never be included in frontend bundles, committed environment files, client-visible logs, or browser tests.

Secret-bearing workflows, if later required, need an approved trusted execution boundary such as a Supabase Edge Function or another documented server-side mechanism.

## Validation and database integrity

- Validate user input for useful feedback at the application boundary.
- Repeat critical validation at the database boundary because clients are untrusted.
- Use database types, foreign keys, checks, uniqueness rules, and ownership constraints where practical.
- Reject zero or invalid financial amounts and impossible transaction shapes.
- Prevent users from creating movements against wallets or transactions they do not own.
- Do not rely on TypeScript types alone for runtime or persistence integrity.

## Atomic financial operations

Transactions that create, edit, reverse, or delete multiple financial records must be atomic. Database functions/RPC are expected for critical compound writes such as transfers. Functions must validate caller identity and ownership, use the caller's authorization context safely, and avoid overly broad `SECURITY DEFINER` privileges. A failure must roll back the entire financial operation.

## Migration discipline

- Commit versioned Supabase migrations for every schema, policy, constraint, and function change.
- Review grants and RLS behavior with each migration.
- Prefer additive and backward-compatible changes where practical.
- Explicitly plan data migrations, rollback/recovery, and downtime for destructive changes.
- Do not use undocumented dashboard edits as the source of truth.

## Least privilege

Grant only the operations required by each role. Prefer narrowly scoped RPC functions over broad table-write privileges when compound invariants cannot otherwise be guaranteed. Avoid privileged client pathways and verify function search paths, execution privileges, and ownership during implementation.

## Sensitive data handling

- Collect only data required for the product.
- Avoid placing financial details or auth tokens in logs, analytics, URLs, error messages, or notification previews.
- Sanitize user-visible errors while retaining safe diagnostic information.
- Treat exports, backups, telemetry, and future third-party integrations as explicit security-design work.
- Do not claim encryption, compliance, audit status, or certifications without verified evidence.

## PWA and cache considerations

The service worker may cache versioned static assets required for installability. It should not aggressively cache authenticated Supabase responses, tokens, user-specific pages, or financial payloads. Cache cleanup and logout behavior must be reviewed. Full offline financial storage or synchronization requires separate threat modeling, local-data protection, idempotency, and conflict-resolution design and is outside the initial MVP.

## Security verification baseline

Relevant phases must verify unauthenticated denial, same-user access, cross-user denial, invalid reference rejection, atomic rollback, credential hygiene, and production-bundle configuration. Exact tests belong in the implementing phase and their results must be reported truthfully.
