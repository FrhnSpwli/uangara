# Phase 5 — Wallet-to-Wallet Transfers

> **Status:** Implementation and automated/linked database verification complete. Manual acceptance is pending. `PHASE 5 READY FOR MANUAL ACCEPTANCE`.

## Objective

Add first-class transfers between wallets owned by the same user without classifying the transferred principal as income or expense. A transfer must be an atomic ledger event that can be created, directly edited, soft-deleted, restored, and read through the existing authenticated application without weakening Phase 3 or Phase 4 invariants.

An optional transfer fee is part of the Phase 5 design. It reduces wealth, while the transfer principal remains wealth-neutral.

## Accepted baseline

Phase 0 through Phase 4 are complete and accepted. The actual Phase 4 implementation provides the following reusable foundation:

- `public.wallets` is user-owned, has `archived_at`, and has no mutable balance column.
- `public.transactions` already permits the kinds `opening_balance`, `income`, `expense`, and `transfer`; it has `occurred_at`, `created_at`, `updated_at`, and nullable `deleted_at`.
- `public.wallet_movements` stores signed `BIGINT` amounts, a `movement_role`, and owner-qualified composite foreign keys to both its transaction and wallet. A movement cannot link a user's transaction to another user's wallet.
- `public.wallet_balances` is a security-invoker view that sums movements only when the owning transaction is active. Archived wallets retain their balance and history.
- Opening balances have dedicated deferred invariants and remain the only permitted zero-value movement.
- Income and expense use exact-one-movement deferred invariants, security-invoker reads, and RPC-only financial writes. Their RPCs are `SECURITY DEFINER`, use `SET search_path = ''`, derive the caller from `auth.uid()`, and have narrow `authenticated` execution grants.
- Phase 4 reads up to 25 active or deleted income/expense events, ordered by `occurred_at DESC`, `created_at DESC`, then transaction ID descending. It does not implement full history/search.
- The monetary adapter accepts only safe JavaScript whole-number inputs, transports stored `BIGINT` values as strings, and formats them with `bigint`. The PWA has no authenticated runtime cache (`runtimeCaching: []`).

Phase 5 extends these structures through a new forward-only migration. Previously deployed migrations remain immutable.

## Locked decisions and scope

The global Uangara rules remain binding:

- persisted money is whole integer value; PostgreSQL monetary columns are `BIGINT`;
- negative wallet balances are allowed;
- `occurred_at` is the financial event time; `created_at` and `updated_at` retain their database lifecycle meanings;
- transaction edits use direct-update semantics;
- deletion uses soft deletion and restore reuses existing ledger rows;
- wallet balance is ledger-derived from active transaction movements;
- transfer principal is never income or expense;
- compound financial writes are atomic at the database layer;
- an ordinary movement must be non-zero; the sole zero exception is the opening-balance movement.

Phase 5 includes only transfers and their optional fees. It does not add categories, a full history/search experience, dashboards, reports, recurring transactions, bank integration, multi-currency, offline financial synchronization, or wallet-screen visual redesign.

## Transfer ledger shape

### Principal

An active transfer always has exactly one `transactions` row with `kind = 'transfer'` and exactly two principal movements:

| Role | Wallet | Signed amount |
| --- | --- | ---: |
| `transfer_source` | source wallet | `-principal_amount` |
| `transfer_destination` | destination wallet | `+principal_amount` |

The two principal magnitudes must be equal and the source and destination wallet IDs must differ. Their sum is zero, so the principal does not change total user wealth and must not enter income or expense totals.

### Fee decision

**Chosen representation: one transfer transaction with an optional third `transfer_fee` movement.** When a fee is greater than zero, it is a negative movement against the source wallet:

| Role | Wallet | Signed amount |
| --- | --- | ---: |
| `transfer_source` | source wallet | `-principal_amount` |
| `transfer_destination` | destination wallet | `+principal_amount` |
| `transfer_fee` | source wallet | `-fee_amount` |

For example, a Rp500,000 Mandiri-to-GoPay transfer with a Rp1,000 fee has movements `Mandiri -500000`, `GoPay +500000`, and `Mandiri -1000`. The total wealth impact is `-1000`; the principal impact is exactly zero.

