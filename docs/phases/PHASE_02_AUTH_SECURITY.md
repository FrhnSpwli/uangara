# Phase 2 — Authentication & Security Foundation

## Status

Planned only. Do not implement this phase unless the user explicitly requests Phase 2. Wallet functionality is not part of this phase.

## Objective

Establish secure Supabase authentication, session-aware routing, a minimal owner-scoped profile foundation, and the first tested migration/RLS baseline.

## Dependencies

- Phase 1 is complete and verified.
- A Supabase development project and safe local configuration are available.
- Current Supabase Auth, migration, and RLS documentation is reviewed.
- Sign-up confirmation and redirect behavior for the target development environment are explicitly selected.

## Scope

- Configure Supabase Auth for email-based sign-up, sign-in, and sign-out using the approved provider behavior.
- Restore and react to sessions safely across reloads.
- Provide protected application routes and redirect behavior for unauthenticated users.
- Add accessible authentication forms with validation, loading, success, and safe error states.
- Create the first versioned Supabase migrations.
- Add a minimal `profiles` table linked one-to-one to `auth.users`.
- Define how a profile is created for a new user, using a reviewed database or application mechanism.
- Enable RLS and add least-privilege owner policies for profiles.
- Generate or maintain database types using the chosen reproducible workflow.
- Add automated tests for auth UI/state and database security assumptions.
- Document local migration, environment, auth redirect, and verification workflows.

## Out of scope

- wallets, opening balances, wallet types, or wallet UI
- categories, transactions, movements, transfers, fees, balances, dashboards, or reports
- social login, passwordless login, MFA, account linking, or organization/team access unless separately approved
- administrative user management in the browser
- service-role credentials in frontend code
- a dedicated Node/Express backend
- offline auth mutation or financial synchronization
- production deployment and final production email configuration

## Technical requirements

- Treat Supabase Auth as the identity source; profile rows supplement rather than replace auth users.
- Keep session bootstrap distinct from an unauthenticated state so protected content does not flash or make premature requests.
- Unsubscribe auth listeners correctly and handle expired or invalid sessions.
- Treat route guards as UX only; database RLS remains the authorization boundary.
- Apply profile schema, constraints, grants, functions/triggers if selected, and RLS through versioned migrations.
- Ensure a profile identifier has an enforceable relationship to `auth.users.id`.
- Limit profile columns to those justified for the phase and avoid storing auth secrets.
- Define policies using `auth.uid()` or a reviewed equivalent so authenticated users can access only their own profile.
- Prevent anonymous and cross-user reads, inserts, updates, and deletes except for any narrowly documented operation required by the chosen profile-creation flow.
- If using `SECURITY DEFINER`, pin a safe search path, minimize privileges, validate assumptions, and restrict execution grants.
- Keep publishable/anon credentials in the client and service-role credentials out of the client, repository, logs, and built assets.
- Present user-safe errors without leaking tokens, provider internals, or sensitive account details.

## Acceptance criteria

1. A user can sign up using the approved email confirmation behavior and receives accurate UI feedback.
2. A valid user can sign in and sign out.
3. A valid session survives a page reload according to Supabase client behavior.
4. Auth initialization exposes a deliberate loading state and does not flash protected content.
5. Unauthenticated users cannot access protected application routes and are returned safely after authentication where designed.
6. Authenticated users do not remain on guest-only routes when that would be confusing or unsafe.
7. Auth failures, invalid credentials, network failures, and sign-out errors have usable, non-sensitive states.
8. Versioned migrations create only the approved profile/security foundation and can be applied reproducibly to a clean development database.
9. RLS is enabled on `profiles`; a user can read and update only their own allowed profile fields.
10. Anonymous clients and a second authenticated user cannot read or modify the first user's profile.
11. Invalid profile ownership or attempts to change the owning identity are rejected.
12. New-user profile creation is reliable under the chosen approach and does not require a service-role key in the browser.
13. Grants and any functions/triggers follow least privilege and pass a focused security review.
14. Auth UI/state tests and database ownership tests pass and report actual results.
15. Type checking, formatting, linting, tests, and the production build pass.
16. The repository and production bundle contain no service-role key or privileged secret.
17. No wallet or later financial functionality is introduced.

## Security verification

Use separate test identities and an unauthenticated client to verify at minimum:

- anonymous profile access is denied
- user A can access only user A's permitted profile data
- user B cannot read, insert for, update, or delete user A's profile
- the owner identifier cannot be reassigned by a normal client
- profile creation follows the documented pathway and rolls back or fails safely
- direct API calls cannot bypass route guards or frontend form restrictions
- session tokens and sensitive auth data do not appear in logs or user-facing errors
- client environment and built assets contain no service-role credential
- migrations reproduce policies, grants, and functions from a clean database

Tests that exercise only mocked frontend state do not satisfy the database ownership criteria; integration-level RLS verification is required against an appropriate non-production Supabase environment.

## Verification

The implementing agent must run and report the exact results of formatting, lint, TypeScript checks, unit/component tests, database/RLS tests, migration reset or equivalent clean-apply verification, production build, and manual auth acceptance journeys. Any check that cannot run must be identified explicitly.

## Completion checklist

- [ ] Auth journeys and session lifecycle implemented
- [ ] Protected and guest route behavior verified
- [ ] Profile migration and creation pathway implemented
- [ ] RLS, grants, and ownership tests pass
- [ ] Loading and safe error states verified
- [ ] Secret and production-bundle checks pass
- [ ] Quality checks and build pass
- [ ] Documentation updated
- [ ] Absence of wallet functionality confirmed
