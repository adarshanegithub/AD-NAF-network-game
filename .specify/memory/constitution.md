<!--
Sync Impact Report (scratch for review; remove before committing)
- Version change: template (unversioned) → 1.0.0
- Source: StarterKit/CONSTITUTION.md (commit c168971). Its seven principles C1–C7 map to I–VII.
  No principle was removed or softened. Wording changed only where "should"/"may" became
  MUST/MAY, or where a principle's Evidence line was folded into a "Verified by" line.
- Modified principles: placeholders → I. Technical Truth Is a Release Requirement;
  II. Every Round Teaches Through a Decision; III. Honest Progress and Safe Retry;
  IV. Access Is Part of the Core Game; V. Deterministic and Self-Contained;
  VI. Content and Logic Reviewed Separately; VII. Done Is Demonstrated
- Added sections: Scope and Technical Model (SECTION_2);
  Development Workflow and Quality Gates (SECTION_3); Governance
- Removed sections: none
- Strengthened (not weakened): C6 "should require a data change" → MUST.
- Conflicts flagged (dependent docs fall short of this constitution; not edited here):
  1. SPEC.md "Cases" table: Round 1.1 path C and Round 2.2 path C have no wrong-choice fixture,
     so no misconception is recorded for them (Principle II, Principle I evidence).
  2. SPEC.md "Cases" table cites RFC 4271 or nothing for several rows; Principle I requires each
     fixture to cite the Cisco 13753 section it was checked against.
  3. SPEC.md AC5 goes from method hint straight to the full-ladder worked solution; Principle II
     requires a method first, then a worked step, with worked solutions as a separate tier.
  4. PLAN.md verification compares survivor and ladder statuses, but not feedback text;
     Principle I requires automated checks to compare feedback text to the fixtures.
  5. PLAN.md data contract has no difficulty field; Principle VI stores difficulty in data.
  6. Two copies of the constitution now exist (StarterKit/CONSTITUTION.md and this file);
     Governance requires amending both together.
- Templates: plan/spec/tasks templates read this file at runtime; none modified (scope guard).
- Deferred TODOs: none.
-->

# AS You Were Constitution

**Purpose:** help network engineering students and early-career network engineers practice
Cisco BGP best-path selection by picking the path a single router installs from a set of
candidate paths to one prefix.

## Core Principles

### I. Technical Truth Is a Release Requirement

- The game MUST never reward a technically incorrect answer.
- Every shipped answer and explanation MUST match a hand-verified fixture whose expected winner,
  deciding step, and step-by-step values were checked against Cisco Document ID 13753,
  *Select BGP Best Path Algorithm*. A round without a matching verified fixture MUST NOT ship.
- Grading MUST be reproducible from the documented rule (see *Scope and Technical Model*) and
  the challenge inputs.
- Unsupported or ambiguous content is an authoring error: the game MUST show that the challenge
  is unavailable and MUST NOT grade it.
- Simplifications MUST appear in the briefing and README wherever they affect what the player
  can conclude. Fictional worlds and animations MAY illustrate a rule; they MUST NOT change it.

**Verified by:** a hand-verified fixture for every shipped round covering correct, incorrect,
and boundary cases, each citing the Cisco 13753 section it was checked against; a source link
and section for each networking rule; review of all shipped briefings and explanations against
those fixtures. Expected results are recorded independently of the implementation under test,
and automated checks compare the evaluator's output **and feedback text** to the fixtures.

### II. Every Round Teaches Through a Decision

- The player's main action MUST exercise the target skill. A concept MUST be introduced before
  it is tested, and the values needed to reason about the answer MUST be visible.