A fee of zero creates **no** `transfer_fee` row, because zero-valued ordinary movements are prohibited. A fee is always paid by the source wallet in Phase 5; there is no separate fee-wallet selector.

This option is preferred over a linked expense transaction because it records one real-world transfer event atomically, avoids a second lifecycle to edit/delete/restore, requires no transaction-link relationship, and keeps the fee auditable beside its principal movements. The fee is explicitly **expense-like**, not an ordinary `expense` transaction. Future reporting must count the active `transfer_fee` magnitude as expense while excluding `transfer_source` and `transfer_destination` from both income and expense totals. Phase 8 may add category assignment to that fee component only; Phase 5 adds no category field or category table.

### Enforceable shape

The Phase 5 migration must add transfer-specific database enforcement without weakening the existing opening or income/expense enforcement:

- a partial unique index for each transfer role per transaction (`transfer_source`, `transfer_destination`, and `transfer_fee`);
- a deferred transfer invariant trigger on `transactions` and `wallet_movements`;
- exactly one source and exactly one destination movement for every transfer transaction, both non-zero and with required signs;
- zero or one fee movement; if present, it is negative, non-zero, and belongs to the source wallet;
- no other movement role may occur on a transfer transaction, and transfer roles may not occur on another transaction kind;
- the source and destination wallet IDs differ;
- the absolute source principal equals the destination principal;
- the total movement count is two when fee is absent and three when it is present;
- deleted transfers retain the same stored valid shape. Deletion changes active-balance inclusion, not ledger cardinality.

The existing composite `(transaction_id, user_id)` and `(wallet_id, user_id)` foreign keys remain mandatory. They structurally prohibit mixed-owner movement links; RLS alone is not sufficient.

## Create semantics

The implementation will add one unified RPC named `create_transfer` unless a migration-time PostgreSQL signature conflict requires a clearly documented equivalent.

Conceptual parameters:

```text
p_source_wallet_id uuid
p_destination_wallet_id uuid
p_amount bigint
p_fee bigint default 0
p_occurred_at timestamptz
p_description text
p_notes text default null
p_idempotency_key uuid
```

The function must derive `user_id` from `auth.uid()` and must never accept a client-supplied owner ID. It must validate, in the database:

- authenticated caller exists;
- source and destination are different, owned by the caller, and active;
- principal amount is positive and non-zero;
- fee is zero or positive (negative fees are invalid);
- values are valid `BIGINT` inputs and are not transformed through floating point;
- `occurred_at` is not future-dated; backdating is allowed;
- description is trimmed and required (1–120 characters); notes are optional and trimmed to the existing 1,000-character limit when present;
- the constructed movement shape satisfies the transfer invariant.

It inserts the transaction, two principal movements, and the optional fee movement in one PostgreSQL transaction. A failed source, destination, fee, or validation check must leave no partial transaction or movement.

## Idempotency decision

Phase 5 **will introduce transfer-create idempotency**. A duplicate transfer is a material financial risk when the browser loses a response after the database commits or an application retry occurs. UI pending-state protection is useful but cannot resolve an ambiguous network outcome.

The planned forward migration adds a nullable transaction request key (for example, `idempotency_key uuid`) and a partial unique index scoped to a user's transfer transactions. `create_transfer` receives a client-generated UUID. A retry with the same key and semantically identical transfer payload returns the existing owned transfer ID; reuse of the key with different source, destination, amount, fee, time, description, or notes is rejected. The frontend creates one key for a submission attempt and retains it for a safe retry until that attempt reaches a known terminal result.

This is deliberately limited to transfer creation. Edit/delete/restore do not add a new general operation-log system in Phase 5; their locked rows and state checks ensure repeated successful calls do not create additional movement effects. Broader idempotency and recovery policy remains Phase 11 hardening work.

## Direct edit semantics

Phase 5 will add `update_transfer`. It may change:

- principal amount;
- source wallet;
- destination wallet;
- fee amount;
- `occurred_at`;
- description;
- notes.

