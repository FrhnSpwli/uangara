# Phase 4 — Income & Expense Transactions

## Status

`PLANNED — NOT STARTED`

This document is the implementation contract for Phase 4. It records decisions made against the merged Phase 3 repository but does not authorize or contain implementation. Phase 5 transfers, Phase 6 full history/search, and Phase 8 categories remain unstarted.

## Objective

Let an authenticated user record, inspect, correct, soft-delete, and restore ordinary income and expense transactions against their wallets while preserving Uangara's ledger, ownership, and atomicity invariants.

Phase 4 adds only the minimum transaction visibility needed to operate these flows. It does not build the final transaction-history experience.

## Prerequisites and current baseline

- Phases 0–3 are complete and accepted.
- Supabase Auth, session restoration, and the protected `/app` boundary are operational.
- The deployed Phase 3 schema already contains owner-qualified `wallets`, `transactions`, and `wallet_movements` tables.
- `transactions.kind` already permits `opening_balance`, `income`, `expense`, and `transfer`, although only `opening_balance` has an authorized application workflow.
- `transactions` already has `occurred_at`, `created_at`, `updated_at`, and nullable `deleted_at`.
- `wallet_movements.amount` is signed PostgreSQL `BIGINT`; `movement_role` identifies its purpose.
- `(id, user_id)` uniqueness and composite owner-qualified foreign keys prevent a movement from joining one user's transaction to another user's wallet.
- All three financial tables have RLS. Authenticated reads are owner-scoped, while direct client writes to `transactions` and `wallet_movements` are not granted.
- Phase 3 security-definer functions implement atomic wallet/opening-balance operations and derive ownership from `auth.uid()`.
- `wallet_balances` is a security-invoker view that sums movements whose transactions have `deleted_at IS NULL`; it includes archived wallets and has no mutable balance cache.
- The frontend uses a feature-level service/provider boundary, handwritten reviewed database types, protected React Router routes, and shared monetary helpers that parse with `bigint`, enforce the JavaScript safe-integer range, and read database money as decimal strings.
- The PWA precaches reviewed static shell assets only and has no authenticated Supabase runtime cache.

Phase 4 must extend these conventions rather than replace them.

### Actual Phase 3 model inspected

- `20260901000000_create_wallet_ledger.sql` created the wallet/ledger foundation; `20260901010000_add_e_money_wallet_type.sql` extended the wallet-type check without rewriting history.
- `wallets` stores `id`, `user_id`, editable `name`, `type`, optional `institution`, `archived_at`, `created_at`, and `updated_at`. Supported types are `bank`, `e_wallet`, `e_money`, `cash`, and `other`; there is no `balance` column.
- `transactions` stores `id`, `user_id`, `kind`, `occurred_at`, `deleted_at`, `created_at`, and `updated_at`. The table has the fields Phase 4 needs for kind and lifecycle but does not yet have description/notes or an ordinary transaction mutation API.
- `wallet_movements` stores `id`, `user_id`, `transaction_id`, `wallet_id`, signed `amount BIGINT`, `movement_role`, `created_at`, and `updated_at`.
- The movement table's composite `(transaction_id, user_id)` and `(wallet_id, user_id)` foreign keys enforce same-owner linkage. RLS independently scopes all three tables.
- Deferred constraint triggers, partial unique indexes, and the narrow amount check enforce the exact-one opening pair and its sole zero-valued exception. They do not yet enforce an income/expense one-movement shape.
- `wallet_balances` derives balances by summing movements joined to transactions with `deleted_at IS NULL`; `wallet_opening_balances` exposes the single opening pair. Both views use security-invoker semantics.
- Existing narrow RPCs are `create_wallet`, `update_wallet_opening_balance`, `archive_wallet`, and `restore_wallet`. They validate `auth.uid()`, pin object resolution, and are granted only to the intended authenticated role.
- Wallet archive sets `archived_at` without changing the opening pair, movements, or calculated balance. Restoring clears it.
- Phase 3's wallet service is injected through a React context; its read models transport database money as strings, and page components do not perform multi-row writes.

## Locked and Phase 4 decisions

