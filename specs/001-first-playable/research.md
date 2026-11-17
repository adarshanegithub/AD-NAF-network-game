# Research: AS You Were — First Playable Version

All Technical Context items were resolved from `StarterKit/PLAN.md`, the clarified spec, and the
constitution. No NEEDS CLARIFICATION items remain.

## R1 · Stack

- **Decision:** semantic HTML, CSS, and native JavaScript modules (ES2020). No framework,
  bundler, backend, or runtime dependency. Round data in `data/levels.json`, fetched by relative
  URL.
- **Rationale:** matches the user's direction and constitution principle V (self-contained,
  static files only). Native modules need an HTTP server, not a build step.
- **Alternatives considered:** a framework (rejected: user excluded it, adds a dependency);
  inline JS data (rejected: principle VI wants content in editable data separate from logic).

## R2 · Preview and test serving

- **Decision:** `python3 -m http.server 8000` from the repository root; game at
  `http://localhost:8000/`, tests at `http://localhost:8000/tests/`.
- **Rationale:** the user's chosen command. Modules and `fetch` do not work over `file://`.
- **Note:** without `--bind 127.0.0.1` the server listens on all interfaces. The README will say
  so and show the bound form as an option.

## R3 · Best-path function shape

- **Decision:** `selectBestPath(candidates)` returns `{ status, survivor, reasonCode, ladder }`,
  one ladder entry per step with `tie | narrows | decides | not-reached`, the remaining paths'
  values, and eliminated IDs. `compareHeadToHead(a, b)` runs the same steps on two paths.
- **Rationale:** the user asked for a function that returns the surviving path plus the status
  at each step. A separate head-to-head function proves agreement with Cisco's pairwise
  comparison when `bgp deterministic-med` is off (spec FR-003).
- **Alternatives considered:** computing only the winner (rejected: the ladder is the teaching
  output and must be tested); simulating arrival order (rejected: out of scope; the head-to-head
  check is enough to prove order-independence).

## R4 · Feedback text and how tests compare it (resolves constitution conflict 4)

- **Decision:** three kinds of text, each compared exactly against hand-transcribed fixtures:
  1. **Wrong-choice text:** the misconception label comes from a fixed catalog keyed by
     `reasonCode`; the explanation is authored per wrong choice in `levels.json`; the next-step
     line is fixed. Tests compare all three strings, and the assembled message, to
     `tests/fixtures.js`, which is copied from the spec's *Wrong-choice Fixtures* table.
  2. **Correct-answer text:** generated from the ladder by a fixed template (see
     [contracts/feedback-text.md](contracts/feedback-text.md)). Tests compare it to hand-written
     expected strings for all six rounds.
  3. **Worked-step text:** generated from ladder step 1 by a fixed template; compared the same way.
- **Agreement check:** because wrong-choice explanations are authored, the content validator also
  checks them against the evaluator: the `reasonCode` must fit the step where that path was
  eliminated (rules in [contracts/content-schema.md](contracts/content-schema.md)), and every number
  in the explanation must be a value the round actually contains. That way authored wording
  cannot contradict the rule engine (principle VI).
- **Rationale:** the constitution requires automated checks to compare feedback text, not just
  the winner and statuses. Authored explanations keep the spec's exact teaching wording;
  generated correct-answer and worked-step text keeps numbers tied to the evaluator.
- **Alternatives considered:** generating wrong-choice text from templates (rejected: the spec's
  ten explanations differ in structure, for example 1.1 C adds a sentence about ASNs, so
  templates would be large and brittle); comparing only key phrases (rejected: weaker than the
  constitution asks).

## R5 · Difficulty field (resolves constitution conflict 5)

- **Decision:** every round has a required integer `difficulty` from 1 to 3. Values in v1:
  1.1 = 1, 1.2 = 1, 2.1 = 2, 2.2 = 2, 3.1 = 3, 3.2 = 3. Validation rejects a missing or
  out-of-range value, or a round whose difficulty is lower than the round before it in play
  order. The round header shows "Difficulty 2 of 3".
- **Rationale:** principle VI stores difficulty in editable data. A non-decreasing rule makes the
  field checkable rather than decorative, and matches the spec's level-by-level sequence.
- **Alternatives considered:** a level-only difficulty (rejected: the constitution names it with
  per-challenge content, and per-round allows a future harder round within a level); a free-text
  label (rejected: not validatable).

## R6 · Level summary screen (clarify question 2, unanswered)

- **Decision (recorded in spec AC7 from FR-014; user may override):** after a level's second round, Next shows a level summary (completed
  rounds, valid attempts, help used) whose own Next opens the next level's briefing; after Level 3
  it is followed by the session summary.
- **Rationale:** spec FR-014 requires a level summary; this was the recommended option in
  `/speckit-clarify`, which ended before it was answered. Spec AC7 now states this flow so spec,
  data model, and tasks agree; changing it is a spec edit, not an implementation choice.
- **Alternatives considered:** no level summary (conflicts with FR-014); figures inside the next
  briefing.

## R7 · Help levels

- **Decision:** per-round help level 0–3. Hint (1) = fixed method text; worked step (2) = step 1
  of this round's ladder; worked solution (3) = full ladder. Each button is enabled only after the
  previous level was viewed. Each level viewed is recorded once per round as assistance.
- **Rationale:** spec AC5–AC5c and constitution principle II.

## R8 · Accessibility approach

- **Decision:** native `<button>` and radio-group path cards inside a `<fieldset>`; a real
  `<table>` for candidate values; one `aria-live="polite"` region for feedback; focus moved to
  the feedback heading after Submit and to the new heading after Next; `prefers-reduced-motion`
  disables the gate animation and shows the final ladder state at once.
- **Rationale:** spec AC9/AC10, constitution principle IV. Native controls give keyboard support
  without custom key handling.