It must lock the owned active transfer and its existing movements, validate the complete intended shape, then update the same transaction and the existing principal movement rows atomically. A fee edit must update the existing fee movement, create it when changing from zero to positive, or remove that **fee movement only** when changing from positive to zero. It must never create a second source or destination movement or leave stale fee impact.

Changing source/destination is a retargeting operation, so all new target wallets must be active and owned by the caller. A principal sign is always derived by role; changing a transfer into income or expense is not allowed. Ordinary income/expense edit RPCs must reject transfer IDs, and transfer RPCs must reject opening-balance and income/expense IDs.

For concurrent wallet-pair edits or creates, the RPC must lock the two involved wallet rows in a deterministic ID order, in addition to locking the affected transfer/movement rows during edit. This avoids avoidable opposite-direction lock-order races without introducing a balance/overdraft lock policy.

## Archive, delete, and restore

### Archived wallets

- New transfers require **both** source and destination wallets to be active.
- An edit may retain an existing archived source or destination as historical correction, but may not retarget either side to a different archived wallet.
- An edit may move an archived historical endpoint to an active owned wallet.
- Restoring a deleted transfer reuses its existing endpoints even when either was archived later; restoration is historical reactivation, not new wallet activity.

These rules match Phase 4's historical behavior and preserve records without opening archived wallets to new activity.

### Soft delete

`soft_delete_transfer` must set `deleted_at` on the owned active transfer. It preserves the transaction and every stored movement, including a fee movement. Because `wallet_balances` includes only movements whose transaction is active, source, destination, and fee impacts all disappear together. Repeated delete attempts are rejected without an extra financial effect.

### Restore

`restore_transfer` clears `deleted_at` only for an owned deleted transfer. It must reuse the original two or three movement rows and reactivate each impact exactly once. It does not create replacement movements, does not require the endpoints to be currently active, and rejects repeated restore attempts without double counting.

## Read-model and ordering compatibility

Phase 6 retains ownership of complete history, filtering, search, pagination, and analytics. Phase 5 adds only enough read model to create, inspect, edit, delete, and restore transfers alongside the current recent transaction list.

The migration should introduce one owner-safe, `security_invoker = true` unified event view (recommended name: `transaction_feed`). It returns one row per income, expense, or transfer event and excludes opening balances. For income/expense, it exposes the existing wallet and positive display magnitude. For transfers, it exposes source and destination wallet identifiers/names/archive state, positive principal magnitude, and fee magnitude (`0` when no fee exists). It includes `kind`, description, notes, occurrence/lifecycle timestamps, and deleted state.

The view must preserve the existing deterministic order when queried:

```text
occurred_at DESC, created_at DESC, transaction_id DESC
```

The existing `income_expense_transactions` view may remain as a compatible specialised read model. The frontend may migrate its limited 25-event active/deleted list to `transaction_feed`; this is not a Phase 6 history feature.

## Reporting semantics

Future reporting must use ledger semantics, not display labels:

- active `income` movement is income;
- active `expense` movement is expense;
- `transfer_source` and `transfer_destination` are never income or expense;
- active `transfer_fee` is expense-like and contributes its absolute magnitude to expense/wealth-decrease totals;
- soft-deleted transfer rows and all their movements contribute to neither active balances nor reports.

This prevents transfer principal from being double-counted while retaining fees as genuine outflows. Categories remain deferred and do not attach to transfer principal in Phase 5.

## Security, RLS, and mutation boundary

RLS remains enabled on `wallets`, `transactions`, and `wallet_movements`. Authenticated users may read only their own permitted data; anonymous users have no access. Existing owner-scoped read policies and owner-qualified foreign keys remain in force.

Transfers must use RPC-only financial mutation. The phase must not grant direct client insert/update/delete privileges on `transactions` or `wallet_movements`, because doing so could bypass sign derivation, exact cardinality, archive eligibility, idempotency, and ownership validation.

Each transfer RPC must:

