# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**v1.0.1 — CI hotfix.** npm install until package-lock.json is committed.

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | scaffold + tests + CI | PASS | commit b938180 |
| P1 | engine core + tests | PASS | commit fbb31d3 |
| P2 | 4-clock-times e2e; fps meter | PASS | commit d9560c8 |
| P3 | doorway regression e2e | PASS | commit 4545010 |
| P4 | interiors e2e; save round-trip | PASS | commit 4577f84 |
| P5+P6 | intro cutscene e2e; quest advances; dialogue validator | PASS | commit ebc77b7 |
| P7+P8+P9 | soak e2e; migration matrix; PWA offline; v1.0.0 | PASS | commit b27aec7 |
| hotfix | CI green without lock file | PENDING | awaiting CI |

## Action required (one-time, local)

Run `npm install` locally and commit `package-lock.json`, then revert the two
workflows to `npm ci` + `cache: npm` (see DECISIONS.log ADR-0015).
