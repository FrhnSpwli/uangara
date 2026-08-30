# Phase 2 — Authentication & Security Foundation

## Status

`PHASE 2 ACCEPTANCE CRITERIA SATISFIED`

Phase 2 is implemented, remotely verified, manually accepted, and closed on `phase-02-auth-security`. Phase 3 has not started.

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

- [x] Auth journeys and session lifecycle implemented
- [x] Protected and guest route behavior verified with component tests
- [x] Profile migration and creation pathway implemented
- [x] RLS, grants, and ownership tests pass against a running database
- [x] Loading and safe error states verified with component tests
- [x] Secret and production-bundle checks pass
- [x] Quality checks and build pass
- [x] Documentation updated
- [x] Absence of wallet functionality confirmed

## Implementation record

- Authentication is isolated behind a typed service and React provider. The provider subscribes once per lifecycle, cleans up the Supabase listener, and distinguishes restoration from an unauthenticated state.
- `/auth/sign-in` and `/auth/sign-up` are guest routes; `/app` is protected. Route guards provide navigation behavior only and do not replace RLS.
- Sign-up supports Supabase projects with email confirmation enabled: a null signup session produces a confirmation-required success state rather than an error.
- Migration `20260830000000_create_profiles.sql` creates only `profiles`, its timestamp/new-user triggers, grants, and owner policies. Profile creation uses an `auth.users` trigger to preserve one-to-one integrity without a browser service-role key.
- The local Supabase configuration enables email confirmation and permits Vite development/preview redirect origins. Production redirect and email settings remain deployment work.
- `supabase/tests/profiles_rls.test.sql` defines focused anonymous, owner, cross-user, ownership-change, and deletion tests. It installs pgTAP inside its transaction, collects all TAP results, and rolls back the extension, test identities, profiles, and mutations.

## Verification record

On 2026-08-30:

- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run test`: passed, 4 files and 19 tests.
- `npm run build`: passed; the PWA plugin generated the manifest and service worker and precached 12 static entries.
- The Supabase CLI authenticated successfully, and the project derived from the configured public URL matched exactly one project in the authenticated account. The local link was verified against that project without recording credentials in the repository.
- The initial remote migration history contained no remote versions and exactly one pending local migration. `supabase db push --dry-run` listed only `20260830000000_create_profiles.sql`, with no seeds, roles, or later-phase artifacts.
- `supabase db push --linked` applied the Phase 2 migration successfully. A subsequent migration listing showed local and remote version `20260830000000` in agreement.
- `supabase db lint --linked --level error`: passed with no schema errors.
- `supabase test db --linked` could not launch its Docker-based pgTAP runner because Docker Desktop remained unavailable. The unchanged SQL assertions were therefore executed through the CLI's supported Management API query path: `supabase db query --linked --file supabase/tests/profiles_rls.test.sql`.
- Remote pgTAP result: 26 of 26 assertions passed. The suite verified trigger-created profiles, RLS enablement, grants, anonymous denial, owner access, cross-user denial, immutable ownership/timestamps, owner recovery insert, and no client delete.
- A separate catalog query confirmed that the auth trigger is attached, the profile function is security-definer with a pinned search path, RLS is enabled, and exactly three profile policies exist.
- A post-test query confirmed that the rollback retained zero test users and zero test profiles.
- Manual acceptance confirmed that an authenticated session persists after browser refresh and protected `/app` remains accessible after refresh.
- Manual acceptance confirmed that the confirmed user has exactly one corresponding `public.profiles` row.
- Manual acceptance confirmed successful sign-out and redirect to the sign-in flow when `/app` is accessed afterward.
- Based on the automated, remote database, and manual results above, all Phase 2 acceptance criteria are satisfied.
