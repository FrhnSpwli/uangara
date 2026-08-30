# Architecture

## Status

This document defines the intended high-level architecture. It is a decision framework, not a claim that any application components exist yet.

## System context

```text
React PWA
    |
    | @supabase/supabase-js over HTTPS
    v
Supabase
    |
    +-- Authentication
    +-- PostgreSQL
          +-- constraints and ledger data
          +-- Row Level Security policies
          +-- functions / RPC for atomic operations
```

## Responsibilities

### React

React presents the application, coordinates user interactions, renders loading and error states, and composes feature-focused UI. Page components should not become repositories for database access or financial rules.

### TypeScript

TypeScript is the default language for application and test code. It should express domain boundaries, API contracts, and state clearly. Compile-time types complement rather than replace runtime validation and database constraints.

### Vite

Vite will provide the frontend development and production build foundation. Exact configuration belongs to Phase 1.

### Supabase

Supabase provides the hosted application boundary for authentication and PostgreSQL access through its browser client. Its publishable/anon credential may be used by the frontend because authorization must be enforced by RLS. Privileged service-role credentials must never enter the browser.

### PostgreSQL

PostgreSQL is the authoritative store for financial records. It should enforce ownership relationships, valid amounts, transaction shapes, and referential integrity where practical. Wallet balances are derived from the ledger model described in [Domain Rules](DOMAIN_RULES.md), not trusted solely as mutable wallet fields.

### Row Level Security

RLS is the primary database authorization boundary for user-owned records. Policies must prevent cross-user reads and writes even if frontend checks are bypassed. Client-side route protection is a usability measure, not a security boundary.

### Database functions and RPC

PostgreSQL functions exposed through Supabase RPC are appropriate for operations that must validate and write several records as one transaction. Wallet-to-wallet transfer creation, editing, and reversal are likely candidates. Exact function signatures and privilege rules remain for the relevant implementation phase.

### PWA layer

The PWA layer will provide installability, a manifest, icons, standalone presentation, and conservative caching of the static application shell. It must not broadly cache authenticated financial responses. Full offline mutation and synchronization require a separate future design; see [PWA Strategy](PWA.md).

## Why there is no dedicated backend server yet

The planned requirements can be served by a React client using Supabase Auth, RLS, PostgreSQL constraints, and transactional database functions. Adding Node/Express now would create another deployment and authorization boundary without a demonstrated benefit. A dedicated server can be reconsidered if future integrations, secret-bearing workflows, long-running jobs, or other requirements cannot be handled safely by Supabase capabilities.

## Frontend layering principles

The exact folder structure will be decided during setup, but responsibilities should remain distinct:

- `app/`: application composition, routing, providers, and global setup
- `components/`: reusable presentation primitives
- `features/`: domain-focused UI and orchestration for auth, wallets, transactions, transfers, categories, dashboard, and reports
- `hooks/`: reusable React behavior
- `lib/`: configured external clients and low-level adapters
- `services/`: data-access operations and calls to RPC boundaries
- `types/`: shared domain and generated database types
- `utils/`: focused pure helpers

Dependencies should generally flow from pages/features toward reusable UI and service abstractions. Database row shapes should not leak indiscriminately through the UI, and financial invariants should have one authoritative implementation boundary.

## Architectural constraints

- All user financial data is owner-scoped and protected by RLS.
- Ledger movements determine balance effects.
- Transfer principal is wealth-neutral.
- Multi-record financial writes are atomic.
- Database changes are versioned through migrations.
- PWA installability is separate from offline financial behavior.
- Undecided schema details must be resolved before their migration is written; see [Data Model](DATA_MODEL.md).