| Area | Decision |
| --- | --- |
| Persisted money | Whole integer values; monetary columns and RPC amount parameters use PostgreSQL `BIGINT` |
| User-entered amount | Positive, non-zero magnitude; the database derives movement sign from transaction kind |
| Income shape | One transaction and exactly one persistent positive movement with role `income` |
| Expense shape | One transaction and exactly one persistent negative movement with role `expense` |
| Negative balances | Allowed; no insufficient-funds validation |
| Create boundary | One unified, narrowly scoped database RPC for income and expense |
| Edit | Direct atomic update of the existing transaction and movement |
| Kind correction | An active `income` may be changed to `expense` and vice versa through the edit RPC |
| Delete | Soft delete by setting `transactions.deleted_at`; retain the movement row |
| Restore | Included; clear `deleted_at` through a narrow RPC and restore the existing movement's effect exactly once |
| Occurrence time | User-selectable `occurred_at`, defaulting to now; backdating allowed; future values rejected in Phase 4 |
| Ordering | `occurred_at DESC`, then `created_at DESC`, then `id DESC` |
| Archived wallets | No new transaction or retargeting to an archived wallet; historical correction and restore may retain the same archived wallet |
| Categories | No category table, field, presets, or nullable groundwork in Phase 4 |
| Event text | Required `description`; optional `notes`; no separate title field |
| Principal amount column | Not added in Phase 4; the sole movement is the authoritative amount effect |
| History UI | A small recent active/deleted list and detail/correction flow only; full history/search remains Phase 6 |

## Schema extension

Implementation must add one new forward-only migration after the deployed Phase 3 migrations. It must not edit either applied Phase 3 migration.

### `transactions`

Reuse the existing identifier, `user_id`, `kind`, `occurred_at`, `deleted_at`, `created_at`, and `updated_at` fields. Add:

- `description` as nullable text at the physical column level so existing `opening_balance` rows remain valid;
- `notes` as nullable text.

Add constraints so every `income` or `expense` transaction has a trimmed, non-empty description of at most 120 characters. `notes`, when supplied, must be trimmed, non-empty, and at most 1,000 characters; blank input is normalized to `NULL` by the RPC. Existing `opening_balance` rows do not need fabricated descriptions. Phase 5 will decide text requirements for transfers.

Do not add a transaction-level monetary amount, category reference, currency field, transfer linkage, or hard-delete behavior in this phase.

Retain the existing kind check. Phase 4 authorizes only `income` and `expense` in its RPCs; the presence of `transfer` in the future-compatible check does not authorize a transfer workflow.

### `wallet_movements`

Reuse the existing signed `BIGINT` amount and owner-qualified relationships. Phase 4 movements use:

- role `income` with `amount > 0` for an `income` transaction;
- role `expense` with `amount < 0` for an `expense` transaction.

An income or expense movement may never be zero. The sole zero-movement exception remains the one movement belonging to a wallet's opening-balance transaction.

### Exact-one ordinary movement invariant

For every income or expense transaction, including a soft-deleted one, the database must preserve exactly one movement row. Soft deletion changes whether that persistent movement is effective; it does not remove the movement.

Add `DEFERRABLE INITIALLY DEFERRED` constraint-trigger validation consistent with Phase 3 so the complete shape is checked at transaction end after an atomic RPC has written both rows. It must reject:

- income/expense transactions with zero or multiple movements;
- an income transaction whose movement is non-positive or whose role is not `income`;
- an expense transaction whose movement is non-negative or whose role is not `expense`;
- income/expense movements attached to a transaction of another kind;
- a movement whose transaction and wallet owners differ;
- orphaned movement changes or attempts to reassign ownership.

The existing opening-balance assertions, exact-one indexes, and narrow zero exception must remain unchanged and continue to pass. Transfer-shape enforcement remains Phase 5; direct client creation of transfer rows remains unavailable.

Add a partial unique index on `transaction_id` for movements whose role is `income` or `expense` as an immediate duplicate guard. The deferred shape validator remains authoritative for missing movements, extra movements with an unexpected role, kind/role mismatches, and sign correctness.

### Read model and indexes

Add a security-invoker read view dedicated to Phase 4 income/expense records. It should join each transaction to its one movement and wallet and cast the positive `BIGINT` amount magnitude to PostgreSQL `text` for a precision-safe browser boundary. Include:

- transaction identifier and kind;
- wallet identifier, name, and archive state;
- description and notes;
- positive amount magnitude;
- `occurred_at`, `deleted_at`, `created_at`, and `updated_at`.

The view must exclude `opening_balance` and future transfer rows. It must rely on underlying RLS, be selectable only by `authenticated`, and must not use a definer context that bypasses owner filtering.

