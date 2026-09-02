# Preliminary Data Model

## Status and intent

This document remains the conceptual model for financial schema evolution. Phase 2 implements the minimal `profiles` foundation. Phase 3 implements `wallets`, the minimal `transactions` foundation, `wallet_movements`, opening-balance RPCs, and owner-safe ledger-derived balance views. Phase 4 income/expense behavior is now designed in its phase contract but remains unimplemented. Later transaction shapes and fields remain deferred to their authorized phases.

## Relationship overview

```text
auth.users
    1
    |
    1 profiles
    |
    +----< wallets ----< wallet_movements >---- transactions >---- categories (optional)
    |
    +----< transactions
    |
    +----< categories

transactions 1 ----< wallet_movements
wallets      1 ----< wallet_movements
```

Every user-owned row carries or inherits an unambiguous ownership relationship that RLS and constraints can enforce. Phase 3 financial tables carry `user_id`, unique `(id, user_id)` keys, and composite owner-qualified foreign keys so transaction-to-wallet relationships cannot cross owners. Later tables must preserve this strategy or document an equally strong replacement.

## Proposed entities

### `profiles`

Purpose: application-specific data associated one-to-one with a Supabase Auth user.

Implemented Phase 2 fields:

- `id`: primary key and foreign key to `auth.users.id`, with intentional cascading deletion
- `display_name`: optional trimmed non-empty text, limited to 80 characters
- `created_at` and `updated_at`: database-managed timestamps

A reviewed `auth.users` trigger creates the profile in the same database operation as the user. The trigger function is security-definer with an empty search path and restricted execution grants. Authenticated clients retain an owner-scoped insert path for safe recovery, but RLS requires `auth.uid() = id`. Clients may read their own row and update only `display_name`; they cannot reassign ownership or write timestamps. A profile is not an alternate authentication source and contains no credentials, currency, wallet, or financial fields.

### `wallets`

Purpose: user-defined locations that hold money.

Conceptual fields:

- identifier
- owner user identifier
- editable display `name`
- category `type`: `bank`, `e_wallet`, `e_money`, `cash`, or `other`
- optional `institution` recording the bank, provider, or issuer where applicable
- nullable `archived_at` lifecycle timestamp
- created and updated timestamps

Frontend presets may suggest common Indonesian banks, e-wallet providers, and e-money products, but they are not a database enumeration of institutions. Custom institution strings remain valid so new, regional, or uncommon providers do not require a schema change. Cash requires no institution. `other` means another actual stored-money location, not a saving goal or purpose assigned to money that remains in another wallet. Saving Goals remain a separate future concept with no current schema.

Wallet names are not required to be unique and remain independently editable from provider metadata. A mutable wallet balance or opening-balance field is not the ledger source of truth. Wallet removal uses archival rather than destructive deletion: archived wallets remain recoverable and retain their ledger history.

### `categories`

Purpose: classify wealth-changing transactions for reporting.

Conceptual fields:

- identifier
- owner user identifier, or a clearly defined system-default ownership model
- name
- applicability such as income, expense, or both
- optional presentation metadata
- active/archived state
- created and updated timestamps

Transfers should not require an income/expense category for their principal. Fees may use an expense category.

### `transactions`

Purpose: represent a user-recognizable financial event and its shared metadata.

Implemented Phase 3 fields:

- identifier
- owner user identifier
- `kind`: `opening_balance`, `income`, `expense`, or `transfer`
- `occurred_at`: when the financial event occurred
- `created_at`: when the database record was created
- `updated_at`: when the database record was last modified
- nullable `deleted_at` soft-delete state; opening-balance rows are constrained to remain active

The Phase 4 plan adds a required bounded `description` for income/expense and optional bounded `notes`. The physical columns remain nullable where necessary so existing opening-balance rows do not receive fabricated text. Phase 4 adds no transaction-level amount and no category reference: its one signed wallet movement is the authoritative amount effect, while category ownership and lifecycle remain Phase 8 decisions.

### `wallet_movements`

Purpose: record the signed effect of a transaction on one wallet.

Conceptual fields:

- identifier
- owner user identifier for direct policy and relationship enforcement
- transaction identifier
- wallet identifier
- signed monetary amount stored as PostgreSQL `BIGINT`
- movement role; Phase 3 requires `opening_balance`, while later roles belong to their implementing phases
- `created_at` and `updated_at` timestamps

