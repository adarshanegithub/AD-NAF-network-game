# AS You Were · Implementation plan

## Build target

Implement the clarified specification for AS You Were within the workshop build block. First deliver one complete round with correct grading, explanatory feedback, retry, and advance. Then add content and polish through the same implementation.

**Hardest behavior to get right:** the five-step elimination with MED compared only between remaining paths from the same neighboring AS (leftmost ASN), and proving that every shipped round's answer matches what a real Cisco router would install whatever order the paths arrived in. With `bgp deterministic-med` off, a Cisco router compares paths two at a time, so the answer is order-independent only when the winner beats every other candidate head to head within the five modeled steps.

**First evidence we'll check:** Round 2.1 from the spec (AC2/AC3). Submitting A is correct, with ladder weight *tie* (0 = 0), local preference *decides* (150 > 100), and AS-path, origin and MED *not reached*. Submitting B is incorrect, names the misconception "a shorter AS-path beats a higher local preference", shows 150 vs 100, and leaves the round open.

## Stack and serving

- Semantic HTML, CSS, and native JavaScript modules. No framework, bundler, backend, or runtime model.
- DOM controls plus SVG only where a diagram helps teach the concept. No rendering dependency by default. If choosing Three.js or another library, record its version, loading strategy, reason, and accessible alternative here before implementation.
- `data/levels.json` for authored content; load it over HTTP using a relative URL.
- In-memory session state. Reload starts a fresh session, as specified. No persistence in v1.
- Static hosting, including a repository subpath such as GitHub Pages. Use relative asset paths and case-correct filenames.