Keep the existing Phase 3 transaction index and add two partial ordering indexes for Phase 4 records: one for `deleted_at IS NULL` and one for `deleted_at IS NOT NULL`, each keyed by `(user_id, occurred_at DESC, created_at DESC, id DESC)` and limited to `kind IN ('income', 'expense')`. The intended total ordering is `occurred_at DESC, created_at DESC, id DESC`. Do not remove the Phase 3 index during this phase.

## Ledger invariants

### Income

```text
Input magnitude: 500000
Transaction kind: income
Movement: +500000
Net wealth change: +500000
```

### Expense

```text
Input magnitude: 35000
Transaction kind: expense
Movement: -35000
Net wealth change: -35000
```

### Active balance

```text
wallet balance = SUM(movements whose transactions have deleted_at IS NULL)
```

Income and expense naturally affect the existing Phase 3 `wallet_balances` view. A deleted transaction's movement remains stored but is excluded by the existing active-transaction predicate. Restoring the transaction clears `deleted_at`, making that same movement effective exactly once.

An expense may make a wallet balance negative. Neither frontend validation nor database functions may reject an expense because its amount exceeds the current balance.

## RPC and mutation API

Use a unified API for income and expense because both share the same one-movement shape and can be corrected between the two kinds. Do not use a generic `create_transaction` name that implies support for opening balances or Phase 5 transfers.

### `create_income_expense_transaction`

Inputs:

- `p_kind`: exactly `income` or `expense`;
- `p_wallet_id`: target wallet UUID;
- `p_amount`: positive, non-zero `BIGINT` magnitude;
- `p_occurred_at`: valid `timestamptz`, not later than database `now()`;
- `p_description`: trimmed 1–120 characters;
- `p_notes`: optional trimmed text up to 1,000 characters, with blank normalized to `NULL`.

Behavior:

1. Require an authenticated `auth.uid()`.
2. Resolve and lock an active wallet owned by that user; reject missing, foreign, or archived wallet identifiers with the same safe unavailable result.
3. Insert the transaction with owner derived from the caller.
4. Insert exactly one movement for the same owner and wallet, deriving role and sign from `p_kind`.
5. Return the transaction UUID only after both rows and deferred invariants are valid.

The caller never supplies `user_id`, movement sign, movement role, or movement identifier.

### `update_income_expense_transaction`

Inputs mirror create and add `p_transaction_id`.

Behavior:

- lock the caller-owned active income/expense transaction and its one movement;
- reject opening-balance, transfer, foreign, missing, or soft-deleted transactions;
- validate the complete resulting shape rather than only changed fields;
- update `kind`, `occurred_at`, `description`, and `notes` directly;
- update the existing movement's wallet, role, and signed amount without deleting/reinserting it;
- update the movement timestamp only when movement data changes; the transaction's database trigger updates its `updated_at` on every accepted edit;
- permit `income ↔ expense` correction and atomically flip movement role/sign;
- permit retaining the same wallet even if that wallet was archived after the transaction occurred;
- permit moving from an archived historical wallet to an active owned wallet;
- reject changing the wallet to a different archived wallet.

Allowing kind correction avoids a misleading delete-and-recreate workflow and is safe because both Phase 4 kinds have exactly one movement. Opening balances and transfers are never convertible through this function. The UI must make a kind change conspicuous because it reverses the transaction's wealth direction.

### `soft_delete_income_expense_transaction`

- Require caller ownership and an active income/expense transaction.
- Lock the transaction and its existing movement.
- Set `deleted_at` to database `now()`; do not delete or zero the movement.
- Reject opening balances, transfers, foreign rows, missing rows, and already-deleted rows.
- Preserve wallet reference, description, notes, occurrence time, and movement history.

### `restore_income_expense_transaction`

- Require caller ownership and a soft-deleted income/expense transaction.
- Lock and revalidate the existing exact-one movement shape.
- Clear `deleted_at`; do not create a replacement movement.
- Permit restoration when the referenced wallet is archived because this reverses deletion of a historical event rather than posting a new event. The archived wallet remains outside the active wallet list, but its preserved balance changes consistently.
- Reject opening balances, transfers, foreign rows, missing rows, and already-active rows.

No Phase 4 RPC is required to be retry-idempotent by an external operation key. The UI must disable duplicate submission while pending. A general idempotency design remains a hardening concern and must not be improvised only for this phase.

## RPC security requirements

Every financial RPC must:

