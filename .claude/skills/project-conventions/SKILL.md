---
name: project-conventions
description: Project-specific conventions and known gotchas for the Armados 2Go codebase. Use before editing global CSS/Tailwind color classes, any app/api/**/[id]/** route, or GPS/ruta-tracking code, since these areas have caused real bugs in production.
user-invocable: false
---

# Armados 2Go — Project Conventions

## CSS: gray-400 through gray-800 are forced to theme colors

`app/globals.css` overrides `.text-gray-400` through `.text-gray-800` with `!important` to point at the theme foreground token, for legacy dark-UI screens. This silently breaks contrast on any component with a light literal background that also uses those gray classes for text (e.g. `bg-white` + `text-gray-500`), since the override wins.

When adding text color on a light/white surface, use an explicit non-overridden class (`text-slate-*`, `text-neutral-*`) instead of `text-gray-400`–`text-gray-800`, or verify actual rendered contrast if you must use gray.

## Every `[id]` API route must scope by ownership, not just session

A session is proof of *who* is calling, not proof they're allowed to touch *this* record. This codebase previously shipped IDOR bugs on `GET /api/ordenes/[id]` and `GET /api/proyectos/[id]` — the route checked that a session existed but not that the session's user/project owned the requested id.

Any `app/api/**/[id]/**` route handler must filter the Prisma query by the authenticated user's scope (project membership, ownership, or role) in the `WHERE` clause — never fetch by id alone and check ownership after the fact in application code where it's easy to forget a branch.

## RutaPunto vs RegistroEstado — two different GPS data sources

`RutaPunto` rows are raw GPS pings captured on an interval (position, timestamp) — the source used for polyline/deviation analysis (`analizarDesvioRuta` in `lib/geomaps-helpers.ts`).

`RegistroEstado` rows are discrete state-change events (armador started/stopped a turno, arrived at cliente, etc.) — not a continuous trace, and not suitable for distance/speed calculations.

Don't reuse a `RegistroEstado` query for something that needs `RutaPunto`'s continuous trace, and vice versa — check which one an existing function or route already reads before adding a new query, since mixing them silently produces plausible-looking but wrong distances/speeds.

## Sequential DB writes in request handlers block the response

`app/api/auth/login/route.ts` used to await several non-critical writes (estadoLoggeo update, turno auto-start, audit log) before responding, adding ~10s to login. These were moved after the response using Next.js's `after()` API. When adding a new side-effect write to a hot request path, ask whether the client needs to wait for it — if not, defer it with `after()` rather than awaiting it inline.

## Prisma: sequential awaits in one handler are usually N+1

Several admin/report routes issued independent Prisma queries in sequence (`await a(); await b(); await c();`) when they had no data dependency on each other. Use `Promise.all([...])` for independent reads in the same handler.
