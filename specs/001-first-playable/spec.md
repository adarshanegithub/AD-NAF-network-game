# Feature Specification: AS You Were — First Playable Version

**Feature Branch**: `main` (no feature branch created; spec directory `specs/001-first-playable`)

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Specify the first playable version of AS You Were from StarterKit/SPEC.md, preserving its learning outcomes, non-goals, and acceptance criteria. Also: add wrong-choice fixtures with named misconceptions for picking path C in Round 1.1 and path C in Round 2.2; change AC5 so the hint gives the method first and the worked solution only as a separate later step."

**Source**: `StarterKit/SPEC.md`, governed by `.specify/memory/constitution.md` v1.0.0. Acceptance
criteria keep their original IDs (AC1–AC10) so they can be traced to the source.

## Overview

The player is the route selector inside a single Cisco IOS router that has learned several BGP
paths to prefix 203.0.113.0/24. Each round shows the candidate paths with their weight, local
preference, AS-path, origin code, neighboring AS, and MED. The player picks the path the router
will install. A correct pick shows a step ladder: earlier steps marked *tie* or *narrows*, the
deciding step marked *decides*, later steps *not reached*. A wrong pick leaves the round open, and
the feedback names the misconception, shows the values at the step the player skipped or misapplied,
and suggests a next step. The session ends when all six rounds across three levels are solved and
the session summary is shown.

**Learner:** network engineering students and early-career network engineers who have configured
or read about BGP but have not yet internalized the order of the best-path comparisons. They
know what a prefix and an AS number are, and that a router can learn several paths to one prefix.
No knowledge of the attributes themselves is assumed.

