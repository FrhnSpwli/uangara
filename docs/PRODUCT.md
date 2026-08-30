# Product Definition

## Vision

Uangara helps people maintain a trustworthy picture of where their money is and how it moves across the financial locations they actually use.

## Target users

The initial product is for individuals who manage money across multiple bank accounts, e-wallets, cash holdings, or other personal wallets and want a clearer consolidated view without treating internal movement as spending.

## Primary problem

Conventional expense-first tools often emphasize categories while obscuring current money location. Transfers and wallet top-ups can appear as false expenses and income, making balance and cash-flow reporting unreliable.

## Differentiator

Uangara makes the wallet and the transfer primary concepts. Users reproduce their real financial setup with custom wallets, and the system preserves the distinction between a change in wealth and a movement of existing wealth.

## MVP scope

The planned MVP includes:

- authentication and private user data
- custom wallet creation and management
- opening balances and derived current balances
- income and expense transactions
- atomic wallet-to-wallet transfers
- transfer fees that reduce wealth
- transaction history and basic search
- balance dashboard and summaries
- user categories and useful reporting
- an installable, mobile-first PWA baseline

These capabilities are planned, not currently implemented.

## Core user journeys

1. A user creates an account and signs in securely.
2. The user creates wallets matching their real accounts, e-wallets, and cash.
3. The user establishes each wallet's opening position.
4. The user records income into a wallet or an expense from a wallet.
5. The user transfers money between two wallets, optionally recording a fee.
6. The user reviews transaction history, current wallet balances, total wealth, and reports that exclude internal transfers from income and expense.

## Wallet concept

A wallet is a location belonging to a user where money is held. It may represent a bank account, e-wallet, physical cash, or another user-defined location. The product may offer descriptive wallet types or presets, but it must not limit wallets to hardcoded institutions.

## Transaction concept

A transaction is a user-recognizable financial event. For the MVP, its business type is income, expense, or transfer. A special `opening_balance` ledger transaction establishes a wallet's opening position without being treated as income or expense. A transaction may create one or more signed wallet movements that determine balance effects.

## Transfer concept

A transfer moves a positive amount from one owned wallet to another. Its source movement is negative and destination movement is positive by the same principal amount. It is neither income nor expense and does not change total wealth. Any transfer fee is a separate wealth-decreasing effect.

## Reporting goals

Reports should eventually help users understand:

- balances by wallet and total user wealth
- actual income and expense over time
- spending by category
- how money moves between wallets
- the distinction between gross wallet activity and wealth-changing cash flow

Reports must not inflate income or expense with internal transfer principal.

## Future possibilities

Later exploration may include budgets, recurring transactions, import and reconciliation, multiple currencies, shared finances, richer analytics, notifications, and carefully designed offline capture and synchronization. These are possibilities, not commitments.

## Explicitly out of scope for the initial MVP

- payment initiation, money custody, banking, or payment processing
- investment trading or portfolio execution
- bank credential storage or guaranteed automatic bank synchronization
- multi-user household collaboration
- full accounting, tax, payroll, or regulatory reporting
- full offline financial transaction sync, background queues, and conflict resolution
- a dedicated Node/Express backend without a demonstrated need
