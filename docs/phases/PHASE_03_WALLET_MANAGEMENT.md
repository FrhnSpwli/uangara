# Phase 3 — Wallet Management

## Status

`PHASE 3 READY FOR MANUAL ACCEPTANCE`

Phase 3 is implemented and has passed the automated frontend, build, security, migration, and linked database verification recorded below. The wallet journeys in [Manual acceptance](#manual-acceptance) remain pending; Phase 4 has not started.

## Objective

Establish secure, usable management of user-owned wallets and the minimum ledger backbone required to represent every wallet's opening balance correctly. A user should be able to list, create, inspect, edit, archive, and restore wallets and see a balance calculated from active ledger movements.

Phase 3 introduces only the `opening_balance` financial workflow. Ordinary income and expense begin in Phase 4; transfers begin in Phase 5.

## Prerequisites

- Phases 0, 1, and 2 are complete and accepted.
- Supabase Auth, protected routes, the `profiles` foundation, and owner-scoped RLS remain operational.
- The development database can apply versioned migrations and run repository-owned pgTAP tests.
- The implementer has read [Domain Rules](../DOMAIN_RULES.md), [Data Model](../DATA_MODEL.md), [Architecture](../ARCHITECTURE.md), and [Security](../SECURITY.md).
- Phase 3 implementation was explicitly authorized on 2026-09-01.

## Locked decisions

These decisions are not open during Phase 3:

| Concern | Decision |
| --- | --- |
| Monetary representation | Whole integer units; persisted monetary columns use PostgreSQL `BIGINT`, never floating point |
| Product currency scope | Initially Indonesian Rupiah-oriented; no multi-currency behavior |
| Opening balance | Special transaction with kind `opening_balance` and one corresponding wallet movement |
| Zero opening balance | Still creates the opening transaction and its single zero-valued movement |
| Zero movement rule | Zero is prohibited except for that single active opening-balance movement |
| Negative balance | Valid, including a negative opening balance |
| Transaction edit | Direct update with every affected row updated atomically |
| Transaction deletion | Soft delete; physical deletion is not the financial lifecycle |
| Financial event time | `occurred_at` |
| Row creation time | `created_at` |
| Row modification time | `updated_at` |
| Wallet removal | Archive with `archived_at`; no hard deletion in Phase 3 |

Wallet names are user-controlled and need not be globally or per-user unique. Financial institution names are data, not hardcoded wallet identities.

## Architecture decisions

### 1. Zero opening balances

Yes. Creating any wallet produces exactly one active `opening_balance` transaction and exactly one corresponding movement, even when the opening amount is zero. This uniform lifecycle avoids an optional or missing opening record. Every ordinary income, expense, transfer, fee, and other future movement remains non-zero.

### 2. Exactly one active opening balance

The planned database enforcement is layered:

- an opening-balance movement carries an explicit `opening_balance` role;
- partial unique indexes allow at most one opening-balance movement per wallet and at most one such movement per transaction;
- a deferred database constraint trigger validates at transaction commit that each wallet has exactly one opening-balance transaction/movement pair, the referenced transaction has kind `opening_balance`, and the pair is not soft-deleted;
- an opening-balance transaction cannot be soft-deleted in Phase 3; wallet archival is its lifecycle mechanism;
- the wallet-creation and opening-balance-update RPCs preserve the invariant, while direct client writes to `transactions` and `wallet_movements` are denied.

This deliberately enforces one opening-balance pair for the lifetime of a wallet, which is stronger than merely preventing two active pairs. Replacing the pair is outside Phase 3.

### 3. Cross-user movement linkage

`wallets`, `transactions`, and `wallet_movements` carry `user_id`. Wallets and transactions expose composite unique keys on `(id, user_id)`. Each movement uses composite foreign keys `(wallet_id, user_id)` and `(transaction_id, user_id)` to the corresponding owner-qualified keys. A movement therefore cannot reference a wallet or transaction owned by a different user, even through a direct database request. RLS and RPC ownership checks provide additional, independent enforcement.

### 4. Balance query

Phase 3 uses a database-side, security-invoker aggregation view. It sums movements joined to transactions where `deleted_at IS NULL`, relies on underlying owner RLS, and is granted for authenticated reads only. It is not a materialized view or mutable cache.

PostgreSQL aggregation remains exact. The balance should cross the Supabase/browser boundary as a decimal integer string and be handled through a dedicated monetary adapter so JavaScript does not coerce large values to floating point. Formatting belongs to the presentation layer; persisted data remains `BIGINT`.

### 5. Direct writes versus RPC-only writes

- Wallet creation is RPC-only because it also creates the opening transaction and movement.
- Opening-balance edits are RPC-only because the transaction/movement pair must remain atomic and consistent.
- Archive and restore use narrow owner-validating functions so `archived_at` is set from database time or cleared deliberately.
- Direct authenticated inserts, updates, or deletes on `transactions` and `wallet_movements` are not granted.
- Owner-scoped updates to wallet `name`, `type`, and `institution` may be direct, protected by RLS, constraints, and column-level grants. Ownership, archive state, and database-managed timestamp columns are not directly client-writable.
- Financial-table reads are owner-scoped. Hard delete is not granted on any Phase 3 financial table.

### 6. Archival and history

Archiving sets `wallets.archived_at` and removes the wallet from the default active list. It does not delete or soft-delete the opening transaction, remove movements, reset balance, or alter historical calculations. Archived wallets remain owner-readable, retain a calculated balance, and can be restored by clearing `archived_at`. Phase 3 requires restore before further metadata or opening-balance edits. Hard deletion and future rules for posting new transactions to archived wallets remain outside this phase.

## Proposed schema responsibilities

This section defines the shape a future migration must implement; it is not SQL.

### `wallets`

Purpose: represent a user-owned location where money exists.

Planned fields and constraints:

- UUID primary identifier;
- `user_id` owned by and linked to the authenticated user;
- trimmed `name`, 1–100 characters;
- text `type` constrained to `bank`, `e_wallet`, `cash`, or `other`, without a PostgreSQL enum;
- nullable, trimmed `institution`, at most 100 characters;
- nullable `archived_at` timestamp;
- database-managed `created_at` and `updated_at` timestamps;
- no uniqueness constraint on wallet names;
- no mutable `balance`, opening-balance amount, credentials, account number, card number, budget, category, or transfer field.

### `transactions`

Purpose: provide stable shared metadata for ledger events while exposing only opening-balance behavior in Phase 3.

Minimum planned fields:

- UUID primary identifier;
- owner `user_id`;
- text kind capable of `opening_balance`, `income`, `expense`, and `transfer`, constrained without a PostgreSQL enum;
- `occurred_at` for financial occurrence time;
- database-managed `created_at` and `updated_at`;
- nullable `deleted_at` for the locked soft-delete lifecycle.

Only `opening_balance` may be created through Phase 3 application behavior. Category, note, fee-linkage, transfer, and ordinary transaction fields are deferred until the owning phases. An opening-balance transaction remains active and cannot set `deleted_at` in Phase 3.

### `wallet_movements`

Purpose: store the signed effect of a transaction on one wallet.

Minimum planned fields:

- UUID primary identifier;
- owner `user_id`;
- `transaction_id` and `wallet_id` participating in owner-qualified composite foreign keys;
- signed monetary `amount` stored as PostgreSQL `BIGINT`;
- a text movement role sufficient to identify `opening_balance` without a rigid PostgreSQL enum;
- database-managed `created_at` and `updated_at`.

The amount check permits zero only when the movement role is `opening_balance`; the deferred cross-table invariant then proves that role belongs to the wallet's one active `opening_balance` transaction. All other movement roles require a non-zero amount.

## Wallet lifecycle

### Create

An authenticated user supplies a name, type, optional institution, and opening amount defaulting to zero. One database function creates the wallet, its opening transaction, and its movement in one transaction. The function derives `user_id` from `auth.uid()` and returns an owner-safe result. Any failure rolls back all three rows.

### Read

The default wallet list returns active wallets only. A separate archived view/filter exposes recoverable archived wallets. Wallet detail is owner-only and includes metadata, archive state, opening information, and the calculated balance, but not a general transaction-history experience.

### Edit

Metadata edits update only approved wallet columns. Opening-balance edits call the dedicated atomic function, directly update the existing movement, preserve the single pair, and update database-managed modification timestamps. Phase 3 preserves the original `occurred_at`; UI editing of the historical occurrence time is deferred.

### Archive and restore

Archival records server-consistent lifecycle time in `archived_at`; restoration clears it. Narrow functions derive the caller, validate ownership, and perform each transition. Both actions require deliberate UI confirmation. The wallet and its ledger rows remain intact. Archived wallets must be restored before Phase 3 permits other edits.

## Opening-balance lifecycle

1. Wallet creation defaults the opening input to `0` and defaults `occurred_at` to the current database time.
2. The creation RPC inserts one wallet, one active `opening_balance` transaction, and one movement with the signed amount.
3. Zero and negative opening amounts are valid; zero uses the documented narrow exception.
4. The balance view includes this movement like every other movement from an active transaction.
5. An edit RPC updates the existing movement rather than inserting a replacement and preserves the transaction's `occurred_at` in Phase 3.
6. The opening transaction and movement cannot be independently deleted, duplicated, reassigned, or soft-deleted.
7. Wallet archival does not change the opening pair.

## Atomicity requirements

The following operations must execute in one PostgreSQL transaction:

- wallet + opening transaction + opening movement creation;
- opening amount update and all related modification metadata;
- any future operation that would touch more than one financial row.

The browser must not issue a sequence of unrelated inserts or multi-row financial updates. A rejected input, ownership failure, constraint failure, or intermediate write failure must leave no partial wallet or ledger state.

## RLS and security requirements

- Enable RLS in the creating migration for `wallets`, `transactions`, and `wallet_movements`.
- Anonymous access is denied.
- Authenticated users can select only rows with their own `user_id`.
- Direct wallet metadata updates require both `USING` and `WITH CHECK` conditions for ownership and active (`archived_at IS NULL`) state, plus restricted column grants. The opening-balance update function applies the same active-wallet rule; archive/restore functions independently validate ownership and the requested lifecycle transition.
- Client insert/update/delete grants on `transactions` and `wallet_movements` are absent; ledger mutation occurs only through approved functions.
- Wallet creation cannot accept or trust a client-supplied owner identifier.
- Composite ownership foreign keys prevent cross-user wallet/transaction linkage independently of RLS.
- Route protection is a navigation aid and must never be treated as authorization.
- No service-role key, database password, or privileged credential enters the frontend.
- No PWA runtime cache may store Supabase, authenticated, wallet, balance, transaction, or movement responses.

Any planned `SECURITY DEFINER` function must pin a safe `search_path`, schema-qualify referenced objects, require a non-null `auth.uid()`, validate ownership and every input, use minimum privileges, revoke default/public execution, and grant execution only to the intended authenticated role. Database tests must verify that direct REST-style mutations cannot bypass the functions.

## Balance calculation

The source-of-truth equation is:

```text
wallet balance = SUM(wallet movements from transactions where deleted_at IS NULL)
```

The opening movement participates naturally. Movements belonging to soft-deleted transactions are excluded. Wallet archival does not make a transaction inactive and therefore does not change the result. Empty aggregation must produce zero, although the exact-one opening invariant means a valid wallet normally has at least its opening movement.

Negative results are valid. For example:

```text
opening movement       +1,000,000
future active movement -1,200,000
calculated balance       -200,000
```

The Phase 3 implementation must not add a mutable balance column, client-side balance source of truth, materialized view, or cache. The owner-safe aggregation view should expose only the caller's wallets and active ledger effects.

## Proposed UI scope

The experience is mobile-first and lives inside the authenticated application shell. Pages use feature/service boundaries rather than calling Supabase throughout presentation components.

### Wallet list

- Show active wallets by default.
- For each wallet show name, type, optional institution, and calculated balance.
- Provide clear loading, error, empty, and retry states without fabricated financial data.
- Provide an explicit way to view archived wallets without mixing them into the default list.
- Do not add dashboard totals or analytics.

### Add wallet

- Inputs: name, type, optional institution, and opening balance.
- Default opening balance to `0`.
- Offer `bank`, `e_wallet`, `cash`, and `other`; do not hardcode institution names as mandatory choices.
- Disable duplicate submission while the atomic create request is pending.
- Present safe field and request errors without exposing database internals.

### Wallet detail and edit

- Show wallet identity, metadata, calculated balance, opening amount, and archive state.
- Permit owner-scoped metadata editing.
- Permit opening amount editing only through the atomic operation.
- Keep opening occurrence-time editing out of the initial UI; display it if useful but preserve it on amount edits.
- Do not build full transaction history.

### Archive and restore

- Require an intentional confirmation before archival.
- Remove an archived wallet from the active default list after success.
- Keep it discoverable in the archived view and provide a restore action.
- Require restoration before other Phase 3 edits.

## Routing

Use authenticated routes consistent with the existing router:

- `/app/wallets` — active wallet list with access to archived wallets;
- `/app/wallets/new` — add-wallet form;
- `/app/wallets/:walletId` — owner-safe detail and edit experience.

Avoid extra routes unless implementation reveals a clear usability need. An unavailable, archived-in-an-incompatible-context, or non-owned identifier must produce a safe state without revealing whether another user's wallet exists. Phase 2 session restoration must complete before protected wallet data is requested.

## Validation

Validate for usability in TypeScript and repeat integrity-critical rules in PostgreSQL:

- trim wallet names and require 1–100 characters;
- accept only `bank`, `e_wallet`, `cash`, or `other` for wallet type;
- normalize a blank institution to `null`; otherwise trim and limit it to 100 characters;
- treat the opening amount as a base-10 whole-number string, rejecting fractions, exponent notation, `NaN`, infinity, and unsafe coercion;
- constrain browser-entered amounts to JavaScript's safe-integer range, while sending an exact integer representation to PostgreSQL `BIGINT`;
- permit positive, zero, and negative opening amounts;
- reject zero for every non-opening movement at the database boundary;
- derive and revalidate ownership in the database rather than trusting route parameters or client fields;
- reject archived-wallet edits until the wallet is restored.

No form or schema-validation package should be installed automatically. Prefer small typed validation until a demonstrated requirement justifies another dependency.

## Testing strategy

### Frontend tests

Use mocked service boundaries, never live credentials, to cover at minimum:

- active wallet list rendering and calculated balance presentation;
- loading, request-error, and empty-wallet states;
- access to the archived-wallet view;
- add-wallet validation, including the zero default and acceptance of a negative opening amount;
- successful atomic create flow and duplicate-submit prevention;
- metadata and opening-balance edit flows calling their correct boundaries;
- archive confirmation, active-list removal, archived recovery, and restore;
- a non-owned or unavailable wallet response handled without data leakage;
- preserved Phase 2 protected-route and session-loading behavior.

### Database integration and security tests

Add repository-owned pgTAP tests, executed against a clean compatible database and the approved remote development project where required. Tests must use an anonymous role and at least two distinct authenticated users and cover:

- RLS enabled on wallets, transactions, movements, and the balance view's underlying tables;
- anonymous denial and owner-only reads;
- cross-user wallet, transaction, and movement denial;
- database rejection of a movement linking user A's transaction to user B's wallet;
- direct client financial-table writes denied by grants/policies;
- atomic wallet creation and complete rollback on an induced failure;
- exactly one active opening transaction and one corresponding movement per wallet;
- zero opening balance creation succeeds and produces the one allowed zero movement;
- zero ordinary movements are rejected;
- negative opening balance creation succeeds;
- opening-balance update changes the existing movement without duplication;
- ownership and `occurred_at` remain correct during opening edits;
- archival preserves ledger rows and balance while default active queries exclude the wallet;
- restoration returns the same wallet and history;
- soft-deleted non-opening test transactions are excluded from active balance aggregation;
- positive, zero, and negative balance calculations are exact;
- balance results and archived data remain owner-scoped;
- function search path, execution grants, caller checks, and ownership validation meet the security contract.

Static SQL review and mocked frontend tests do not replace database integration tests. Do not weaken RLS or constraints merely to make a test pass.

### Repository quality gates

Run and report the actual results of:

- dependency installation/state review;
- TypeScript type checking;
- ESLint;
- formatting check;
- frontend tests with counts;
- database migration clean-apply and pgTAP tests with assertion counts;
- production build and PWA artifact generation;
- secret, bundle, grant, RLS, and service-worker cache review.

## Manual acceptance

Complete and record all of the following against the approved development environment:

1. Sign in.
2. Create a wallet with a positive opening balance.
3. Confirm its displayed calculated balance.
4. Create a wallet with a zero opening balance and confirm it succeeds.
5. Create or edit a wallet to a negative opening balance and confirm the negative balance is displayed.
6. Refresh and confirm all wallet data persists.
7. Edit wallet name, type, and optional institution.
8. Edit the opening balance and verify the calculated balance updates without creating a duplicate opening record.
9. Archive a wallet through the intentional confirmation.
10. Confirm it disappears from the default active list.
11. Confirm the archived wallet remains recoverable with its balance/history intact.
12. Restore the wallet and confirm it returns to the active list.
13. Confirm another user's wallet cannot be read or modified through UI or direct API attempts.
14. Confirm Phase 2 session persistence, protected routing, and sign-out behavior remain intact.
15. Confirm manifest, service worker, and installable PWA behavior continue to work without caching authenticated wallet data.

## Out of scope

- ordinary income transaction creation;
- ordinary expense transaction creation;
- wallet-to-wallet transfers and transfer fees;
- categories;
- transaction history, search, and correction experience beyond the opening amount;
- dashboard totals or analytics;
- reports, budgets, or recurring transactions;
- bank integration, credentials, account synchronization, or card data;
- offline financial storage, queues, synchronization, or conflict resolution;
- mutable or cached wallet balance as a source of truth;
- hard deletion of wallets or financial history;
- multi-currency behavior;
- general transaction RPC/idempotency design belonging to later phases;
- Phase 4 or later feature modules.

## Implementation sequence

1. Reconfirm this contract and review the target PostgreSQL/Supabase capabilities, especially security-invoker views and deferred constraint triggers.
2. Design one versioned migration containing the three tables, ownership keys, constraints, indexes, timestamps, RLS, grants, aggregation view, and narrowly scoped functions. Review it before remote application.
3. Add pgTAP coverage for atomicity, exact-one opening state, the zero exception, balance calculation, grants, RLS, and cross-owner linkage. Prove a clean migration apply locally or through the approved safe alternative.
4. Update the reproducible database TypeScript types and add a focused wallet service plus exact monetary boundary helpers.
5. Add authenticated wallet routes, responsive screens, forms, and loading/error/empty states through the feature boundary.
6. Add frontend behavior tests and preserve the Phase 2 auth test suite.
7. Run all repository, database, security, PWA, and manual acceptance checks; record only actual results.
8. Update README and phase status only after the implementation and acceptance criteria genuinely pass.

Do not begin Phase 4 while completing this sequence.

## Acceptance criteria

1. A signed-in user can create a wallet with user-controlled metadata and positive, zero, or negative opening balance.
2. Creation atomically produces one wallet, one active `opening_balance` transaction, and one corresponding movement, or produces none on failure.
3. Every valid wallet has exactly one opening pair; duplicate, missing, mismatched, or soft-deleted opening state is rejected by the database.
4. Zero is accepted only for the single opening movement and rejected for every ordinary movement.
5. All persisted monetary amounts use `BIGINT`; frontend input and output avoid floating-point monetary arithmetic.
6. Active wallet lists and owner-safe detail views show exact balances derived only from movements of active transactions.
7. Negative calculated balances are accepted and displayed.
8. Wallet metadata can be edited without exposing immutable ownership or database-managed fields.
9. Opening amount edits update the existing pair atomically and do not change its occurrence time or create orphaned movements.
10. Wallets can be archived and restored; archival changes default visibility but not balance or ledger history.
11. No Phase 3 path physically deletes financial history.
12. Anonymous and cross-user reads and writes are denied at the database boundary for every Phase 3 table and aggregate.
13. Composite database constraints reject cross-user movement linkage independently of frontend validation.
14. Direct client mutation of transactions and movements is denied; approved financial writes use least-privilege RPCs.
15. Protected route/session behavior from Phase 2 remains correct and does not flash or request wallet data before restoration.
16. Automated frontend and database tests pass, including atomic rollback, RLS, grants, zero/negative openings, archival, and balances.
17. Type checking, lint, formatting, production build, and PWA generation pass.
18. No service-role credential, database password, real secret, access token, or authenticated financial response cache is introduced.
19. Manual acceptance passes and its exact results are recorded.
20. No Phase 4 income/expense workflow, Phase 5 transfer behavior, or other later feature is implemented.

## Completion checklist

- [x] Phase 3 has been explicitly authorized for implementation
- [x] Migration reviewed and reproducibly applied
- [x] Wallet, minimal transaction, and movement ownership constraints implemented
- [x] Exact-one opening pair and narrow zero exception enforced by the database
- [x] Create-wallet, edit-opening-balance, archive, and restore functions implemented and privilege-reviewed
- [x] RLS, column grants, composite ownership keys, and cross-user rejection verified
- [x] Security-invoker active-balance aggregation implemented and tested
- [x] Wallet list, create, detail, edit, archive, and restore experiences implemented
- [x] Frontend and pgTAP suites pass with actual counts recorded
- [x] Typecheck, lint, formatting, build, and PWA checks pass
- [ ] Manual acceptance completed
- [x] Documentation updated to reflect actual implementation
- [x] Absence of Phase 4+ implementation confirmed

Until every applicable item is complete and verified, Phase 3 must not be marked complete.

## Implementation record

The Phase 3 implementation uses migration `20260901000000_create_wallet_ledger.sql`. It adds owner-qualified `wallets`, `transactions`, and `wallet_movements` tables; deferred exact-one opening-pair constraints; owner-scoped RLS and column grants; security-invoker balance/opening-balance views; and authenticated, narrowly granted functions for atomic wallet creation, opening-balance updates, archival, and restoration.

The browser uses a typed wallet service rather than page-level Supabase calls. PostgreSQL `BIGINT` money crosses the service boundary as decimal strings, is validated with `bigint`, and is converted to `number` only after a JavaScript safe-integer check for the RPC input boundary. The authenticated router exposes `/app/wallets`, `/app/wallets/new`, and `/app/wallets/:walletId`.

## Verification record

Verified on 2026-09-01:

- TypeScript type checking passed.
- ESLint passed.
- Prettier checking passed for every Phase 3 touched TypeScript/TSX file; unchanged baseline documentation formatting was not rewritten.
- Vitest passed: 7 test files, 39 tests.
- The production build passed; `vite-plugin-pwa` generated the service worker with 12 precache entries.
- Linked migration history was inspected before and after deployment. The dry run contained only `20260901000000_create_wallet_ledger.sql`, the migration applied successfully, and local/remote histories agree.
- Linked database linting reported no schema errors.
- The repository-owned linked pgTAP suite passed 75 of 75 assertions. Its transaction rolled back, and a follow-up query confirmed zero retained Phase 3 test users, profiles, and wallets.
- Wallet/ledger RLS, anonymous denial, owner isolation, cross-owner relational rejection, exact-one opening state, atomic rollback, the narrow zero exception, negative openings, active balance calculation, opening updates, and archive/restore preservation were exercised remotely.

Manual acceptance is intentionally not recorded as passed. The development build is prepared for a developer to sign in and verify positive, zero, and negative openings; refresh persistence; metadata and opening-balance edits; archive visibility; restore; Phase 2 auth regression behavior; and PWA installability. Phase 4 remains unstarted.