- be `SECURITY DEFINER` only where necessary for atomic writes denied to the browser role;
- set an explicit empty or otherwise pinned `search_path` and schema-qualify referenced objects;
- derive the owner from `auth.uid()` and reject unauthenticated calls;
- never accept or trust a client-supplied `user_id`;
- validate and lock caller-owned rows before mutation;
- validate amount, kind, timestamp, text length, archive eligibility, and complete movement shape;
- collapse foreign and missing identifiers into non-enumerating client behavior;
- have default `PUBLIC`, `anon`, and broad function execution revoked;
- grant execute only to `authenticated` for the exact signatures intended by the frontend;
- complete as one PostgreSQL statement transaction so a thrown error rolls back every row change.

Do not use a service-role credential, database password, or separate backend in the browser.

## RLS, grants, and ownership

- Retain RLS on `wallets`, `transactions`, and `wallet_movements`.
- Retain owner-scoped reads: `auth.uid() = user_id`.
- Anonymous users receive no financial reads or writes.
- Keep direct authenticated `INSERT`, `UPDATE`, and `DELETE` unavailable on `transactions` and `wallet_movements`; owning a row alone is insufficient permission to bypass ledger invariants.
- Keep wallet metadata updates restricted to their existing approved columns. Phase 4 does not broaden wallet write grants.
- Keep composite `(id, user_id)` keys and owner-qualified foreign keys so a valid UUID from another user cannot create a cross-owner linkage even through a privileged code defect.
- Read views must use `security_invoker` behavior and underlying RLS; frontend protected routes are usability boundaries, not database authorization.

IDOR tests must specifically pass another user's valid wallet and transaction UUIDs to every applicable RPC and verify both denial and lack of side effects.

## Amount and monetary boundary

The form presents a positive magnitude for both kinds. Users enter `35000` for an expense, not `-35000`. Zero, negative input, decimals, separators that the parser does not explicitly support, malformed text, and values outside `Number.isSafeInteger` are rejected before the RPC. The database independently requires `p_amount > 0` and derives the signed movement.

Extend the existing shared monetary adapter rather than duplicating parsing in transaction components. Reading continues to transport PostgreSQL `BIGINT` values as decimal strings and format them through `bigint`. Conversion to JavaScript `number` is permitted only after the existing safe-integer proof at the RPC input boundary.

Phase 4 remains IDR-oriented and introduces neither floating-point persistence nor multi-currency behavior.

## Time semantics and ordering

- `occurred_at` is when the financial event happened and is editable.
- `created_at` is immutable database creation time.
- `updated_at` is database-managed last modification time.
- The create form defaults occurrence time to the user's current time and clearly labels it as the transaction time.
- Backdated transactions are allowed.
- Phase 4 rejects future `occurred_at` values at the database boundary so future entries do not affect today's ledger balance before they happen. Scheduled and recurring transactions require a later design.
- Recent entries are ordered by `occurred_at DESC`, then `created_at DESC`, then UUID `id DESC` for deterministic ties.

Editing `occurred_at` may reposition a transaction in the recent list. It must never rewrite `created_at`.

## Archived-wallet behavior

- Creation selects active wallets only, and the RPC independently rejects archived wallets.
- Archiving a wallet does not delete, soft-delete, or change any historical transaction or movement.
- Existing transactions continue to contribute to an archived wallet's calculated balance unless those transactions are soft-deleted.
- An active transaction may be corrected while retaining the same wallet that became archived.
- An edit may move a transaction to an active owned wallet but not to a different archived wallet.
- Soft delete and restore remain available for historical transactions whose wallet is archived.
- The Phase 3 opening-balance editor still requires wallet restoration and remains outside ordinary transaction UI.

These rules preserve history without allowing a new posting to an archived location.

## Category decision

Phase 4 has no category table, `category_id`, default-category seed, preset list, or category UI. Description provides the minimum human meaning needed for an income or expense. Adding a nullable foreign key now would commit to ownership and lifecycle semantics assigned to Phase 8 without delivering category value.

Phase 8 will add category storage and backfill/assignment behavior through its own reviewed migration. Phase 4 records must remain valid without a category.

## Frontend architecture

Create a focused `src/features/transactions/` feature following the wallet pattern:

- strongly typed transaction models and `income | expense` union;
- transaction service interface and Supabase implementation;
- service context/provider for production and test substitution;
- centralized validation and safe error mapping;
- presentational/form components and route pages;
- focused tests with a mocked service, not live Supabase calls.