Preview from the repository root after implementation creates `index.html`:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000**. On Windows use `py` in place of `python3`. Native modules and JSON fetching need a web server; opening the HTML with `file://` is not the supported run path. [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Proposed files and responsibilities

```text
index.html                   Semantic page shell and module entry point
style.css                    Layout, focus, feedback states, reduced motion
main.js                      Load → validate → start; render loading/errors
engine/
  rules.js                   Pure best-path selection, head-to-head check, evaluate(); no DOM or progress changes
  content.js                 Validate authored level data and source references
  state.js                   Session transitions, attempts, completion, restart
  feedback.js                Explain structured evaluation results
ui/
  render.js                  Briefing, challenge, feedback, and summary views
  controls.js                Input events and keyboard/focus behavior
data/
  levels.json                Briefings, challenges, hints, source records
tests/
  index.html                 Browser test runner with visible pass/fail summary
  fixtures.js                Spec "Cases" table and round values, transcribed by hand
  rules.test.js              Runs every fixture through selectBestPath, plus the head-to-head check
  state.test.js              Attempts, assistance, duplicate submit, progression
  content.test.js            Invalid/missing/ambiguous authored data; levels.json rounds match fixtures
README.md                    Actual run instructions, behavior, and evidence
```

Use `data/` and `tests/` at the root alongside `engine/` and `ui/`. Keep modules small enough to understand; combine view files if separate files add no value.

## Data contract

Define one document containing `schemaVersion`, `sources`, and `levels`. Each level has a unique ID, title, learning outcome, briefing, source IDs, and ordered rounds. Each round has a unique ID, domain-specific challenge, stable choice IDs where applicable, and ordered hints.

**Domain fields:** each round has `prefix` (string, always `"203.0.113.0/24"`), `candidates` (array of 2–4 paths), `expectedWinner` (a path ID) and `wrongChoices` (described below). Each candidate path has:

| Field | Type | Valid range / notes |
| --- | --- | --- |
| `id` | string | One uppercase letter (`"A"`–`"D"`), unique within the round |
| `peer` | string | IPv4 address in 192.0.2.0/24 (RFC 5737), unique within the round |
| `weight` | integer | 0–65535; higher wins |
| `localPref` | integer | 0–4294967295; higher wins |
| `asPath` | array of integers | 1–6 ASNs, each in the documentation range 64496–64511 (RFC 5398); only the length is compared; `asPath[0]` is the neighboring AS and is never authored separately |
| `origin` | string | `"i"` (0), `"e"` (1) or `"?"` (2); lower wins |
| `med` | integer | 0–4294967295, always present; lower wins, compared only within the same neighboring AS |

All candidates are modeled as valid eBGP-learned paths with reachable next hops; there is no field for iBGP, local origination or arrival order.

**Choice representation:** a single path ID. A submission is `{ pathId: "B" }`. A missing pathId, or one that is not a candidate in the round, is `invalid-input`. There is no "no winner" choice. Each round's `wrongChoices` maps every non-winning path ID to `{ reasonCode }`, where `reasonCode` comes from a fixed list in `engine/feedback.js` (for example `lower-is-better`, `scorecard-as-path`, `ignores-weight`, `higher-med-is-better`, `lowest-med-always-wins`). Every wrong choice therefore names a specific misconception.

**Validation rules:** reject the whole file, naming the level/round ID and the field, when any of these hold:

- **Malformed data:** `schemaVersion` or a required field is missing; a value has the wrong type or is out of range (this includes a missing MED); a level or round ID is duplicated; a path ID or peer is duplicated within a round; a source ID is unknown.
- **No single winner:** `selectBestPath` returns `content-error`. That happens when candidates reach MED from different neighboring ASes (`med-mixed-neighbor-as`), or are still tied after MED (`tied-after-med`, including two same-AS paths with equal MED).
- **Order-dependent winner:** the winner fails the head-to-head check, because `compareHeadToHead(winner, other)` does not pick the winner within the five steps for some other candidate.
- **Answer key disagrees with the evaluator:** `expectedWinner` is not the path the evaluator selects. The authored key is a cross-check and never overrides the rule engine.
- **Missing or invalid misconception:** `wrongChoices` is missing a non-winning path, lists the winner, or uses an unknown `reasonCode`.
- **Too many levels or rounds:** there are not exactly 3 levels with 2 rounds each.

The loader must validate the whole content file before starting. Show a useful content error with the level/round ID; do not count it as a learner attempt. Briefings and hints reference source records with a title, URL, section, and supported claim. Fixed wording and per-level content live in data; numeric reasoning may be assembled from evaluator results.

Do not invent a universal quiz schema that discards the domain's real structure. Adapt the [worked example's plan](https://github.com/automateyournetwork/NAF_AC6/blob/main/WORKSHOP/LAB/Examples/PrefixQuest/PLAN.md) only if it fits your game.

## Domain evaluation contract

```text
evaluate(challenge, answer) → {
  status: "correct" | "incorrect" | "invalid-input" | "content-error",
  expected: domain-specific canonical result, or null,
  reasonCode: stable identifier for the rule/misconception,
  evidence: structured values used to explain the decision
}
```

- This is a pure function: same inputs, same result; no DOM, timer, network, random choice, or score changes.
- Compute the result from `selectBestPath(candidates)`. This takes the candidate paths and returns the surviving path plus the ladder status at each step:

  ```text
  selectBestPath(candidates) → {
    status: "ok" | "content-error",
    survivor: path ID or null,
    reasonCode: null | "med-mixed-neighbor-as" | "tied-after-med",
    ladder: [ { step: "weight" | "localPref" | "asPathLength" | "origin" | "med",
                status: "tie" | "narrows" | "decides" | "not-reached",
                values: { [pathId]: value },   // remaining candidates only
                best: value,
                eliminated: [pathId],
                neighborAs: { [pathId]: asn } } ]   // MED step only
  }
  ```

  Algorithm: start with all candidates remaining. For each step in order (highest weight, highest local preference, shortest AS-path length, lowest origin code, lowest MED), find the best value among the remaining paths and eliminate the paths without it. The step's status is `tie` if nothing was eliminated, `narrows` if some paths were eliminated and two or more remain, and `decides` if exactly one remains. Once one path remains, the later steps are `not-reached`. At MED, if the remaining paths do not all share `asPath[0]`, return `content-error` / `med-mixed-neighbor-as`. If more than one path remains after MED, return `content-error` / `tied-after-med`.
- `compareHeadToHead(a, b)` runs the same five steps on just two paths (MED only if `a.asPath[0] === b.asPath[0]`) and returns `{ winner: id | null, decidedAt: step | null }`. The content validator requires the survivor to win against every other candidate.
- `evaluate(challenge, answer)` calls `selectBestPath`. It returns `correct` when `answer.pathId` equals the survivor. It returns `incorrect` with the round's `wrongChoices[pathId].reasonCode` and the ladder as evidence. Otherwise it returns `invalid-input` or `content-error`. The UI must not choose the correct answer by position, label, or animation destination.
- Distinguish a learner's incorrect decision from invalid input and broken authored content.
- Define accepted equivalent answers and reject unsupported ambiguity explicitly.
- Expected answers in tests come from independently reviewed cases. Don't calculate them by calling the same evaluator being tested.

**Feedback example:** in Round 3.1, the player submits C. The result is `incorrect`, with reasonCode `lowest-med-always-wins` and ladder evidence AS-path *narrows* (C out: 3 > 2). Shown text: *Misconception: "the lowest MED always wins."* "C has the lowest MED (5), but AS-path is step 3 and C's is longer (3 vs 2), so C is out before MED is checked. C also comes from AS 64501, so its MED would never be compared with A's or B's from AS 64500." The round stays open and attempts increase by one.

## Session transitions

```text
loading → briefing → awaiting-answer
                     ├─ invalid input → guidance → awaiting-answer
                     ├─ incorrect → feedback → retry same round
                     └─ correct → feedback → Next → next round/briefing/summary
loading/content failure → error screen → retry loading
confirmed Restart → fresh first briefing
```

The state module owns attempts, assistance, completed round IDs, current round, and current view. Selection and hints do not submit an answer. Count valid submissions only while a round is unsolved. Disable Submit after success; guard in state logic as well. Advance only through explicit Next. Restart requires confirmation; cancellation changes nothing.

## Interaction and visual direction

Translate the spec's five-gate selection ladder (route cards lined up before gates labeled WEIGHT, LOCAL PREF, AS-PATH, ORIGIN, MED, with each card's values aligned under the gate that reads them) into a compact challenge area, labeled controls, and a persistent explanation area. Use a clear type hierarchy and one consistent visual language. Motion should reveal a consequence, such as a losing card dropping out at the gate that eliminated it, stamped with its value ("AS-PATH 3 > 2"), while the MED gate reads the two remaining cards' neighbor-AS badges and stamps "Same AS 64500: compare MED". With reduced motion, the final ladder state appears immediately with the same text.