**Why interaction helps:** learners treat best-path selection as a scorecard (the path that "looks
best overall") instead of checking steps in order, and assume the lowest MED always wins. Picking
a winner and seeing the step ladder makes both errors visible.

### Learning Outcomes (preserved)

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Identify the single attribute that decides between candidates when every other modeled attribute ties | Pick the winning path in a round where only one attribute differs | Correct path submitted in both Level 1 rounds; the ladder shows the deciding step |
| LO2 | Apply the comparison order when an earlier step favors one path and a later step favors another | Pick the winner when a decoy has a more attractive later attribute (shorter AS-path, better origin, higher local preference against weight) | Correct path submitted in both Level 2 rounds without choosing the decoy as the final answer |
| LO3 | Explain why the lowest MED does not always win: MED is compared only among paths still remaining after the earlier steps, and only between paths from the same neighboring AS | Pick the winner when a decoy from a different neighboring AS has the lowest MED but loses at an earlier step, leaving two same-AS paths for MED to decide | Correct path submitted in both Level 3 rounds without choosing the lowest-MED decoy as the final answer; the ladder shows the decoy out at its earlier step and MED *decides* between the two same-AS paths |

## Clarifications

### Session 2026-11-17

- Q: If a round's content is broken (for example, still tied after MED, or the authored winner disagrees with the rule), what should the game do? → A: Check all content before play starts; if any round is broken, the game does not start, and an error screen names the level, round, and problem, with no grading or progress.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Make and understand a decision (Priority: P1)

As a learner, I want to apply the best-path rule to visible evidence, submit one path, and
understand why it was right or which misconception made it wrong.

**Why this priority**: This is the core mechanic. Without it there is no game and no learning
outcome can be demonstrated.

**Independent Test**: Load Round 2.1 alone, submit B then A, and confirm the incorrect and correct
feedback and ladder match the fixtures.

**Acceptance Scenarios**:

1. **AC1** — **Given** a fresh session, **When** I start, **Then** I see the first briefing before
   any challenge can be answered.
2. **AC2** — **Given** Round 2.1 (A: local pref 150, AS-path length 4; B: local pref 100, AS-path
   length 2; all else equal), **When** I submit Path A, **Then** Path A is marked as the installed
   best path, the ladder shows weight *tie* (0 = 0), local preference *decides* (150 > 100), and
   AS-path, origin, and MED *not reached*, and an explanation appears.
3. **AC3** — **Given** that challenge, **When** I submit Path B, **Then** the feedback names the
   misconception "a shorter AS-path beats a higher local preference", identifies local preference
   as step 2 and shows 150 vs 100, completion stays unchanged, and I can retry.
4. **AC4** — **Given** no selection, **When** I submit, **Then** the guidance reads "Pick a path
   before submitting." and attempts and completion stay unchanged.
5. **Given** any round in the *Wrong-choice fixtures* table, **When** I submit that wrong path,
   **Then** the feedback shows that row's named misconception and explanation text, and the round
   stays open.

---

### User Story 2 - Learn from help and finish the game (Priority: P1)

As a learner, I want graduated help when I'm stuck, and a clear view of my progress through all
three levels.

**Why this priority**: Constitution principles II and III require help that teaches before it
answers, and progress that cannot be gamed. Completing six rounds is the release scope.

**Independent Test**: In one round, request the hint, then the worked step, then the worked solution.
Confirm each appears only after its own request, is recorded as assistance, and does not complete
the round. Then solve all six rounds and reach the summary.

**Acceptance Scenarios**:

1. **AC5 (revised)** — **Given** an unsolved round, **When** I request a hint, **Then** I see only
   the method: "Check the steps in order: weight, local preference, AS-path, origin, MED. At each
   step, drop the paths that lose; the step that leaves one path decides." No round values, step
   statuses, or answer are shown with it.
2. **AC5a** — **Given** I have seen the method hint, **When** I request more help, **Then** I see a
   worked step: the first modeled step applied to this round's values, with its status.
3. **AC5b** — **Given** I have seen the worked step, **When** I separately and explicitly request
   the worked solution, **Then** the full step ladder for the round is shown. The worked solution is
   never shown with, or instead of, the method hint, and is unavailable until the earlier help has
   been viewed.
4. **AC5c** — **Given** I have used any help, **Then** each level of help I viewed is recorded as
   assistance, the round is still not complete, and I must still submit the correct path to solve
   it.
5. **AC6** — **Given** an unsolved round, **When** I make a valid submission, **Then** it counts as
   one attempt. A correct submission completes the round once; submitting again after success has
   no effect on attempts or completion.
6. **AC7** — **Given** both rounds of a level are solved, **Then** the level is complete. After the
   first round of a level, Next opens the level's second round. After the second round, Next opens
   the level summary (completed rounds, valid attempts, and assistance used for that level, each
   shown separately); its Next opens the following level's briefing, or after Level 3 the session
   summary showing the same three figures for the whole session.
7. **AC8** — **Given** a session in progress, **When** I choose Restart, **Then** I am asked to
   confirm. Confirming clears the session and returns to the first briefing; cancelling leaves the
   session unchanged.

---

### User Story 3 - Play with accessible controls (Priority: P1)

As a keyboard user, I want to inspect the challenge, choose, submit, get help, and advance without
a mouse, and understand every result without relying on color or motion.

**Why this priority**: Constitution principle IV makes access part of the core game, not polish.

**Independent Test**: Play from the first briefing to the session summary using only the keyboard,
once with reduced motion enabled and once in a narrow window.

**Acceptance Scenarios**:

1. **AC9** — **Given** any screen, **Then** every core control has a visible focus indicator and an
   accessible name, and the keyboard reaches every core action in an understandable order. The
   candidate table has column headers, and each path card's accessible name includes its label and
   neighboring AS.
2. **AC10** — **Given** a submission, **Then** correct or incorrect feedback is shown in text,
   stays available to read, and is announced to assistive technology. Ladder statuses use words
   (*tie*, *narrows*, *decides*, *not reached*, and *out* for an eliminated path) as well as color.
   With reduced motion, the same information appears without animation and without delay.
3. **Given** a narrow browser window, **When** I play a round, **Then** all candidate values remain
   readable (scrolling within a labeled container is allowed) and Submit, Hint, and Next stay
   visible.

---

### Edge Cases

- **Empty submission:** guidance only; no attempt counted (AC4).
- **Repeated Submit after success:** no second completion or attempt (AC6).
- **Help before any attempt:** allowed; recorded as assistance; does not complete the round.
- **Equal-length AS-paths with different ASNs:** AS-path is a *tie*; ASN values are never compared.
- **MED of 0:** a valid, best-possible MED.
- **Two same-AS paths reach MED with equal MED, or paths from different neighboring ASes reach
  MED, or paths are still tied after MED:** unsupported content. The game does not start; the
  content error screen names the level, round, and problem (FR-005). Nothing is graded and no
  progress is recorded.
- **Authored winner disagrees with the rule, or a wrong choice has no named misconception:**
  unsupported content, as above.
- **Reload:** starts a fresh session (no saving across reloads in this version).
- **Content cannot be loaded:** an error screen with a retry option; no progress is recorded.

## Requirements *(mandatory)*

### Functional Requirements

**Rule and grading**

- **FR-001**: The game MUST grade every submission with the five-step rule in *Domain Model Being
  Taught*. The same inputs MUST always produce the same result.
- **FR-002**: The game MUST mark a submission correct only when it names the single path that
  survives all five steps.
- **FR-003**: Every shipped round MUST have exactly one winning path within the five modeled steps,
  and that path MUST beat every other candidate head to head within those steps. This keeps the
  answer the same as a real Cisco router's, whatever order the paths arrived in.
- **FR-004**: Every shipped round's winner, step statuses, and feedback MUST match its hand-verified
  fixture in this specification.
- **FR-005**: All six rounds MUST be checked before play starts. If any round breaks FR-003,
  FR-004, or any unsupported-content rule in *Edge Cases*, the game MUST NOT start: it shows an
  error screen naming the level, round, and problem, grades nothing, and records no progress.
  Partial play (skipping or stopping at a broken round) is not allowed.

**Teaching and feedback**

- **FR-006**: Each level MUST open with a briefing that introduces its concept and a worked example
  that is different from the level's challenges, before any challenge in that level can be
  answered. The worked examples and their explanation text are exactly those in *Briefing worked
  examples*; the first briefing also shows the *Briefing wording* about the modeled steps.
- **FR-007**: The challenge MUST show the prefix, the step order with each step's winning direction
  (higher or lower), and every candidate's label, peer address, neighboring AS (highlighted in its
  AS-path), weight, local preference, AS-path with its length, origin, and MED. Nothing needed to
  answer may be hidden behind hover.