Raw Supabase queries and RPC calls stay in the service. Page components must not derive movement signs, construct multi-row writes, calculate balances, or duplicate money parsing. No global state library or form library is required.

Update the reviewed `Database` TypeScript type for the migration, view, and RPC signatures. Read money as a decimal string. RPC amounts use safe integers only after shared parser validation.

## Routes and UI scope

Add these authenticated routes beneath the existing Phase 2 boundary:

- `/app/transactions` — minimal recent list;
- `/app/transactions/new` — create form;
- `/app/transactions/:transactionId` — detail, edit, soft-delete, and restore.

Add a Transactions link to authenticated navigation. Do not add a dashboard.

### Minimal recent list

- Show the 25 most recent active Phase 4 income/expense transactions using the deterministic order.
- Provide a simple active/deleted switch; the deleted mode shows the 25 most recently occurred deleted Phase 4 records for restoration access.
- Show kind, description, wallet, occurrence time, and signed visual meaning using a positive magnitude formatted as IDR.
- Provide loading, empty, safe error, and retry states.
- Exclude opening balances and transfer rows.
- Do not add search, filters, pagination, complex date grouping, analytics, or category summaries. Those belong to Phase 6 or Phase 8.

### Create

The mobile-first accessible form includes:

- kind: income or expense;
- active wallet;
- positive whole-Rupiah amount;
- occurrence date/time defaulted to now;
- required description;
- optional notes.

Disable duplicate submission while pending, present safe field/server errors, call only the atomic create RPC, and navigate to the created transaction detail after success. If there are no active wallets, explain that a wallet must be created or restored and link to wallet management.

### Detail and edit

Show only Phase 4 fields and lifecycle state. Do not expose the opening-balance transaction or build a general ledger/history view. Editing uses the atomic update RPC. A kind change must clearly state that it changes the movement direction. A foreign or missing record uses one non-enumerating unavailable state.

### Delete and restore

Soft delete requires an intentional confirmation explaining that the record is retained but removed from active balance. A deleted detail is read-only except for restore. Restore requires an intentional action and makes the existing ledger effect active again. Neither action removes movement history.

All fields and controls must be keyboard accessible, labeled independently of color/icons, responsive at mobile and desktop widths, and expose pending/error/status changes accessibly.

## Validation

Frontend and database validation must agree on:

- kind is exactly `income` or `expense`;
- wallet UUID exists, belongs to the caller, and meets the archive rule;
- amount is a positive, non-zero whole number within the browser safe-integer boundary; database storage is `BIGINT`;
- no insufficient-funds check is performed;
- `occurred_at` is valid and no later than database now; backdating is valid;
- description trims to 1–120 characters;
- notes normalize blank to `NULL` and otherwise trim to at most 1,000 characters;
- ownership and row lifecycle are valid;
- edits leave exactly one correctly signed and role-matched movement.

Frontend checks provide feedback only. RPC validation, constraints, grants, and RLS are the actual integrity/security boundary.

## Testing strategy

Do not remove, weaken, or replace Phase 2 or Phase 3 suites. Add repository-owned Phase 4 tests.

### Database integration and security tests

Use pgTAP or the established linked-project transactional runner. The suite must roll back its fixtures and verify cleanup. Cover at least:

1. schema columns, constraints, indexes, view security mode, RLS, grants, and exact RPC signatures;
2. income creation produces one positive `income` movement and changes calculated balance by the magnitude;
3. expense creation produces one negative `expense` movement and changes calculated balance by the magnitude;
4. expense may push the calculated balance below zero;
5. zero, negative, out-of-range, invalid-kind, blank-description, overlong-text, and future-time inputs fail without partial rows;
6. a failed movement or wallet validation leaves neither a transaction nor movement;
7. another user's active wallet UUID cannot be used, and anonymous calls fail;
8. users cannot read another user's transaction/view row;
9. direct authenticated transaction/movement inserts, updates, deletes, owner changes, or arbitrary signs remain blocked;
10. every income/expense has exactly one movement; zero/multiple/wrong-role/wrong-sign/mismatched-kind shapes are rejected by database enforcement;
11. cross-owner transaction-to-wallet linkage fails structurally;
12. edit amount updates the existing movement and balance without adding a row;
13. edit wallet moves the one effect between balances atomically;
14. `income ↔ expense` edit flips role/sign atomically and preserves row identities;
15. occurred time, description, and notes edits preserve `created_at` and update `updated_at` correctly;
16. failed edits preserve the complete original transaction/movement state;
17. soft delete preserves both rows, sets `deleted_at`, and removes the effect from balance/read-active results;
18. restore clears `deleted_at`, reuses the same movement, and restores the effect exactly once;
19. foreign users cannot edit, delete, or restore a transaction;
20. creation against an archived wallet and retargeting to a different archived wallet fail;
21. same-wallet historical correction, delete, and restore remain valid after wallet archival, and the archived balance remains ledger-derived;
22. deterministic ordering is correct for equal `occurred_at` values;
23. opening-balance creation, update, exact-one, zero exception, archive, and owner isolation regressions remain green;
24. no Phase 5 transfer mutation path is exposed.

