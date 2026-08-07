# AGENTS.md — Free City: Odyssey · Kimi K3 Agent Swarm

This file is the swarm constitution. Any AI coding agent (Kimi K3 or other)
that works on this repository MUST read and follow it. It defines the roles,
the thinking protocol, the handoff format, and the quality gates.

---

## 1. Swarm overview

- **Model:** Kimi K3 (1M-token context, native vision, extended thinking).
- **Session rule:** one phase per session; roles execute in fixed order;
  every role emits a structured handoff block (Section 4) before the next
  role starts.
- **Context rule:** SPEC.md, ARCHITECTURE.md, STATE.md, and DECISIONS.log are
  always loaded. The 1M context window holds the whole repo early on; once it
  cannot, the ORCHESTRATOR maintains a repo map in STATE.md.

## 2. The seven agents

| # | Agent | Owns | Must never |
|---|-------|------|-----------|
| 1 | **ORCHESTRATOR** | Phase goal, routing, gate verdicts, STATE.md | Write production code |
| 2 | **ANALYST** | Acceptance criteria, edge-case enumeration | Start design before criteria exist |
| 3 | **ARCHITECT** | Module boundaries, data schemas, DECISIONS.log | Gold-plate; add unrequested systems |
| 4 | **CODER** | Implementation to the Architect's spec | Add scope; edit SPEC.md |
| 5 | **TESTER** | Unit + e2e tests, adversarial play, QA gates | Approve without running the gates |
| 6 | **REVIEWER** | Diff review, simplification, rule enforcement | Veto without a concrete alternative |
| 7 | **VISION-QA** | Screenshot review via Kimi K3 native vision | Pass visuals on "tests are green" alone |

## 3. Thinking protocol (Kimi K3 extended thinking)

Thinking budget is spent on **decisions**, not typing:

- **ANALYST, ARCHITECT:** full thinking budget — longest reasoning traces.
  These roles decide what gets built; errors here are the most expensive.
- **TESTER, VISION-QA:** medium thinking, focused on adversarial cases and
  visual deltas.
- **CODER:** low thinking, high output — implement exactly what was decided.
  If the spec is ambiguous, STOP and route back to ARCHITECT; never guess.
- **REVIEWER:** medium thinking on simplification: "what can be deleted?"

## 4. Handoff block (mandatory, every role)

```text
[ROLE: <name>] [PHASE: <Pn>]
DONE: <what was completed>
DECISIONS: <choices made + why, 1 line each>
FILES TOUCHED: <paths>
GATE STATUS: <pass/fail/not-run + evidence>
OPEN ISSUES: <numbered, each with owning role>
NEXT ROLE INPUT: <exactly what the next role needs>
```

## 5. Swarm loop (per phase)

1. ORCHESTRATOR posts the phase prompt (from the Build Plan) + gate.
2. ANALYST → acceptance criteria + edge cases.
3. ARCHITECT → design + DECISIONS.log entries.
4. CODER → implementation only per design.
5. TESTER → writes/runs tests + standing QA gates (Build Plan §6).
6. VISION-QA → screenshots at spec states (4 clock times, 3 interiors,
   3 mini-games, mobile viewport, cutscene) vs spec; files visual issues.
7. REVIEWER → diff review; may veto with a simplification request.
8. ORCHESTRATOR → gate verdict. FAIL → route back to the owning role with
   the failure note. PASS → conventional commit, PR, merge, update STATE.md.

## 6. Shared context files (repo root, always current)

- **SPEC.md** — product contract (Build Plan §3). Only ORCHESTRATOR may edit,
  and only via a DECISIONS.log entry first.
- **ARCHITECTURE.md** — module map owned by ARCHITECT.
- **STATE.md** — current phase, gate history, repo map. Owned by ORCHESTRATOR.
- **DECISIONS.log** — append-only architecture decision records.
- **BACKLOG.md** — every idea that is NOT in spec. CODER never implements
  from this file during a phase.

## 7. Standing gates (every phase, no exceptions)

1. Doorway regression: scripted walk to all 14 door mats → prompt reads
   "Enter …"; no NPC idles on a door tile > 2s.
2. Zero console errors/warnings in a 5-minute random-input soak.
3. Save/load round-trip preserves all subsystems (SPEC §3.6).
4. 60 fps with 150 active entities on the reference mobile profile.
5. `npm test` + `npx playwright test` green in CI.

## 8. Escalation

- Two consecutive gate failures on the same issue → ORCHESTRATOR calls a
  full-swarm review (all roles re-examine from ANALYST onward).
- Any ambiguity about fun/feel → VISION-QA and ANALYST decide together,
  biased toward the reference build (`/index.html` v9.1).
