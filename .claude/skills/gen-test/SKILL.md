---
name: gen-test
description: Scaffold a Vitest test file for a lib/ module, following this repo's existing test conventions (Spanish test names, describe-per-export, realistic domain fixtures). Invoke as /gen-test <path-to-module>.
disable-model-invocation: true
---

# Generate Test

Scaffold a Vitest test file for the given module, matching the conventions already used in `tests/lib/*.test.ts` (see `tests/lib/geomaps-helpers.test.ts` and `tests/lib/rate-limit.test.ts` as reference).

## Steps

1. Take the module path from `$ARGUMENTS` (e.g. `lib/geomaps-helpers.ts`). If no argument was given, ask which module to test.
2. Read the module and identify its exported functions/types.
3. Read 1-2 existing files under `tests/lib/` to match current style exactly:
   - Import from `vitest`: `describe, it, expect` (add `vi` only if mocking is needed).
   - Import the module under test via the `@/` path alias.
   - One `describe` block per exported function, named after the function.
   - Test names are short Spanish sentences describing the behavior (`"retorna 0 cuando..."`, `"calcula distancia..."`, `"detecta..."`).
   - Use realistic domain values already used elsewhere in the codebase when relevant (San Salvador/Santa Ana coordinates for geo functions, real-shaped IDs, etc.) rather than arbitrary placeholders.
   - Cover: the normal case, an edge case (zero/empty/equal inputs), and one case tied to a business rule (a threshold, a limit, a rejection).
4. Write the new file to `tests/lib/<module-name>.test.ts` (or the matching subdirectory if the module lives in a subdirectory of `lib/`, e.g. `tests/lib/ai/` for `lib/ai/*`).
5. Run `npx vitest run <new-file>` to confirm it passes before handing back to the user, and fix any import/type errors found.
6. Report which functions got coverage and which (if any) were skipped because they need infrastructure (DB, network) — those need a mock, not a skip; flag that decision to the user rather than silently omitting.