- **FR-008**: Every incorrect submission MUST show the misconception named in *Wrong-choice
  fixtures*, the values at the step the player skipped or misapplied, and a next step ("Try again:
  start at weight and stop at the step that leaves one path."). A bare "incorrect" is not allowed.
- **FR-009**: Every correct submission MUST show the step ladder and explain why the winner won.
- **FR-010**: Help MUST come in three separately requested levels, in this order: (1) the method
  only, (2) a worked step for this round, (3) the full worked solution. Each level becomes available
  only after the previous one has been viewed.

**Progress**

- **FR-011**: Valid incorrect submissions MUST count as attempts and leave the round open. Empty
  submissions MUST NOT count.
- **FR-012**: A round MUST complete at most once, and only on a correct submission. Help MUST
  NOT complete a round.
- **FR-013**: The game MUST have no lives, timer, points, streaks, leaderboard, or penalty for
  hints or retries.
- **FR-014**: The level summary and session summary MUST show completed rounds, valid attempts,
  and assistance used as separate figures.
- **FR-015**: Progression MUST be sequential on the first playthrough. A level completes when both
  of its rounds are solved; the session completes when all six are solved.
- **FR-016**: Restart MUST require confirmation. Reload MUST start a fresh session.

**Access and self-containment**

- **FR-017**: All core interactions MUST work by keyboard alone with visible focus (AC9).
- **FR-018**: Results MUST be conveyed in text, not color or motion alone. Reduced-motion
  preferences MUST be honored, and animation MUST NOT delay feedback or controls (AC10).
- **FR-019**: The game MUST be playable without an account, backend service, live device, or AI
  model. No external service may decide an answer.

### Domain Model Being Taught

Cisco IOS default BGP best-path behavior on one router, modeling only the first five steps.
Starting with all candidates, at each step the remaining paths without the best value are
eliminated. The step that leaves one path *decides*. A step that eliminates some paths but leaves
two or more *narrows*. A step that eliminates nothing is a *tie*. Steps after the deciding step are
*not reached*.

1. **Highest weight** (Cisco-proprietary, local to this router; default 0).
2. **Highest local preference** (default 100).
3. **Shortest AS-path** (count of ASNs; ASN values are never compared).
4. **Lowest origin code** (`i` IGP = 0 < `e` EGP = 1 < `?` incomplete = 2).
5. **Lowest MED**, compared only between paths whose neighboring AS (leftmost ASN) is the same.

**Configuration:** `bgp always-compare-med`, `bgp deterministic-med`, and
`bgp bestpath med missing-as-worst` are off.

**Assumptions about candidates:** every candidate is a valid eBGP-learned path to the same prefix
with a reachable next hop and an explicit MED. None is locally originated. All candidates are shown
at once; arrival order is not something the player reasons about.

**Briefing wording:** "This router follows Cisco's default rules. We model the first five steps
only. A real router has more tie-breaks after MED, but every round in this game is settled by one
of the five steps shown, so you never need the ones we don't cover."

**References:** Cisco, *Select BGP Best Path Algorithm*, Document ID 13753, section "How the Best
Path Algorithm Works"; RFC 4271 §4.3 (origin values) and §9.1.2.2 (breaking ties); RFC 5398 and
RFC 5737 (documentation ASNs and addresses).

### Round Content

Three levels, two rounds each, six rounds total. Every round uses prefix 203.0.113.0/24. Values are
weight / local pref / AS-path / origin / MED; the neighboring AS is the leftmost ASN. All ASNs are
from the RFC 5398 documentation range (64496–64511) and all peers from 192.0.2.0/24 (RFC 5737).

**Source for every row in this section, the briefing examples, and the fixtures below:** Cisco,
*Select BGP Best Path Algorithm*, Document ID 13753, section "How the Best Path Algorithm Works"
(step order, weight and local-preference defaults, MED compared only when the first AS is the same
unless `bgp always-compare-med` is enabled), with RFC 4271 §4.3 for origin codes. A human reviewer
confirms each row against that section and records their name and date before release
(constitution principle I).

| Level | New concept | Misconception to expose |
| --- | --- | --- |
| 1 | The first step that separates the candidates decides; direction of each attribute (LO1) | "Lower is better for everything"; "MED doesn't matter if everything else is equal" |
| 2 | An earlier step overrides a more attractive later attribute (LO2) | Scorecard thinking: choosing the shortest AS-path or best origin after an earlier step already decided |
| 3 | An earlier step can narrow the field; MED then decides only among remaining same-AS paths (LO3) | "The lowest MED always wins" |

| Round | Candidates | Winner | Ladder |
| --- | --- | --- | --- |
| 1.1 | A: 0 / 100 / `64500 64510` / i / 0 (peer 192.0.2.1) · B: 0 / 200 / `64501 64510` / i / 0 (peer 192.0.2.5) · C: 0 / 100 / `64502 64510` / i / 0 (peer 192.0.2.9) | B | weight *tie*; local pref *decides* (200 > 100); rest *not reached* |
| 1.2 | A: 0 / 100 / `64500 64510` / i / 50 (peer 192.0.2.1) · B: 0 / 100 / `64500 64510` / i / 20 (peer 192.0.2.5) | B | weight, local pref, AS-path (2 = 2), origin *tie*; MED *decides* (20 < 50, both AS 64500) |
| 2.1 | A: 0 / 150 / `64500 64498 64499 64510` / i / 0 (peer 192.0.2.1) · B: 0 / 100 / `64501 64510` / i / 0 (peer 192.0.2.5) | A | weight *tie*; local pref *decides* (150 > 100); rest *not reached* |
| 2.2 | A: 100 / 100 / `64500 64498 64510` / ? / 0 (peer 192.0.2.1) · B: 0 / 200 / `64501 64510` / i / 0 (peer 192.0.2.5) · C: 0 / 100 / `64502 64510` / i / 0 (peer 192.0.2.9) | A | weight *decides* (100 > 0); rest *not reached* |
| 3.1 | A: 0 / 100 / `64500 64510` / i / 50 (peer 192.0.2.1) · B: 0 / 100 / `64500 64510` / i / 20 (peer 192.0.2.5) · C: 0 / 100 / `64501 64498 64510` / i / 5 (peer 192.0.2.9) | B | weight, local pref *tie*; AS-path *narrows* (C out: 3 > 2); origin *tie*; MED *decides* (20 < 50, both AS 64500) |
| 3.2 | A: 0 / 100 / `64502 64510` / i / 40 (peer 192.0.2.13) · B: 0 / 100 / `64502 64510` / i / 80 (peer 192.0.2.17) · C: 0 / 100 / `64503 64510` / ? / 0 (peer 192.0.2.19) | A | weight, local pref, AS-path *tie*; origin *narrows* (C out: `?` 2 > `i` 0); MED *decides* (40 < 80, both AS 64502) |

**Head-to-head check (FR-003):** 1.1 B beats A and C at local pref · 1.2 B beats A at MED ·
2.1 A beats B at local pref · 2.2 A beats B and C at weight · 3.1 B beats A at MED and C at AS-path ·
3.2 A beats B at MED and C at origin.

**Briefing worked examples** (shown in each level's briefing; each uses neighboring ASes not used
by that level's rounds, and each is a fixture with an exact explanation):

| Level | Candidates | Winner | Explanation shown |
| --- | --- | --- | --- |
| 1 | P: 0 / 100 / `64506 64510` / i / 0 (peer 192.0.2.33) · Q: 0 / 100 / `64507 64510` / e / 0 (peer 192.0.2.37) | P | "Weight (0), local preference (100), and AS-path length (2) tie. Origin decides: lower wins, and P is `i` (0) while Q is `e` (1), so P wins. MED is not reached." |
| 2 | R: 0 / 100 / `64508 64497 64510` / i / 0 (peer 192.0.2.41) · S: 0 / 100 / `64509 64510` / ? / 0 (peer 192.0.2.45) | S | "R has the better origin (`i` vs `?`), but AS-path is step 3 and origin is step 4. Weight (0) and local preference (100) tie; S's AS-path is shorter (2 vs 3), so S wins before origin is checked." |
| 3 | X: 0 / 100 / `64504 64510` / i / 60 (peer 192.0.2.21) · Y: 0 / 100 / `64504 64510` / i / 25 (peer 192.0.2.25) · Z: 0 / 90 / `64505 64510` / i / 10 (peer 192.0.2.29) | Y | "Z has the lowest MED but is out at local preference (90 < 100). X and Y both come from neighbor AS 64504, so MED is compared and Y wins (25 < 60). Z's MED is never compared with X's or Y's, because it comes from a different neighboring AS." |

Head-to-head: P beats Q at origin · S beats R at AS-path · Y beats X at MED and Z at local pref.

### Wrong-choice Fixtures

Every wrong choice in every shipped round, with its named misconception and the explanation text
shown before the next-step line (FR-008). Source: as stated at the start of *Round Content*.

| Round | Picks | Named misconception | Explanation shown |
| --- | --- | --- | --- |
| 1.1 | A | "Lower is better for everything" | "Local preference: higher wins. B has 200, A has 100." |
| 1.1 | C | "Lower is better for everything" | "Local preference: higher wins. B has 200, C has 100. C and A tie on every modeled step; the neighboring AS number (64502) is never compared as a value." |
| 1.2 | A | "Higher MED is better" | "MED: lower wins, and both paths come from AS 64500, so MED is compared. B has 20, A has 50." |
| 2.1 | B | "A shorter AS-path beats a higher local preference" | "Path B has the shorter AS-path, but AS-path is step 3. Step 1, weight: both are 0, so it's a tie. Step 2, local preference: A has 150 and B has 100. Higher wins, so A is chosen before AS-path is checked." |
| 2.2 | B | "Local preference beats weight" | "B has the highest local preference, but weight is checked first. A has weight 100, B has 0." |
| 2.2 | C | "Scorecard thinking: a shorter AS-path and better origin outweigh an earlier step" | "C has a shorter AS-path than A (2 vs 3) and a better origin (`i` vs `?`), but weight is step 1 and decides first: A has 100, B and C have 0. C is out at weight, so its AS-path and origin are never compared." |
| 3.1 | C | "The lowest MED always wins" | "C has the lowest MED (5), but AS-path is step 3 and C's is longer (3 vs 2), so C is out before MED is checked. C also comes from AS 64501, so its MED would never be compared with A's or B's from AS 64500." |
| 3.1 | A | "Higher MED is better" | "A and B both come from AS 64500, so MED is compared. Lower wins: B has 20, A has 50." |
| 3.2 | C | "The lowest MED always wins" | "C has the lowest MED (0), but origin is checked first: C is `?` (2), A and B are `i` (0). C is out before MED. C also comes from AS 64503, so its MED is never compared with paths from AS 64502." |
| 3.2 | B | "Higher MED is better" | "A and B both come from AS 64502 and survive origin, so MED is compared. Lower wins: A has 40, B has 80." |

### Boundary and Unsupported Fixtures

| Case | Input | Expected result |
| --- | --- | --- |
| Equal-length AS-paths | A: `64500 64510` / i · B: `64501 64498` / e; weight 0, local pref 100, MED 0 | A wins; AS-path *tie* (2 = 2), origin *decides* (`i` < `e`), MED *not reached* |
| MED 0 | Same neighbor AS 64500; MED 0 vs 1, all else equal | MED 0 path wins; MED *decides* (0 < 1) |
| Mixed ASes at MED | A: `64500 64510` / MED 50 · B: `64500 64510` / MED 20 · C: `64501 64510` / MED 5; all else equal | Content error before play; game does not start; error names the round (B and C stay tied within the modeled steps) |
| Other unsupported | Missing MED; still tied after MED; equal same-AS MEDs; authored winner disagrees with the rule; a wrong choice has no named misconception | Content error before play; game does not start; nothing graded; no progress recorded |

### Key Entities

- **Level**: one of three; has a title, learning outcome, briefing with a worked example, sources,
  and two ordered rounds.
- **Round**: a prefix, two to four candidate paths, the expected winner, a named misconception for
  every wrong choice, and its help content.
- **Candidate path**: label, peer address, weight, local preference, AS-path (its first ASN is the
  neighboring AS), origin code, MED.
- **Step result**: for each of the five steps, the remaining paths' values, the status (*tie*,
  *narrows*, *decides*, *not reached*), and any paths eliminated.
- **Source**: title, link, section, and the claim it supports.
- **Session progress**: current level and round, completed rounds, valid attempts per round, and
  assistance viewed per round (by help level).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time learner from the target audience completes all six rounds and reaches
  the session summary in 10 minutes or less.
- **SC-002**: 6 of 6 shipped rounds produce the winner and all five step statuses recorded in
  *Round Content*.
- **SC-003**: 10 of 10 wrong choices produce feedback naming the misconception in *Wrong-choice
  Fixtures*, with the stated values and a next step.
- **SC-004**: 6 of 6 rounds pass the head-to-head check.
- **SC-005**: A keyboard-only playthrough reaches the session summary with no pointer use, and the
  focus position is visible at every step.
- **SC-006**: 0 attempts are recorded for empty submissions, repeated submissions after success,
  or help requests.
- **SC-007**: In every round, the worked solution appears only after two earlier, separate help
  requests (method, then worked step).
- **SC-008**: After playing, a teammate can explain, for at least one wrong choice they made, which
  misconception it reflected and which step decided the round.

## Assumptions

- The level summary screen (AC7) follows FR-014, which requires a level summary. `/speckit-clarify`
  question 2 asked where it appears and was not answered; the recommended placement is used here
  and can be changed by the user.
- Session target is 5–10 minutes with unlimited thinking time; a typical laptop browser is the
  primary environment, and a narrow window must also work.
- Progress lasts for the current page session only; saving across reloads is a stretch feature
  that must be specified before it is added.
- AC5 now has a middle "worked step" level between the method hint and the worked solution.
  Constitution principle II requires a method, then a worked step, with the worked solution
  separate. The source spec's single "further help" step was split to satisfy that.
- Round 1.1 path C is labeled with the same misconception as path A ("Lower is better for
  everything") because it reflects the same mistaken direction for local preference. Its
  explanation adds that the neighboring AS number is never compared as a value.
- Round 2.2 path C is labeled as scorecard thinking, the Level 2 misconception, because its only
  advantages over the winner come at steps 3 and 4, after weight has already decided.
- Rows other than the two new wrong-choice fixtures inherit their source citations from
  `StarterKit/SPEC.md`. Constitution principle I requires each fixture to cite Cisco 13753; this
  specification records that citation for all wrong-choice fixtures, and the source table's
  citations for correct and boundary cases should be reviewed during `/speckit-clarify`.

## Out of Scope (Non-goals, preserved)

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard, or
level editor. No simulation of BGP sessions, update propagation, route policy (route-maps setting
attributes), the tie-breaks after MED, multipath, deterministic-med grouping, `always-compare-med`,
or other vendors' selection processes. No second mechanic and no fourth level. No "no winner"
answer option. Visual polish must fit the existing mechanic and is never traded for correctness or
feedback.