- be `SECURITY DEFINER` only where required by the established write boundary;
- set `search_path = ''` and qualify referenced objects;
- obtain the caller from `auth.uid()` and reject null callers;
- lock and validate all referenced owned rows;
- never trust a client `user_id`;
- revoke default `PUBLIC`/`anon`/broad execution and grant execute only to `authenticated`;
- return safe errors through the frontend service boundary without exposing internal data.

Valid UUIDs belonging to a second user are mandatory IDOR test inputs. A user must not be able to source from, send to, read, edit, delete, or restore another user's transfer.

## Frontend scope

Add a focused `src/features/transfers/` boundary consistent with the wallet and income/expense feature layout. It owns typed transfer models, service/RPC calls, form validation, and transfer-specific UI. It must reuse `src/utils/money.ts`; no component may introduce float-based money parsing.

Suggested protected routes:

```text
/app/transfers/new
/app/transfers/:transferId
```

The existing `/app/transactions` minimal list should show transfer events through the unified read model and route a transfer event to its detail/edit view. No dedicated transfer-history screen, advanced search, filters, pagination system, or analytics is part of this phase.

### Create and edit UI

The mobile-first form must clearly show direction:

```text
Source wallet  →  Destination wallet
Transfer amount
Optional admin fee (paid by source wallet)
Occurred at
Description
Optional notes
```

Both selectors expose active wallets only for a new target. The same wallet cannot be selected on both sides. Principal is required, positive, and whole-number; fee is optional, whole-number, and zero or positive. The form must not reject a transfer merely because the source will become negative. It must display loading, validation, success, and safe error states accessibly.

The detail screen presents principal direction, fee separately, the combined source decrease when a fee exists, lifecycle state, and approved edit/delete/restore actions. It must not present a transfer as an income or expense. Deleted transfers need only be visible through the existing minimal recovery mode.

## Migration plan

Implementation uses a new forward-only Supabase migration. It must not edit the Phase 2–4 migrations. The migration is expected to:

1. add transfer-specific constraint indexes and deferred validation triggers;
2. add the transfer-create idempotency key and scoped uniqueness;
3. extend transaction description validation to transfers;
4. add the owner-safe unified feed view;
5. add, lock down, and document transfer RPCs; and
6. regenerate the repository TypeScript database types through the established reviewed workflow.

Before any linked remote change: inspect migration history, run a dry run, confirm that only the Phase 5 migration is pending, push without reset/repair, verify history, run database lint, then run transactional linked database tests. No remote reset, destructive schema rewrite, or RLS weakening is permitted.

## Test strategy

### Database tests

Keep every Phase 2–4 test and add a transactional Phase 5 suite that verifies:

- normal transfer creates one transaction, exactly two principal movements, correct signs/equal magnitudes, and no wealth change;
- a fee creates exactly one negative source fee movement and decreases wealth/balance only by the fee;
- zero/negative principal, negative fee, future time, same-wallet endpoints, and malformed description/notes are rejected;
- an allowed transfer may make its source balance negative;
- foreign source and destination UUIDs are rejected; cross-user reads, edit, delete, and restore are blocked;
- a failed destination, fee, or validation operation leaves no partial transaction or orphan movement;
- edit changes amount, source, destination, time, description, notes, and fee while retaining one source/one destination and at most one fee movement;
- delete preserves all rows but removes both principal and fee effects from active balances; restore reuses those same rows and restores each impact once;
- archived wallets are rejected for new endpoints and new retargets, while historical correction/restore follows the archive rules above;
- transfer create idempotency returns the same owned transfer for an identical retry and rejects key reuse with a different payload;
- direct ledger writes remain denied; transfer shape probes fail at constraints; opening-balance and income/expense invariants remain valid;
- the unified feed applies owner visibility and deterministic ordering; transfer principal is excluded from income/expense semantics and the fee is present as expense-like;
- all test data is rolled back.

### Frontend tests

Add focused mocked-service tests for:

- source/destination selection and same-wallet prevention;
- positive whole-number amount and optional fee validation;
- safe monetary parsing and precision regression;
- active-wallet-only creation choices and archived historical detail behavior;
- successful transfer creation, pending/error states, and negative source balance not being blocked;
- detail/edit changes, including fee changes and source/destination changes;
- soft delete and restore presentation;
- transfer rendering in the minimal recent/deleted feed;
- protected-route/auth regression and no accidental income/expense labelling.