Record the actual assertion count and execution method during implementation. Never claim linked execution when only static SQL was inspected.

### Frontend and service tests

Cover at least:

- list loading, active/deleted empty states, safe error/retry, and deterministic request parameters;
- create income and expense submissions with positive magnitudes;
- correct RPC/service inputs without client-generated sign or `user_id`;
- zero, negative, decimal, malformed, and out-of-safe-range amount rejection;
- negative resulting balance is not blocked by client logic;
- wallet loading, no-active-wallet guidance, and archived wallets absent from create choices;
- occurrence-time, description, and notes validation;
- successful create navigation and pending duplicate-submit prevention;
- detail rendering and foreign/missing unavailable behavior;
- amount, wallet, text, time, and kind edits;
- manually selected kind correction remains explicit;
- soft-delete confirmation and deleted-state presentation;
- restore behavior, including an archived historical wallet;
- shared monetary parser/formatter regression tests;
- protected-route/auth regression and existing wallet-flow tests;
- production PWA configuration retains no financial/authenticated runtime cache.

Unit/component tests mock the transaction service boundary and must not use real credentials or live network calls.

## Migration and remote verification strategy

1. Create one reviewable forward migration; do not rewrite applied Phase 2/3 files.
2. Add/replace functions and views using explicit signatures and reviewed grants.
3. Add static migration checks and a transactional Phase 4 database suite while preserving all existing suites.
4. Inspect linked local/remote migration history before any push.
5. Run a linked dry run and stop if anything except the intended Phase 4 migration is pending.
6. Apply only the reviewed migration; do not reset, repair, seed, or wipe the remote project.
7. Confirm migration histories agree.
8. Run the Phase 2, Phase 3, and Phase 4 linked database suites and record exact pass/assertion/rollback results.
9. Run database lint/security review and verify no test fixtures remain.
10. Re-run frontend quality, build, PWA, secret, and documentation checks.

If remote access is unavailable, implementation may remain locally complete but Phase 4 cannot be declared ready until required database integration verification genuinely runs.

## Manual acceptance checklist

1. Sign in and open Transactions.
2. Create an income with a positive amount, description, optional notes, and chosen occurrence time.
3. Confirm exactly the expected positive balance change on the selected wallet.
4. Create an expense and confirm the expected negative balance change.
5. Enter an expense larger than the wallet balance and confirm the resulting negative balance is accepted.
6. Confirm zero, negative expense input, decimals, blank description, and future occurrence time are rejected clearly.
7. Refresh and confirm both records and balances persist.
8. Edit amount, description, notes, and occurrence time; confirm the balance and recent ordering update.
9. Move a transaction to another active wallet and confirm both wallet balances reconcile.
10. Change income to expense and back; confirm direction and balances change exactly once each time.
11. Archive a wallet with transaction history; confirm history and balance remain intact.
12. Confirm a new transaction cannot target the archived wallet.
13. Correct an existing transaction while it retains that archived wallet.
14. Soft-delete a transaction and confirm the row is available in Deleted while its balance effect disappears.
15. Restore it and confirm the same effect returns exactly once, including when its wallet is archived.
16. Confirm opening balance is not exposed as an ordinary editable income/expense record.
17. Confirm another user's valid wallet/transaction URL or identifier does not reveal or mutate data.
18. Confirm Phase 2 session persistence, sign-out, and protected-route behavior remain intact.
19. Confirm wallet management from Phase 3 remains operational.
20. Confirm PWA installability/update behavior still works and no offline financial mutation behavior is implied.

Do not mark a manual step complete unless it was actually performed against the reviewed development environment.