`wallet_movements` exists because a business event can affect more than one wallet. It enables balances to be derived, makes both sides of a transfer part of one transaction, and avoids treating a mutable wallet balance as the only financial truth.

Movement amounts are normally non-zero. The sole zero-valued exception is the movement belonging to the single active `opening_balance` transaction for its wallet. Every income, expense, transfer, fee, or other ordinary movement remains non-zero unless a later approved architecture change explicitly revises the rule.

## Expected transaction shapes

- **Opening balance:** exactly one signed movement for one wallet, produced by its single active transaction with type `opening_balance`. The movement may be zero under the opening-balance exception.
- **Income:** exactly one persistent positive movement with role `income` into one wallet; user input is a positive, non-zero magnitude.
- **Expense:** exactly one persistent negative movement with role `expense` from one wallet; user input is a positive, non-zero magnitude.
- **Transfer:** one negative source movement and one equal positive destination movement; principal movements sum to zero.
- **Transfer with fee:** the balanced transfer principal plus a separately identifiable negative expense effect. Whether the fee is represented by an associated expense transaction or an additional typed movement is open, but it must reduce wealth and report as expense.

These shapes should be enforced as close to the database as practical, especially when records are created through RPC.

## Monetary representation

Persisted financial amounts use whole integer representation rather than floating-point values. Implemented PostgreSQL monetary columns use `BIGINT`, whose range is appropriate for realistic Indonesian Rupiah balances and transaction history. Browser code must avoid floating-point monetary arithmetic and accept only safe whole-number inputs at its boundary. Database money is transported to the browser as decimal strings and formatted through `bigint`; conversion to `number` is permitted only after a safe-integer check for an RPC input. The initial product is Indonesian Rupiah-oriented, but multi-currency behavior is not yet designed.

## Opening balance

The balance invariant is:

```text
wallet balance = SUM(wallet movements from active transactions)
```

Opening balance is a special transaction with type `opening_balance`. Every wallet has exactly one active opening-balance transaction and exactly one corresponding movement, including wallets opened with zero. That movement is included in the same sum as every other active transaction movement. It is not duplicated in a mutable wallet balance or separate opening-balance source-of-truth field.

## Balance behavior

A calculated wallet balance may be negative. Future wallet and transaction validation must preserve this behavior unless the domain decision is explicitly revised.

## Transaction lifecycle

For the MVP, transaction edits use direct update semantics. The transaction and every affected movement must be updated together atomically, with ownership and the complete resulting shape revalidated. An edit must not leave orphaned movements or only one side of a compound event updated.

Transaction deletion uses the implemented nullable `deleted_at` field rather than physical deletion. Deleted transactions and their movements remain recoverable and auditable in storage but are excluded from active balances and reports. Phase 4 restoration clears `deleted_at` and reactivates the same preserved movement exactly once; a deleted transaction cannot be edited until restored.

For ordinary income and expense, direct edit may correct `income` to `expense` or vice versa because both use an exact-one movement shape. Kind, role, sign, wallet, amount, time, and metadata must remain one atomic update. Opening balances and transfers cannot use that edit boundary.

## Transaction time

- `occurred_at` is the financial occurrence time and the primary reporting/order timestamp.
- `created_at` is the database record creation time.
- `updated_at` is the database record's most recent modification time.

`created_at` must not substitute for `occurred_at`. Transactions order by `occurred_at DESC`, then `created_at DESC`, then `id DESC` for a deterministic total order. Phase 4 ordinary transactions may be backdated but reject a future `occurred_at`; scheduled and recurring behavior remains future work.

## Category ownership and defaults

User-created categories should be owner-scoped. Default categories could be copied into each user's ownership or exposed as immutable system records alongside user records. The choice affects RLS, customization, localization, and deletion behavior and must be settled before category implementation.

Phase 4 deliberately adds neither a category table nor nullable category groundwork. Income and expense remain valid without categories; Phase 8 owns the category schema and any later assignment/backfill behavior.

## Open Questions for Later Financial Phases

- Will the MVP be explicitly single-currency, and where is that currency recorded?
- How are transfer fees linked: an associated expense transaction or a typed movement within a compound operation?
- Which transfer/fee invariants can PostgreSQL constraints enforce directly, and which require RPC validation?
- Are source and destination wallets required to be different?
- How should category deletion and archival behave once a category is referenced?
- How are default categories owned, localized, and customized?
- What idempotency and concurrency controls are required for critical writes?