Use native controls where possible, move focus deliberately after screen changes, and announce feedback through a live region. Respect `prefers-reduced-motion`. Display textual values alongside diagrams. A learner must not need animation, color vision, pointer precision, or hover to reason about the answer.

## Implementation order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rule | Pure evaluator plus the spec's correct/wrong/boundary cases | Expected results pass independently of the UI |
| 2 · Complete one round | Briefing, challenge, feedback, retry, Next | One correct and one wrong path work in the browser |
| 3 · Add the curriculum | All scoped levels, validation, hints, session summary | Each shipped round agrees with its reviewed cases |
| 4 · Make it usable | Keyboard/focus, reduced motion, narrow layout, clear error states | Manual checks are recorded |
| 5 · Package the result | README, screenshot if available, optional hosting | Another attendee can run and explain the game |

Generate `tasks.md` from these slices and the actual acceptance criteria. Do not create a large task tree for hypothetical stretch features.

## Verification and reporting

Implement a dependency-free browser test runner at `tests/index.html` that imports the pure modules, runs all assertions, and shows totals plus failed case IDs. It must report zero discovered tests as failure. Open **http://localhost:8000/tests/** after starting the same server.

The spec's fixtures run against `selectBestPath`:

- **Transcribed by hand:** `tests/fixtures.js` copies every row of the spec's *Cases the implementation must satisfy* table, the six rounds' candidate values, the Level 3 briefing example and the unsupported examples. Expected survivors, ladder statuses, eliminated paths and reason codes are typed from the spec. They are never generated by calling the engine.
- **Fixture assertions:** `tests/rules.test.js` runs each fixture through `selectBestPath`. It asserts the survivor and the status at every step, for example Round 3.1: weight *tie*, localPref *tie*, asPathLength *narrows* (C eliminated), origin *tie*, med *decides*, survivor B. Unsupported fixtures must return `content-error` with the expected reasonCode.
- **Head-to-head check:** for each of the six rounds, `compareHeadToHead(survivor, other)` must return the survivor as winner, within the five steps, for every other candidate. The test also asserts each round's expected `decidedAt` (Round 3.2: A beats B at `med`, and C at `origin`). A negative fixture (the spec's mixed-AS example) must fail the check.
- **Data matches fixtures:** `tests/content.test.js` checks that each round in `data/levels.json` has the same candidate values and expected winner as its fixture, so authored data cannot drift from the reviewed cases.

| Check | What must be established |
| --- | --- |
| Domain cases | Correct, plausible wrong, and boundary outcomes for the supported model |
| Input/content failures | Invalid submissions do not consume attempts; malformed content cannot be graded |
| State transitions | Retry, hints, duplicate submission, level completion, final summary, restart/cancel |
| Source review | Each briefing and explanation agrees with the cited technical rule |
| Browser playthrough | Fresh start to summary, keyboard-only core actions, readable feedback |
| Layout/motion | Typical laptop, narrow viewport, reduced motion |
| Hosting, if used | Assets and data load under the published repository path |

For each required acceptance criterion, record **pass / fail / not run**, the date, environment, and evidence in the README or a linked verification note. The test runner checks code behavior; a human still reviews the teaching content and actual interaction.

## Scope controls

No persistence, multiplayer, runtime AI, procedural scenario generator, editor, or audio in v1. If time runs short, propose the smallest coherent reduction to the specification and update the tasks. Do not hide skipped checks or silently weaken correctness.
