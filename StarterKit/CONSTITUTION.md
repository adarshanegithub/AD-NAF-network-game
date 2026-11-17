# AS You Were · Project constitution

**Purpose:** help network engineering students and early-career network engineers practice Cisco BGP best-path selection through picking the path a single router installs from a set of candidate paths to one prefix.

**First release:** one core mechanic (pick the winning path, then read the step ladder), three short levels, a browser, and a 60-minute workshop build. This scope is fixed: no second mechanic and no fourth level. Change this budget only by updating the agreed scope through the process at the end of this document.

## C1 · Technical truth is a release requirement

The game must never reward a technically incorrect answer. Every shipped answer and explanation must match a hand-verified fixture whose expected winner, deciding step, and step-by-step values were checked against the Cisco best-path reference (Cisco Document ID 13753, *Select BGP Best Path Algorithm*). A round without a matching verified fixture does not ship. Grading must be reproducible from a documented rule and the challenge inputs. Unsupported or ambiguous content is an authoring error: show an explanation that the challenge is unavailable and prevent grading it.

Document the model being taught: Cisco IOS default BGP best-path behavior on one router, modeling only the first five steps in order (highest weight, highest local preference, shortest AS-path, lowest origin code with `i` < `e` < `?`, lowest MED). MED is compared only between paths with the same neighboring AS (leftmost AS in the AS-path); otherwise the step is skipped. `bgp always-compare-med`, `bgp deterministic-med`, and `bgp bestpath med missing-as-worst` are off. Every candidate is a valid eBGP-learned path with a reachable next hop and an explicit MED; none is locally originated. Every shipped round, in all three levels, must have exactly one winning path within these five steps. A round whose candidates are still tied after step 5 (including when MED is skipped) is an authoring error: it shows that the challenge is unavailable and is never graded. The player always answers by choosing one candidate path; there is no "no winner" option. Excluded: eBGP-over-iBGP, IGP metric, oldest path, router ID and all later tie-breaks, locally-originated and AIGP steps, multipath, confederations, AS_SET counting, route policy, session behavior, and other vendors' selection processes. Simplifications must appear in the briefing and README wherever they affect what the player can conclude. Fictional worlds and animations may illustrate a rule; they must not change it.

**Evidence:** a hand-verified fixture for every shipped round covering correct, incorrect, and boundary cases, each citing the Cisco 13753 section it was checked against; a source link and section for each networking rule; review of all shipped briefings and explanations against those fixtures. Expected results are recorded independently of the implementation under test, and the automated checks compare the evaluator's output and feedback text to the fixtures.

## C2 · Every round teaches through a decision

The player's main action must exercise the target skill. Introduce a concept before testing it, and show the values needed to reason about the answer. Every wrong choice names the specific misconception it reflects (for example "a shorter AS-path beats a higher local preference" or "the lowest MED always wins"), shows the values at the step the player skipped or misapplied, and gives a useful next step. A bare "incorrect" or "try again" is never sufficient feedback. A correct answer explains why it works.

Use this learning sequence: one attribute decides when everything else ties (Level 1) → an earlier step overrides a more attractive later attribute (Level 2) → MED decides only between paths from the same neighboring AS, so the lowest MED does not always win (Level 3). Hints reveal a method first, then a worked step. Worked solutions are available when a learner is stuck; viewing one is recorded as assistance, never as independent mastery.

**Evidence:** every wrong choice in every round's fixture lists the misconception it names; a teammate can connect each player action to a learning outcome and describe what they learned from a deliberately wrong choice.

## C3 · Progress is honest and retry is safe

A round completes only on a valid, correct submission. Incorrect answers keep the challenge available. Empty or malformed submissions give input guidance without counting as a wrong attempt. Repeated Submit actions cannot award progress twice.

No lives, countdown, or speed bonus in this first version. Hints and retries have no penalty. Show completed rounds, attempts, and assistance separately; completion is not proof of independent mastery. The specification must say exactly what advances a round, finishes a level, and resets a session.

**Evidence:** wrong-answer, repeated-submit, hint, completion, and reset checks match the specification.

## C4 · Access is part of the core game

All core interactions (reading the briefing, selecting a path card, submitting, requesting a hint or worked solution, reading feedback and the step ladder, and moving to the next round) must work by keyboard alone with a clearly visible focus indicator, readable labels, and an understandable order. Explain success and failure with text as well as color. Provide a text equivalent for essential diagrams. Respect reduced-motion preferences; animation must never delay the availability of feedback or controls.

Keep the challenge usable on a typical laptop and a narrow browser window. Dense technical data may scroll within its own labeled container, without hiding the action buttons.

**Evidence:** a keyboard-only playthrough, a narrow-window check, and a reduced-motion check. Record what was actually checked; do not claim full accessibility certification.

## C5 · The first version is deterministic and self-contained

Ship authored content and deterministic domain logic. The game requires no account, backend, live device connection, model, or API key. AI may help write code and assets during development; its output receives the same review as any other contribution.

Runtime AI tutoring, generated questions, and free-text AI grading are stretch work. Adding them requires an explicit change to the constitution, specification, and verification approach before implementation.

**Evidence:** a clean browser session can play using only the project's static files; no external content service decides an answer.

## C6 · Content and logic can be reviewed separately

Store level content, hints, sources, and difficulty in editable data. Keep domain rules separate from rendering and progress tracking. Validate data before presenting a challenge. Feedback must agree with the evaluator's reasoning; a hand-authored answer key cannot silently override the rule engine.

Adding another challenge that uses the existing mechanic should require a data change and its checks, not a new scoring path or a new screen implementation.

**Evidence:** inspect one level's data, trace one answer through the evaluator, and add a trial challenge without modifying the rule engine.

## C7 · Done is demonstrated

Ship only the agreed scope. Requirements, plan, tasks, and README must describe the same game. A feature is complete when its acceptance criteria pass and its actual status is recorded. A screenshot, a checked task box, or the agent saying “done” is insufficient by itself.

When time is short, reduce scope explicitly. Correctness and feedback are never cut to add polish or levels: fix incorrect teaching, missing misconception feedback, and broken core interactions before adding visual effects, and cut animation or polish before cutting any verified fixture or explanation. Keep failed and untested checks visible.

**Evidence:** reproducible run/test commands, recorded verification results, a fresh-start playthrough, and a README another attendee can follow.

## How we change these rules

For any material change, record the reason, update the affected spec and plan, and rerun analysis. A conflict with this constitution is resolved openly; the build agent must not weaken a principle merely to make its implementation pass.
