# PWA Strategy

## Purpose

Uangara is intended to feel at home on a phone while remaining a web application. PWA capability is an architectural foundation from project setup, not a promise that every financial function works offline.

## Initial goals

- mobile-first responsive layouts
- an installable web app manifest
- appropriate application name, theme metadata, and standalone display mode
- valid app icons, initially placeholders if necessary
- a registered service worker through the chosen Vite PWA integration
- safe caching of versioned static assets and the application shell
- an installability baseline verified in a production build

These goals begin in Phase 1 and receive experience polish later.

## Installability is not offline financial functionality

PWA installability means the browser can install and launch Uangara in an app-like window with the required manifest and service worker foundations.

It does **not** mean users can safely create, edit, or transfer financial records while disconnected. The initial MVP must not promise full offline transaction functionality. Authenticated API responses and sensitive financial payloads should not be broadly or persistently cached by default.

When offline, the initial product may show a clear connectivity state or a safe fallback, but it should not pretend an uncommitted financial write has succeeded.

## Initial caching posture

- Precache only reviewed, versioned static assets needed for the shell.
- Use conservative update and cache-expiration behavior.
- Exclude Supabase API calls, auth endpoints, tokens, and user-specific financial responses from general runtime caching.
- Review whether logout should clear any user-related local state.
- Test service-worker updates so stale application code does not silently persist indefinitely.

Exact caching rules will be selected during implementation and security review.

## Future offline possibilities

A later phase may investigate:

- IndexedDB-backed local financial data
- offline transaction capture and a visible pending state
- durable synchronization queues
- idempotency keys and retry behavior
- ordering, conflict detection, and user-guided resolution
- encrypted or otherwise protected local sensitive data
- session expiry and multi-device reconciliation

These capabilities require a domain, security, and data-consistency design before implementation. They are future work and outside the initial MVP.

## Verification direction

PWA phases should verify the production manifest, icon references, service-worker registration and updates, standalone metadata, responsive behavior, safe offline fallback, and absence of unintended financial API caching. Browser installability criteria can change, so implementation phases should verify against current browser and plugin documentation.

