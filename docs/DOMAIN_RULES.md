# Financial Domain Rules

These rules define Uangara's financial meaning independently of UI or schema choices. Implementations must preserve these invariants.

## Wallet

A wallet represents a real or conceptual location where one user holds money, such as a bank account, e-wallet, cash, or a custom location. A wallet belongs to one user. Institution-specific wallet names and types must remain user-configurable rather than being the only allowed values.

## Income

Income is an external inflow that increases the user's total wealth. It produces a positive movement in the receiving wallet.

```text
Salary into Mandiri: Mandiri +8,000,000
```

## Expense

Expense is an external outflow that decreases the user's total wealth. It produces a negative movement in the paying wallet.

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
- zero-value movements are invalid
- the sign carries ledger direction; user-entered principal amounts should normally be positive before conversion into movements

A transaction may produce one or more movements. Movement records exist so balances and transfer integrity can be derived consistently rather than maintained only by mutable wallet totals.

## Balance invariant

Conceptually, at any point in time:

```text
wallet balance = opening balance + SUM(wallet movements)
```

The implementation must choose one non-duplicative representation for opening balance. If opening balance is itself recorded as a movement, it must not also be added from a wallet field. Cached or materialized balances may be considered later for performance, but the ledger remains the source from which they can be verified or rebuilt.

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

- Revalidate ownership and the complete resulting financial shape.
- Replace or adjust all affected movements atomically with the transaction update.
- Do not permit a temporary or final state in which only one side of a transfer reflects the edit.
- Define audit-history expectations before edit behavior is implemented.

### Delete or reversal

- Never delete or reverse only one movement of a multi-movement event.
- Apply transaction and movement changes atomically.
- Decide before implementation whether user-facing deletion is hard deletion, soft deletion, or an explicit reversal event.
- Preserve reporting and audit consistency under the selected policy.

## Risks future phases must resolve

- rounding, numeric units, maximum amounts, and any future currency behavior
- overdraft or negative-balance policy
- opening-balance representation and edit behavior
- exact fee linkage and categorization
- timestamp semantics and ordering of backdated transactions
- mutation/audit policy for edits and deletions
- database enforcement of valid movement count, signs, ownership, and transfer balance
- concurrent writes and idempotency for RPC operations

These are open design decisions, not permission to weaken the invariants above.

