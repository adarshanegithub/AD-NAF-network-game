# Implementation Plan: AS You Were — First Playable Version

**Branch**: `main` (spec directory `specs/001-first-playable`) | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-first-playable/spec.md`, design contract
`StarterKit/PLAN.md`, constitution `.specify/memory/constitution.md` v1.0.0.

## Summary

A static browser game in which the learner picks the BGP path a Cisco IOS router installs, then
reads a five-step ladder that shows why. A pure function, `selectBestPath(candidates)`, returns the
surviving path and the status of each step (*tie*, *narrows*, *decides*, *not reached*). The game
grades with it, and the tests check it against the spec's hand-verified fixtures, including the
head-to-head check. This plan also resolves two constitution conflicts:

- **Feedback text is tested.** Every wrong-choice, correct-answer, worked-step, guidance, and hint
  string is compared exactly to fixtures, not just the winner and statuses ([research R4](research.md)).
- **Rounds carry a difficulty.** A required `difficulty` field (1–3, non-decreasing in play
  order) is part of the round data ([research R5](research.md)).

## Technical Context

**Language/Version**: JavaScript (ES2020 native modules), HTML5, CSS3

**Primary Dependencies**: none (no framework, bundler, or runtime library)

**Storage**: `data/levels.json` (authored content, fetched by relative URL); session state in memory only

**Testing**: dependency-free browser test runner at `tests/index.html` importing the pure modules

**Target Platform**: current desktop Chrome, Firefox, Safari, and Edge; static hosting (including a repository subpath)

**Project Type**: static single-page web game

**Performance Goals**: feedback and ladder appear immediately after Submit; no animation delays controls (principle IV)

**Constraints**: works from static files only; no account, backend, network service, or AI at runtime; usable at about 360 px wide; honors `prefers-reduced-motion`

**Scale/Scope**: 1 mechanic, 3 levels, 6 rounds, 2–3 candidates per round, one player per browser tab

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
| --- | --- | --- | --- |
| I · Technical truth | Every round matches a hand-verified fixture citing Cisco 13753; automated checks compare evaluator output **and feedback text** | Pass (conflict 4 to resolve) | **Pass:** exact-text fixtures for all feedback ([feedback-text](contracts/feedback-text.md)); content rejected without a Cisco source |
| II · Teaches through a decision | Every wrong choice names a misconception; help goes method → worked step → worked solution | Pass | **Pass:** misconception catalog with step-agreement check; help levels 1–3 gated in order |
| III · Honest progress | Attempts only for valid unsolved submissions; no double completion; separate figures | Pass | **Pass:** state transitions in [data-model](data-model.md) |
| IV · Access | Keyboard, visible focus, text not just color, reduced motion, narrow window | Pass | **Pass:** native controls, live region, reduced-motion path ([research R8](research.md)) |
| V · Deterministic, self-contained | Static files only; no runtime AI or service | Pass | **Pass:** no dependencies |
| VI · Content and logic separate | Content (with **difficulty**) in data; rules separate; key cannot override engine | Pass (conflict 5 to resolve) | **Pass:** `difficulty` field; `expectedWinner` is only a cross-check |
| VII · Done is demonstrated | Recorded results; scope fixed | Pass | **Pass:** [quickstart](quickstart.md) lists automated and manual checks to record |

No violations; Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-first-playable/
├── plan.md              # This file
├── research.md          # Decisions R1–R8
├── data-model.md        # Content, round, path, misconception catalog, session state
├── quickstart.md        # Run and validation guide
├── contracts/
│   ├── rules-api.md     # selectBestPath, compareHeadToHead, checkHeadToHead, evaluate
│   ├── content-schema.md# levels.json shape and every rejection rule
│   └── feedback-text.md # exact feedback strings and templates
├── checklists/requirements.md
└── tasks.md             # Next: /speckit-tasks
```

### Source Code (repository root)

```text
index.html                 Page shell; module entry point
style.css                  Layout, focus styles, ladder states, reduced motion, narrow layout
main.js                    Load → validate all content → start, or show content error
engine/
  rules.js                 STEPS, selectBestPath, compareHeadToHead, checkHeadToHead, evaluate
  content.js               validateContent (structure, values, rule and feedback agreement)
  feedback.js              explain(): misconception labels, correct/worked-step templates
  state.js                 Session transitions, attempts, help levels, summaries, restart
ui/
  render.js                Briefing, round (table + path cards + ladder), summaries, error
  controls.js              Events, focus movement, live-region announcements
data/
  levels.json              3 levels × 2 rounds, sources, method text, misconception catalog
tests/
  index.html               Runner: totals, failed IDs; zero tests = failure
  fixtures.js              Hand transcription of the spec's tables and expected strings
  rules.test.js            Ladder fixtures + head-to-head check
  feedback.test.js         Exact text for all feedback kinds
  content.test.js          levels.json equals fixtures; each rejection rule on a broken copy
  state.test.js            Attempts, help, duplicate submit, progression, restart
README.md                  Run instructions, model simplifications, recorded verification
```

**Structure Decision**: single static web project at the repository root, as proposed in
`StarterKit/PLAN.md`, with `feedback.test.js` added so text checks are a separate suite.

## Implementation Order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rule | `rules.js`, `feedback.js`, `fixtures.js`, rules and feedback tests | All ladder, head-to-head, and text fixtures pass |
| 2 · Complete one round | Round 2.1 playable: briefing, table, cards, Submit, feedback, retry, Next | AC2/AC3 work in the browser |
| 3 · Add the curriculum | `levels.json` (all six rounds, difficulty), `content.js`, help levels, level and session summaries | Content tests pass; each round agrees with its fixture |
| 4 · Make it usable | Keyboard and focus, reduced motion, narrow layout, content-error screen | Manual checks 6–8 recorded |
| 5 · Package | README with run/test commands, simplifications, and verification record | Another attendee can run and explain it |

## Open Items

- **Level summary screen:** spec AC7 now states the flow from FR-014 ([research R6](research.md));
  `/speckit-clarify` question 2 was not answered, so the user may still change it.
- **Canonical artifacts:** `specs/001-first-playable/` supersedes `StarterKit/SPEC.md` and
  `StarterKit/PLAN.md`, which remain the workshop inputs and are kept consistent with it.
- **Human source review:** every fixture cites Cisco 13753; the reviewer's name and date are
  recorded at release (T036).
