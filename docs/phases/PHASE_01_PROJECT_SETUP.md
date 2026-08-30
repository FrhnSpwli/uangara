# Phase 1 — Project Setup & PWA Foundation

## Status

Complete as of 2026-08-30. Phase 2 has not started.

## Implementation record

- **Runtime:** Node.js 26.3.1 was used; the project declares Node.js 20.19 or newer.
- **Package manager:** npm 11.16.0 with a generated lockfile. The directory was not a Git repository, so no commit was created.
- **Frontend:** React, strict TypeScript, Vite, Tailwind CSS through `@tailwindcss/vite`, and React Router.
- **Data client:** A lazy `@supabase/supabase-js` browser-client factory validates only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. It performs no Auth or data operations.
- **PWA:** `vite-plugin-pwa` generates the manifest and service worker. Workbox precaches static shell assets, has no financial/API runtime cache rules, and uses temporary documented SVG icons.
- **Quality:** ESLint, Prettier, Vitest, React Testing Library, and jsdom are configured.

## Objective

Create a maintainable TypeScript-first React foundation, quality toolchain, responsive application shell, and safe PWA installability baseline without designing the Supabase database or implementing authentication behavior.

## Dependencies

- Phase 0 documentation is accepted.
- Current official documentation is reviewed for chosen package versions and configuration.
- Runtime and package-manager choices are recorded before scaffolding.

## Scope

- Initialize React, TypeScript, and Vite.
- Configure Tailwind CSS according to the selected current version.
- Add React Router and a minimal route structure.
- Add `@supabase/supabase-js` and a harmless typed client configuration foundation.
- Define public environment variables for the Supabase URL and publishable/anon key, with validation and an uncommitted local environment strategy.
- Configure ESLint, Prettier, Vitest, React Testing Library, and DOM test support.
- Establish an initial responsibility-based source structure based on `app/`, `components/`, `features/`, `hooks/`, `lib/`, `services/`, `types/`, and `utils/`, creating only folders/files justified by the initial shell.
- Build a minimal mobile-first responsive application shell and placeholders, without product feature behavior.
- Configure `vite-plugin-pwa`, manifest metadata, standalone display, service worker registration, and safe static-asset caching.
- Add valid placeholder icons if required, clearly marked for later replacement.
- Add focused initial rendering, routing, configuration, and PWA-related tests where practical.
- Document local setup, scripts, environment variables, and verification.

## Out of scope

- Supabase project or database creation
- SQL migrations, tables, RLS policies, database functions, or seed data
- sign-up, sign-in, sign-out, session behavior, or protected routes
- profiles, wallets, categories, transactions, transfers, dashboards, or reports
- service-role or privileged server configuration
- full offline financial data, mutation queues, IndexedDB sync, or conflict resolution
- production deployment selection or execution
- elaborate design-system work beyond the baseline shell

## Technical requirements

- Use strict TypeScript settings appropriate for an application codebase.
- Keep environment access centralized and fail clearly when required public configuration is absent.
- Use only browser-safe Supabase credentials; never introduce service-role variables into frontend conventions.
- Keep routing, providers, external clients, and feature placeholders separated by responsibility.
- Avoid speculative abstractions and unnecessary dependencies.
- Ensure formatting, linting, testing, type checking, development, and production build scripts are documented and reproducible.
- Use a test environment that catches user-visible behavior rather than relying only on snapshots.
- Limit service-worker caching to reviewed static assets. Exclude Supabase, auth, and financial API routes from broad runtime caching.
- Give the manifest a stable app identity, start URL, theme/background colors, standalone display mode, and valid icon references.
- Ensure the shell works at narrow mobile widths and remains usable at desktop widths.

## Acceptance criteria

1. A clean checkout can install dependencies with the documented package manager and start the development server.
2. The application renders a minimal Uangara shell without claiming that product features exist.
3. At least a root route and fallback/not-found behavior are defined and tested.
4. TypeScript strict checks pass with no unexplained suppressions.
5. ESLint and Prettier checks pass using documented commands.
6. Vitest and React Testing Library execute and initial meaningful tests pass.
7. A production build completes successfully and its preview can load the application shell.
8. Supabase client configuration uses only public environment variables, validates missing configuration clearly, and does not perform schema or auth work.
9. `.env` guidance and ignore rules prevent local values from being committed; an example file contains placeholders only.
10. The generated manifest is valid and references loadable icons.
11. The production application registers its service worker as designed and meets the chosen browser's current installability baseline.
12. Static shell assets have conservative cache behavior, and Supabase/auth/API requests are not broadly cached.
13. The shell is usable at representative mobile and desktop widths with no major overflow.
14. Documentation accurately records setup and verification results.
15. No Supabase schema, auth flow, financial feature, or offline transaction synchronization is introduced.

## Verification

The implementing agent must run and report the exact results of:

- dependency installation from the committed manifest/lockfile
- formatting check
- lint
- TypeScript type check
- automated tests
- production build
- production preview smoke test
- manifest and icon inspection
- service-worker registration/update inspection in a supported browser
- responsive checks at representative mobile and desktop widths
- repository search for service-role secrets and unintended financial/API caching rules

Any unavailable browser-specific audit must be reported as unverified, not assumed passing.

## Completion checklist

- [x] Project and quality toolchain initialized
- [x] Baseline structure and responsive shell created
- [x] Browser-safe Supabase client configuration documented
- [x] PWA manifest, icons, and service-worker foundation verified
- [x] Initial tests and all automated checks pass
- [x] Setup documentation updated
- [x] Phase 1 scope boundaries confirmed

## Verification results

Verified on 2026-08-30:

- `npm install` completed successfully and reported zero vulnerabilities.
- `npm run format:check` passed.
- `npm run lint` passed with zero warnings.
- `npm run typecheck` passed under the strict project configurations.
- `npm run test` passed: 2 test files and 6 tests.
- `npm run build` passed with Vite 8.2.2 and `vite-plugin-pwa` 1.3.0. The build generated `manifest.webmanifest`, `sw.js`, and the Workbox runtime with a static precache.
- Production preview returned HTTP 200 for the root route, SPA fallback route, manifest, service worker, and both manifest icons.
- Chrome reported zero manifest errors and zero installability errors; the generated service worker registered and reached the `activated` state.
- Browser measurements at 390×844 and 1440×1000 found no horizontal overflow and confirmed visible primary navigation.
- The generated service worker contains only the precache plus the SPA navigation fallback; it contains no Supabase URL or financial API cache rule.
- Repository and production-output searches found no service-role, secret-key, database-password, or PostgreSQL connection-string patterns.
- Scope review found no Auth behavior, protected routes, financial tables, migrations, RLS, RPC, wallet/transaction/transfer/category/reporting implementation, or offline financial synchronization.
- The directory was not a Git repository when Phase 1 began. Git was not initialized, and no remote assumptions were made.
