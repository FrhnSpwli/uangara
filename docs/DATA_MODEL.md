# Preliminary Data Model

## Status and intent

This document is primarily the conceptual model for future financial schema design. Phase 2 implements only the minimal `profiles` foundation described below; no financial tables exist. Locked domain decisions are recorded here, while remaining field details and constraints stay unresolved until their authorized phases.

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

Every user-owned row should carry or inherit an unambiguous ownership relationship that RLS and constraints can enforce. Denormalized `user_id` fields may be appropriate on financial tables to simplify secure policies, but the exact approach requires schema review.

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
- display name
- optional descriptive type, institution label, color, or icon key
- active/archived state
- created and updated timestamps

Wallet type values should support custom wallets and must not restrict users to a fixed institution list. A mutable wallet balance or opening-balance field is not the ledger source of truth. Archiving is preferable to losing transaction history, though wallet deletion rules remain open.

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

Conceptual fields:

- identifier
- owner user identifier
- type: `opening_balance`, `income`, `expense`, or `transfer`
- integer principal amount where useful as event metadata
- optional category reference when meaningful
- description or note
- `occurred_at`: when the financial event occurred
- `created_at`: when the database record was created
- `updated_at`: when the database record was last modified
- soft-delete state, with nullable `deleted_at` as the intended direction subject to migration review

The authoritative balance effects live in related wallet movements. Transaction-level amount and type support validation, display, and reporting but must agree with those movements.

### `wallet_movements`

Purpose: record the signed effect of a transaction on one wallet.

Conceptual fields:

- identifier
- owner user identifier if selected for direct policy enforcement
- transaction identifier
- wallet identifier
- signed non-zero integer amount
- optional movement role, such as source, destination, fee, or opening balance, if the final model requires it
- `created_at` timestamp

`wallet_movements` exists because a business event can affect more than one wallet. It enables balances to be derived, makes both sides of a transfer part of one transaction, and avoids treating a mutable wallet balance as the only financial truth.

## Expected transaction shapes

- **Opening balance:** one signed movement for one wallet, produced by a transaction with type `opening_balance`.
- **Income:** one positive movement into one wallet.
- **Expense:** one negative movement from one wallet.
- **Transfer:** one negative source movement and one equal positive destination movement; principal movements sum to zero.
- **Transfer with fee:** the balanced transfer principal plus a separately identifiable negative expense effect. Whether the fee is represented by an associated expense transaction or an additional typed movement is open, but it must reduce wealth and report as expense.

These shapes should be enforced as close to the database as practical, especially when records are created through RPC.

## Monetary representation

Persisted financial amounts use integer representation rather than floating-point values. The initial product is Indonesian Rupiah-oriented, but multi-currency behavior is not yet designed. Application formatting and display behavior will be defined by later implementation phases.

## Opening balance

The balance invariant is:

```text
wallet balance = SUM(wallet movements from active transactions)
```

Opening balance is a special transaction with type `opening_balance`. It produces a wallet movement included in the same sum as every other active transaction movement. It is not duplicated in a mutable wallet balance or separate opening-balance source-of-truth field.

## Balance behavior

A calculated wallet balance may be negative. Future wallet and transaction validation must preserve this behavior unless the domain decision is explicitly revised.

## Transaction lifecycle

For the MVP, transaction edits use direct update semantics. The transaction and every affected movement must be updated together atomically, with ownership and the complete resulting shape revalidated. An edit must not leave orphaned movements or only one side of a compound event updated.

Transaction deletion uses soft deletion rather than physical deletion. A nullable `deleted_at` column is the intended direction, subject to final schema review. Deleted transactions and their movements remain recoverable and auditable in storage but are excluded from active balances and reports.

## Transaction time

- `occurred_at` is the financial occurrence time and the primary reporting/order timestamp.
- `created_at` is the database record creation time.
- `updated_at` is the database record's most recent modification time.

`created_at` must not substitute for `occurred_at`. A deterministic secondary ordering for equal occurrence times remains to be selected during transaction schema implementation.

## Category ownership and defaults

User-created categories should be owner-scoped. Default categories could be copied into each user's ownership or exposed as immutable system records alongside user records. The choice affects RLS, customization, localization, and deletion behavior and must be settled before category implementation.

## Open Questions Before Financial Database Implementation

- Will the MVP be explicitly single-currency, and where is that currency recorded?
- How are transfer fees linked: an associated expense transaction or a typed movement within a compound operation?
- Which valid transaction shapes can PostgreSQL constraints enforce directly, and which require RPC validation?
- Are source and destination wallets required to be different?
- What timezone and backdating rules apply to `occurred_at`?
- Which deterministic secondary key orders transactions sharing the same `occurred_at` value?
- Are wallet and category deletions prohibited once referenced, or replaced by archival?
- How are default categories owned, localized, and customized?
- Should direct inserts into financial tables be denied in favor of narrowly scoped RPC functions?
- What idempotency and concurrency controls are required for critical writes?