## Out of scope

- opening-balance editing through transaction UI;
- wallet-to-wallet transfers and transfer fees;
- categories, category defaults, and category management;
- full transaction history, search, filters, pagination, or complex date grouping;
- dashboards, analytics, reports, budgets, and saving goals;
- recurring or scheduled transactions;
- attachments, receipts, imports, and bank integration;
- hard deletion or movement deletion;
- mutable/materialized balance caches;
- multi-currency behavior;
- offline financial queues, IndexedDB financial sync, and conflict resolution;
- a separate Node/Express backend;
- a general retry/idempotency-key framework.

## Implementation sequence

1. Reconfirm the accepted main baseline, create the Phase 4 implementation branch, and run existing quality/database baselines.
2. Add the forward migration: text fields/constraints, exact-one income/expense enforcement, read view/indexes, RPCs, grants, and comments.
3. Add static migration checks and linked pgTAP coverage; verify existing Phase 2/3 suites unchanged.
4. Extend reviewed database TypeScript types and shared money validation.
5. Implement the transaction types, service, context/provider, validation, and safe errors.
6. Implement protected routes, authenticated navigation, minimal recent list, create, detail/edit, soft-delete, and restore UI.
7. Add frontend/service tests and auth/wallet regressions.
8. Run local quality gates and inspect the build/PWA output.
9. Follow the safe linked migration dry-run, push, history, lint, database-test, and cleanup sequence.
10. Complete security/secret/scope audits and update documentation with actual results.
11. Prepare the implementation branch for developer manual acceptance; do not start Phase 5.

## Acceptance criteria

Phase 4 is ready for manual acceptance only when all applicable criteria below are implemented and verified:

1. Authenticated users can create income and expense only against their own active wallets through one atomic RPC.
2. Every income/expense has exactly one persistent correctly signed/role-matched movement, enforced at the database boundary.
3. Zero ordinary movements and ambiguous user-entered signs are rejected; negative wallet balances remain allowed.
4. Creation/edit failures leave no partial or inconsistent financial rows.
5. Direct edit safely supports amount, wallet, occurrence time, description, notes, and `income ↔ expense` correction.
6. Soft delete preserves transaction/movement rows and removes their balance effect; restore reactivates that same effect exactly once.
7. Opening-balance invariants and the sole zero-movement exception remain unchanged and fully tested.
8. Archived wallets retain history/balance; new postings and retargeting to a different archived wallet are denied under the documented rules.
9. RLS, grants, owner-qualified relationships, and RPC validation block anonymous, cross-user, direct-ledger, and IDOR attempts.
10. Money remains `BIGINT`/whole-number at persistence and safe at the JavaScript boundary.
11. Transaction time semantics and deterministic ordering are implemented exactly as documented.
12. The minimal responsive UI supports create, inspect, edit, delete, restore, loading, empty, error, and unavailable states without absorbing Phase 6.
13. Categories and transfers remain absent.
14. Existing frontend and Phase 2/3 database suites remain green; new tests pass locally/linked with actual counts and rollback recorded.
15. Typecheck, lint, touched-file formatting, production build, PWA generation, security audit, secret audit, and Markdown links pass.
16. No authenticated financial response cache or offline mutation queue is introduced.
17. README and this phase document reflect actual implementation/verification status without marking Phase 5 started.

## Definition of done and completion checklist

- [ ] Phase 4 explicitly authorized for implementation
- [ ] Forward migration reviewed; no applied migration rewritten
- [ ] Transaction text constraints and exact-one income/expense shape enforced
- [ ] Create, update, soft-delete, and restore RPCs implemented and privilege-reviewed
- [ ] Security-invoker Phase 4 read model implemented
- [ ] RLS, grants, owner-qualified relationships, and IDOR defenses verified
- [ ] Shared money/time/text validation implemented at frontend and database boundaries
- [ ] Minimal transaction routes and responsive UI implemented
- [ ] Existing Phase 2/3 and new Phase 4 database suites pass with recorded linked assertion counts and rollback
- [ ] Frontend tests and all quality/build/PWA gates pass with actual results
- [ ] Secret, cache, scope, and documentation-link audits pass
- [ ] Manual acceptance completed and results recorded
- [ ] No Phase 5 transfer, Phase 6 full history/search, or Phase 8 category implementation introduced

Until every applicable item is complete and verified, Phase 4 must not be marked complete. Planning completion alone does not start implementation.