## Manual acceptance checklist

After automated and linked database verification succeeds, manually verify:

1. Sign in and create a transfer between two active wallets; confirm source debit, destination credit, and unchanged total wealth.
2. Create a transfer with a positive fee; confirm the source falls by principal plus fee, destination rises by principal, and wealth falls only by fee.
3. Transfer an amount larger than the source balance; confirm it succeeds and yields a negative source balance.
4. Confirm same-wallet, zero/negative amount, negative fee, archived endpoint, and future-date validation.
5. Backdate a transfer and confirm it persists and orders consistently.
6. Edit amount, source, destination, fee, description, notes, and occurrence time; confirm balances reconcile without duplicate movements.
7. Soft-delete then restore a transfer with and without fee; confirm balances change and recover exactly once.
8. Archive a wallet after a transfer; confirm historical transfer remains readable, new transfer targeting it is rejected, and restore works if the transfer is deleted.
9. Refresh, sign out, and sign back in; confirm owner-scoped data/session behavior remains correct.
10. Verify the PWA remains installable and does not offer offline financial mutation behavior.

## Out of scope

- income or expense redesign;
- transfer categories or category tables;
- full history/search/filtering/pagination;
- dashboard/report UI;
- recurring or scheduled transfers;
- bank/payment integration;
- multi-currency or exchange rates;
- a mutable or cached wallet balance;
- hard deletion of financial history;
- offline transfer queues, IndexedDB sync, or conflict resolution;
- wallet type grouping, wallet visual accents/icons, or other wallet UX backlog work.

## Definition of done

Phase 5 is complete only when a reviewed forward migration, transfer RPCs, owner-safe reads, UI, documentation, and generated types satisfy this contract; all existing and new linked database tests, frontend tests, type checking, linting, formatting, production/PWA build, security/secret checks, migration-history checks, and manual acceptance pass. The phase must explicitly report actual verification results and must not start Phase 6.

## Implementation record

Implemented on `phase-05-wallet-transfers` on 2026-09-04:

- Migration `20260904000000_add_wallet_transfers.sql` adds the transfer-create idempotency key, explicit source/destination/fee movement roles, partial uniqueness, deferred exact-shape enforcement, deterministic wallet locking, an owner-safe unified feed, and hardened create/update/delete/restore RPCs.
- Transfer principal uses one equal negative/positive movement pair. An optional fee is a separate negative source movement and is absent when zero.
- Transfer creation is atomic and retry-safe per owner/key. Direct edit reuses principal rows and adds, updates, or removes only the optional fee row as required. Soft delete and restore preserve existing stored movements.
- The responsive authenticated UI provides transfer create/detail/edit/delete/restore flows and includes transfers in the existing 25-event active/deleted recent surface. Phase 6 history/search remains absent.

### Verification record

- TypeScript, ESLint, the targeted Phase 5 Prettier check, production build, PWA generation, Markdown links, and `git diff --check` passed.
- Vitest passed 110 of 110 tests across 15 files.
- The linked migration history initially showed exactly one pending migration. The dry run listed only `20260904000000_add_wallet_transfers.sql`; it applied successfully, and all five local/remote migration versions agree.
- Linked database lint completed without schema errors. It reports three non-functional `warning extra` notices for Phase 5 loop variables used to acquire deterministic row locks, plus the two accepted Phase 4 lock-result notices.
- The Phase 2–4 linked transactional suites passed 205 of 205 assertions. The Phase 5 transfer suite passed 66 of 66 assertions, for 271 of 271 total. Every suite used its explicit transaction/rollback, and the post-test cleanup query found zero retained fixture users, profiles, wallets, transactions, or movements.
- Security/scope review confirmed owner-qualified relationships, RLS, RPC-only ledger mutations, no client owner parameter, ignored `.env`, no privileged credential in tracked files, and no authenticated financial runtime cache.

Manual transfer acceptance remains required before Phase 5 can be marked complete. Phase 6 has not started.
