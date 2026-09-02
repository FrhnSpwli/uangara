# Financial Domain Rules

These rules define Uangara's financial meaning independently of UI or schema choices. Implementations must preserve these invariants.

## Wallet

A wallet represents a real or conceptual location where one user holds money, such as a bank account, e-wallet, e-money product, cash, or a custom location. A wallet belongs to one user. The supported wallet taxonomy is `bank`, `e_wallet`, `e_money`, `cash`, and `other`.

`type` is the wallet category, `institution` records the bank/provider/issuer when applicable, and `name` is the editable user-facing wallet name. Provider presets are only a frontend convenience: institution strings remain customizable and are not restricted to a fixed catalog at the database boundary.

`other` is reserved for a genuinely distinct place where money exists, such as a cooperative balance or physical money box. A saving goal or mental allocation is not a wallet when its money still exists inside another wallet; modeling both would double-count wealth. Saving Goals are a separate future concept and are not part of the current wallet model.

## Monetary values

Persisted financial amounts use integer representation, not floating-point values. For the initial Indonesian Rupiah-oriented product, calculations must preserve integer arithmetic at the financial data boundary. Multi-currency behavior has not been designed, and application formatting and presentation belong to later implementation phases.

## Income

Income is an external inflow that increases the user's total wealth. It produces a positive movement in the receiving wallet.

For an ordinary income transaction, the user supplies a positive, non-zero magnitude and the database creates exactly one positive movement. The movement is the authoritative balance effect.

```text
Salary into Mandiri: Mandiri +8,000,000
```

## Expense

Expense is an external outflow that decreases the user's total wealth. It produces a negative movement in the paying wallet.

For an ordinary expense transaction, the user supplies a positive, non-zero magnitude and the database derives exactly one negative movement. Users do not enter a negative amount to express an expense.

```text
Purchase from GoPay: GoPay -35,000
```

## Transfer

A transfer moves an equal principal amount between two wallets owned by the same user. It is a first-class financial operation, not an expense paired with income.

```text
Mandiri -> GoPay: 500,000

Mandiri -500,000
GoPay   +500,000
```

The transfer's movements sum to zero, so the principal does not change total user wealth or income/expense reporting.

## Transfer fee

A transfer fee is a real outflow and decreases total wealth. It must be represented as an expense or an explicitly expense-like movement that reports as expense; the final schema representation remains to be decided.

```text
Mandiri -> GoPay: 500,000
Admin fee: 1,000 paid by Mandiri

Mandiri -501,000
GoPay   +500,000
Fee expense = 1,000
Net wealth change = -1,000
```

The fee must not be absorbed into the wealth-neutral transfer principal in a way that hides it from expense reporting.

## Wallet movement

A wallet movement is a signed amount affecting exactly one wallet as part of a financial event:

- positive values increase the wallet balance
- negative values decrease the wallet balance
- wallet movements are normally required to be non-zero
- the sign carries ledger direction; user-entered principal amounts should normally be positive before conversion into movements

A transaction may produce one or more movements. Movement records exist so balances and transfer integrity can be derived consistently rather than maintained only by mutable wallet totals.

The only permitted zero-valued wallet movement is the movement belonging to the single active `opening_balance` transaction for a wallet. This narrow exception gives every wallet the same opening-balance ledger lifecycle, including wallets opened with a balance of zero. Income, expense, transfer, fee, and every other ordinary financial movement remain non-zero unless a future approved architecture change explicitly redesigns this rule.

## Opening balance

Opening balance is represented by a special ledger transaction with type `opening_balance`. Every wallet has exactly one active opening-balance transaction and exactly one corresponding movement. The movement may be zero under the narrow exception above; otherwise, its signed integer amount contributes to the wallet balance like every other movement.

Opening balance must not also exist as a mutable `wallet.balance` source of truth or as a separately added balance field. Any future opening-balance edit follows the transaction edit rules below and updates its movement consistently.

## Balance invariant

Conceptually, at any point in time:

```text
wallet balance = SUM(wallet movements from active transactions)
```

The sum includes the movement produced by the wallet's `opening_balance` transaction. Soft-deleted transactions are not active and their movements must be excluded from active balance and reporting calculations. Cached or materialized balances may be considered later for performance, but the ledger remains the source from which they can be verified or rebuilt.

A calculated wallet balance is allowed to become negative. Future validation must not reject an otherwise valid operation solely because it produces a negative balance unless this rule is explicitly revised.

Across all of a user's wallets:

```text
total wealth = SUM(wallet balances)
```

Internal transfer principal leaves this value unchanged. Income increases it; expense and transfer fees decrease it.

## Financial integrity

Financial records must remain internally consistent throughout their lifecycle.

### Create

- Validate ownership of every referenced wallet and category.
- Reject invalid amounts and invalid transaction shapes.
- Create the transaction and all required movements in one database transaction.
- For a transfer, reject an invalid source/destination combination and require balanced principal movements.
- Never expose a partially created financial event.

### Edit

- The MVP uses direct update semantics for transaction edits.
- Revalidate ownership and the complete resulting financial shape.
- Directly update the transaction and replace or adjust all affected movements atomically.
- Phase 4 permits an ordinary `income` transaction to be corrected to `expense`, or vice versa, because both have one-movement shapes; the movement role and sign must change atomically.
- Opening balances and transfers cannot be converted through the ordinary income/expense edit path.
- A soft-deleted transaction must be restored before it can be edited.
- Do not permit a temporary or final state in which only one side of a transfer reflects the edit.
- Do not leave orphaned or partially updated movements.

### Delete

- The MVP uses soft deletion for transactions rather than physical deletion.
- Transaction state is represented by nullable `deleted_at`; a non-null value means the transaction is deleted.
- Keep the transaction and its movements recoverable at the data layer.
- Exclude soft-deleted transactions and their movements from active balances and reports.
- Restoration clears `deleted_at` and reactivates the same preserved movement effects exactly once.
- Apply any delete or restore state change consistently and atomically; never hide, delete, or recreate only one movement of a multi-movement event.

## Time semantics

- `occurred_at` records when the financial event actually occurred.
- `created_at` records when the database row was created.
- `updated_at` records when the database row was last modified.

Financial ordering and reporting primarily use `occurred_at`. `created_at` must not be overloaded as occurrence time. The deterministic transaction order is `occurred_at DESC`, then `created_at DESC`, then `id DESC`.

For Phase 4 ordinary income and expense, backdating is allowed and a future `occurred_at` is rejected so an event does not affect the current ledger before it occurs. Scheduled and recurring transactions require a separate future design.

## Risks future phases must resolve

- maximum amounts and any future currency behavior
- exact fee linkage and categorization
- database enforcement of the remaining future transaction shapes, including transfer balance
- concurrent writes and idempotency for RPC operations

These are open design decisions, not permission to weaken the invariants above.