- Every wrong choice MUST name the specific misconception it reflects (for example "a shorter
  AS-path beats a higher local preference" or "the lowest MED always wins"), show the values at
  the step the player skipped or misapplied, and give a useful next step. A bare "incorrect" or
  "try again" is never sufficient. A correct answer MUST explain why it works.
- Learning sequence: one attribute decides when everything else ties (Level 1) → an earlier
  step overrides a more attractive later attribute (Level 2) → MED decides only between paths
  from the same neighboring AS, so the lowest MED does not always win (Level 3).
- Hints MUST reveal a method first, then a worked step. Worked solutions MUST be available when
  a learner is stuck; viewing one is recorded as assistance, never as independent mastery.

**Verified by:** every wrong choice in every round's fixture lists the misconception it names;
a teammate can connect each player action to a learning outcome and describe what they learned
from a deliberately wrong choice.

### III. Honest Progress and Safe Retry

- A round completes only on a valid, correct submission. Incorrect answers MUST keep the
  challenge available.
- Empty or malformed submissions MUST give input guidance without counting as a wrong attempt.
  Repeated Submit actions MUST NOT award progress twice.
- No lives, countdown, or speed bonus in the first version. Hints and retries carry no penalty.
- Completed rounds, attempts, and assistance MUST be shown separately; completion is not proof
  of independent mastery.
- The specification MUST state exactly what advances a round, finishes a level, and resets a
  session.

**Verified by:** wrong-answer, repeated-submit, hint, completion, and reset checks that match
the specification.

### IV. Access Is Part of the Core Game

- All core interactions (reading the briefing, selecting a path card, submitting, requesting a
  hint or worked solution, reading feedback and the step ladder, and moving to the next round)
  MUST work by keyboard alone with a clearly visible focus indicator, readable labels, and an
  understandable order.
- Success and failure MUST be explained with text as well as color. Essential diagrams MUST
  have a text equivalent.
- Reduced-motion preferences MUST be respected; animation MUST NOT delay the availability of
  feedback or controls.
- The challenge MUST be usable on a typical laptop and a narrow browser window. Dense technical
  data MAY scroll within its own labeled container, without hiding the action buttons.

**Verified by:** a keyboard-only playthrough, a narrow-window check, and a reduced-motion check.
Record what was actually checked; do not claim full accessibility certification.

### V. Deterministic and Self-Contained

- The first version ships authored content and deterministic domain logic. It MUST require no
  account, backend, live device connection, model, or API key.
- AI MAY help write code and assets during development; its output receives the same review as
  any other contribution.
- Runtime AI tutoring, generated questions, and free-text AI grading are stretch work. Adding
  them MUST be preceded by an explicit change to this constitution, the specification, and the
  verification approach.

**Verified by:** a clean browser session can play using only the project's static files; no
external content service decides an answer.

### VI. Content and Logic Reviewed Separately

- Level content, hints, sources, and difficulty MUST be stored in editable data. Domain rules
  MUST be separate from rendering and progress tracking.
- Data MUST be validated before a challenge is presented.
- Feedback MUST agree with the evaluator's reasoning; a hand-authored answer key MUST NOT
  silently override the rule engine.
- Adding another challenge that uses the existing mechanic MUST require only a data change and
  its checks, not a new scoring path or a new screen implementation.

**Verified by:** inspect one level's data, trace one answer through the evaluator, and add a
trial challenge without modifying the rule engine.

### VII. Done Is Demonstrated

- Only the agreed scope ships. Requirements, plan, tasks, and README MUST describe the same
  game.
- A feature is complete when its acceptance criteria pass and its actual status is recorded. A
  screenshot, a checked task box, or the agent saying "done" is insufficient by itself.
- When time is short, scope is reduced explicitly. Correctness and feedback are never cut to add
  polish or levels: fix incorrect teaching, missing misconception feedback, and broken core
  interactions before adding visual effects, and cut animation or polish before cutting any
  verified fixture or explanation.
- Failed and untested checks MUST stay visible.

**Verified by:** reproducible run/test commands, recorded verification results, a fresh-start
playthrough, and a README another attendee can follow.

## Scope and Technical Model

**First release (fixed scope):** one core mechanic (pick the winning path, then read the step
ladder), three short levels, a browser, and a 60-minute workshop build. No second mechanic and
no fourth level. This budget changes only through the amendment procedure below.

**Model being taught:** Cisco IOS default BGP best-path behavior on one router, modeling only
the first five steps in order:

1. Highest weight
2. Highest local preference
3. Shortest AS-path
4. Lowest origin code (`i` < `e` < `?`)
5. Lowest MED, compared only between paths with the same neighboring AS (leftmost AS in the
   AS-path); otherwise the step is skipped

- `bgp always-compare-med`, `bgp deterministic-med`, and `bgp bestpath med missing-as-worst`
  are off.
- Every candidate is a valid eBGP-learned path with a reachable next hop and an explicit MED;
  none is locally originated.
- Every shipped round, in all three levels, MUST have exactly one winning path within these
  five steps. A round whose candidates are still tied after step 5 (including when MED is
  skipped) is an authoring error: it is shown as unavailable and never graded.
- The player always answers by choosing one candidate path; there is no "no winner" option.
- Excluded: eBGP-over-iBGP, IGP metric, oldest path, router ID and all later tie-breaks,
  locally-originated and AIGP steps, multipath, confederations, AS_SET counting, route policy,
  session behavior, and other vendors' selection processes.

## Development Workflow and Quality Gates

- **Gate 1 (before a round ships):** its hand-verified fixture exists, cites Cisco 13753, covers
  every wrong choice with a named misconception, and the automated checks pass against it
  (Principles I, II).
- **Gate 2 (before a slice is marked complete):** its acceptance criteria have a recorded
  pass / fail / not run result with date and environment (Principle VII).
- **Gate 3 (before release):** keyboard-only, narrow-window, and reduced-motion checks are
  recorded (Principle IV), and a clean static-file session plays start to summary
  (Principle V).
- Priority when time is short: correctness and misconception feedback, then core interactions,
  then accessibility, then visual polish.
- The `/speckit-analyze` step MUST be rerun after any change to the spec, plan, or tasks, and its
  constitution conflicts resolved before implementation continues.

## Governance

- This constitution supersedes other project practices. Spec, plan, tasks, and README MUST
  comply; a conflict is resolved openly by amending either the dependent document or this
  constitution, never by quietly ignoring it.
- The build agent MUST NOT weaken a principle merely to make its implementation pass.
- **Amendment procedure:** for any material change, record the reason, update the affected spec
  and plan, rerun analysis, and amend `StarterKit/CONSTITUTION.md` and
  `.specify/memory/constitution.md` together so the two copies never diverge.
- **Versioning:** MAJOR for removing or redefining a principle or the fixed scope; MINOR for a
  new principle or section, or materially expanded guidance; PATCH for clarifications and
  wording.
- **Compliance review:** each spec, plan, and task review checks every principle's "Verified by"
  line; release requires the recorded evidence, not a claim.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
