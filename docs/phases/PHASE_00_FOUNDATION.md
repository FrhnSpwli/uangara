# Phase 0 — Foundation & Documentation

## Status

Complete as of the initial documentation pass. No application implementation was performed.

## Objective

Establish the product, architecture, financial rules, preliminary data model, security principles, PWA direction, roadmap, and coding-agent contract before implementation begins.

## Scope

- Define Uangara's mission, audience, MVP boundaries, and core journeys.
- Establish wallet, income, expense, transfer, fee, movement, balance, and atomicity semantics.
- Document the intended React/Supabase/PWA architecture and frontend responsibilities.
- Define the security and privacy baseline.
- Separate PWA installability from future offline financial synchronization.
- Identify unresolved schema choices without pretending the database is final.
- Establish phase discipline, completion requirements, and documentation precedence for agents.
- Plan Phases 1 and 2 and provide a high-level roadmap for later phases.

## Out of scope

- initializing React, Vite, TypeScript, Tailwind, routing, tests, or PWA tooling
- installing packages or generating lockfiles
- creating application source code, configuration, icons, or build artifacts
- creating or configuring a Supabase project
- creating SQL migrations, tables, policies, functions, or seed data
- implementing authentication, wallets, transactions, transfers, reports, or deployment
- finalizing open database decisions assigned to future phases

## Deliverables

- [`README.md`](../../README.md)
- [`AGENTS.md`](../../AGENTS.md)
- [Product definition](../PRODUCT.md)
- [Architecture](../ARCHITECTURE.md)
- [Financial domain rules](../DOMAIN_RULES.md)
- [Preliminary data model](../DATA_MODEL.md)
- [Security baseline](../SECURITY.md)
- [PWA strategy](../PWA.md)
- [Roadmap](../ROADMAP.md)
- [Phase 1 plan](PHASE_01_PROJECT_SETUP.md)
- [Phase 2 plan](PHASE_02_AUTH_SECURITY.md)

## Technical requirements

- Use Markdown that renders correctly on GitHub and relative links that resolve within the repository.
- State intended behavior as planned unless it is documentation completed by this phase.
- Keep financial terms and examples consistent with `DOMAIN_RULES.md`.
- Record undecided implementation choices as open questions rather than silently choosing a schema.
- Create no application source, package metadata, generated assets, Supabase resources, or migrations.

## Acceptance criteria

- All listed documentation files exist and their internal Markdown links resolve.
- The README accurately describes a foundation/planning-stage project.
- Transfer principal is consistently wealth-neutral, while fees consistently decrease wealth.
- Wallet balance is consistently ledger-oriented and avoids double counting opening balance.
- Critical multi-record financial operations are consistently required to be atomic.
- RLS and user ownership are required, and service-role credentials are prohibited in frontend code.
- PWA installability is clearly distinct from offline financial transactions and synchronization.
- Phase 1 excludes database schema and auth behavior; Phase 2 excludes wallet functionality.
- Open design decisions are explicitly deferred rather than presented as final.
- No implementation, dependency, database, or generated build files are created.

## Completion checklist

- [x] Product and MVP contract documented
- [x] Financial invariants documented
- [x] Architecture and layering documented
- [x] Preliminary entities, relationships, and open questions documented
- [x] Security and PWA baselines documented
- [x] Phase roadmap documented
- [x] Agent operating contract documented
- [x] Detailed plans limited to Phases 0–2
- [x] Cross-document transfer, security, and offline semantics reviewed
- [x] Internal links and repository contents verified

## Verification

Phase 0 verification is a documentation audit: inspect every deliverable, resolve internal links relative to its file, search for contradictory status or domain claims, and confirm the repository contains no source, dependency, migration, or generated implementation files. Results must be reported without implying that code, build, or automated application tests exist.
