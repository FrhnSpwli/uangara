# Preliminary Data Model

## Status and intent

This document is primarily the conceptual model for future financial schema design. Phase 2 implements only the minimal `profiles` foundation described below; no financial tables exist. Financial field names, types, constraints, and deletion behavior remain unresolved until their authorized phases.

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
- opening-balance representation, subject to the decision below
- active/archived state
- created and updated timestamps

Wallet type values should support custom wallets and must not restrict users to a fixed institution list. Archiving is preferable to losing transaction history, though deletion rules remain open.

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
- type: `income`, `expense`, or `transfer`
- positive principal amount where useful as event metadata
- optional category reference when meaningful
- description or note
- effective date/time
- created and updated timestamps
- optional status or reversal linkage if the chosen audit model needs it

The authoritative balance effects live in related wallet movements. Transaction-level amount and type support validation, display, and reporting but must agree with those movements.

### `wallet_movements`

Purpose: record the signed effect of a transaction on one wallet.

Conceptual fields:

- identifier
- owner user identifier if selected for direct policy enforcement
- transaction identifier
- wallet identifier
- signed non-zero amount
- optional movement role, such as source, destination, fee, or opening balance, if the final model requires it
- created timestamp

`wallet_movements` exists because a business event can affect more than one wallet. It enables balances to be derived, makes both sides of a transfer part of one transaction, and avoids treating a mutable wallet balance as the only financial truth.

## Expected transaction shapes

- **Income:** one positive movement into one wallet.
- **Expense:** one negative movement from one wallet.
- **Transfer:** one negative source movement and one equal positive destination movement; principal movements sum to zero.
- **Transfer with fee:** the balanced transfer principal plus a separately identifiable negative expense effect. Whether the fee is represented by an associated expense transaction or an additional typed movement is open, but it must reduce wealth and report as expense.

These shapes should be enforced as close to the database as practical, especially when records are created through RPC.

## Opening balance

The balance invariant is:

```text
wallet balance = opening balance + SUM(wallet movements)
```

Two plausible representations require a decision before wallet migrations:

1. Store a wallet opening-balance field and sum only subsequent movements.
2. Represent opening balance as a dedicated ledger event/movement and derive the balance entirely from movements.

The second approach may improve audit consistency; the first may be simpler. Whichever is selected must avoid double counting and define how opening-balance edits affect historical reporting.

## Category ownership and defaults

User-created categories should be owner-scoped. Default categories could be copied into each user's ownership or exposed as immutable system records alongside user records. The choice affects RLS, customization, localization, and deletion behavior and must be settled before category implementation.

## Open Questions Before Financial Database Implementation

- What integer or exact numeric unit will store Indonesian rupiah, and what future currency assumptions are allowed?
- Will the MVP be explicitly single-currency, and where is that currency recorded?
- Is opening balance a wallet attribute or a dedicated transaction/movement?
- How are transfer fees linked: an associated expense transaction or a typed movement within a compound operation?
- Which valid transaction shapes can PostgreSQL constraints enforce directly, and which require RPC validation?
- Are source and destination wallets required to be different?
- Are negative wallet balances allowed?
- Are transactions mutable, soft-deleted, or corrected through reversal events?
- What are the semantics for effective time, timezone, backdating, and deterministic ordering?
- Are wallet and category deletions prohibited once referenced, or replaced by archival?
- How are default categories owned, localized, and customized?
- Should direct inserts into financial tables be denied in favor of narrowly scoped RPC functions?
- What idempotency and concurrency controls are required for critical writes?
