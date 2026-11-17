# AS You Were · First playable specification

## The pitch

**A route selector compares candidate BGP paths to one prefix, picks the winner by walking the best-path steps in order, and sees exactly which attribute decided and why every earlier one tied or only narrowed the field.**

The player is the route selector inside a single Cisco IOS router that has learned several paths to the same prefix. Each round shows a table of candidate paths with their weight, local preference, AS-path, origin code, neighboring AS, and MED. The player picks the path the router will install. A correct pick lights up the winning path and shows a step ladder: each earlier step marked *tie* with the tied values or *narrows* with the values that eliminated some paths, the deciding step marked *decides* with the values that broke the tie, and later steps marked *not reached*. An incorrect pick leaves the round open and the feedback names the step the player skipped or misapplied, showing the values at that step. The session ends when all six rounds across three levels are solved and the session summary is shown.

## Who this is for

- **Learner:** network engineering students and early-career network engineers who have configured or read about BGP but have not yet internalized the order in which the best-path attributes are compared.
- **Assumed knowledge:** what a prefix and an autonomous system (AS) number are, and that BGP routers learn more than one path to the same prefix from different neighbors. No knowledge of the attributes themselves is assumed.
- **What the briefing teaches:** the five modeled attributes and which direction wins for each (higher weight, higher local preference, shorter AS-path, lower origin code with IGP `i` = 0 < EGP `e` = 1 < incomplete `?` = 2, lower MED); that the steps are checked strictly in order, each step eliminates the remaining paths that lack its best value, and the step that leaves a single path decides; that a step is a tie when all remaining candidates share the best value; that the neighboring AS is the leftmost AS in the AS-path; and that MED is compared only between paths from the same neighboring AS.
- **Why interaction helps:** learners tend to treat best-path selection as a scorecard, choosing the path that "looks best overall" (shortest AS-path, lowest MED) instead of the first step that is not a tie. Learners also assume a lower MED always wins. Picking a winner and seeing the step-by-step ladder makes both errors visible.
- **Session target:** 5–10 minutes for a first playthrough, with unlimited thinking time.

## Learning outcomes and evidence

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Identify the single attribute that decides between candidates when every other modeled attribute ties | Pick the winning path in a round where only one attribute differs | Correct path submitted in both Level 1 rounds; explanation ladder shows the deciding step |
| LO2 | Apply the comparison order when an earlier step favors one path and a later step favors another | Pick the winning path when a decoy path has a more attractive later attribute (shorter AS-path, better origin, higher local preference against weight) | Correct path submitted in both Level 2 rounds without choosing the decoy as the final answer |
| LO3 | Explain why the lowest MED does not always win: MED is compared only among paths still remaining after the earlier steps, and only between paths from the same neighboring AS | Pick the winning path when a decoy from a different neighboring AS has the lowest MED but loses at an earlier step, leaving two paths from one neighboring AS for MED to decide | Correct path submitted in both Level 3 rounds without choosing the lowest-MED decoy as the final answer; the ladder shows the decoy eliminated at its earlier step and MED *decides* between the two same-AS paths (for example "20 < 50, both from neighbor AS 64500") |

## The technical model

- **Rule being taught:** among valid candidate paths, compare in this order. At each step, remaining paths that lack the best value for that step are eliminated, and only the remaining paths go on to the next step. Stop at the step that leaves a single path; that step decides. A step that eliminates some paths but leaves two or more *narrows* the field. With two candidates, the first step that is not a tie decides.
  1. **Highest weight** (Cisco-proprietary, local to this router; default 0 for learned paths).
  2. **Highest local preference** (default 100).
  3. **Shortest AS-path** (count of AS numbers; the ASN values themselves are never compared).
  4. **Lowest origin code** (`i` IGP = 0, `e` EGP = 1, `?` incomplete = 2).
  5. **Lowest MED**, compared only between paths whose neighboring AS (leftmost AS in the AS-path) is the same. MEDs from different neighboring ASes are never compared with each other.

  Every shipped round has **exactly one winning path within these five steps**. A round whose candidates reach step 5 from different neighboring ASes, or are still tied after step 5, would need tie-breaks this game does not model; it is an authoring error (see *Unsupported content* below), is shown as unavailable, and is never graded.
- **Real-router agreement:** with `bgp deterministic-med` off, a Cisco router compares paths one pair at a time in arrival order, so the game's step-by-step elimination must give the same answer as any arrival order. Content validation therefore also requires that the expected winner beats **every other candidate in a direct one-on-one comparison** decided within the five modeled steps. When that holds, the winner replaces whatever is currently best as soon as it is compared and is never displaced, so a real Cisco router installs the same path regardless of arrival order. All six rounds below satisfy this check.
- **Context:** Cisco IOS default best-path behavior. `bgp always-compare-med` is **off**, `bgp deterministic-med` is **off**, and `bgp bestpath med missing-as-worst` is **off**.
- **Assumptions:** when a round starts, every candidate is a valid path to the same prefix with a reachable next hop and is learned from an external (eBGP) neighbor. No candidate is locally originated. Every candidate shows an explicit MED value, so the Cisco "missing MED is treated as 0" default never applies. All candidates are shown at once and there is no arrival order to reason about.
- **Excluded behavior:** prefer eBGP over iBGP, lowest IGP metric to the next hop, oldest eBGP path, lowest router ID, and every step after those (cluster list length, neighbor address). Also excluded: the locally-originated and AIGP steps, multipath, deterministic-med grouping, confederations, AS_SET counting, route policy that sets attributes, and session or convergence behavior.
- **Authoritative references:**
  - Cisco, *Select BGP Best Path Algorithm*, Document ID 13753: <https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/13753-25.html>. Section "How the Best Path Algorithm Works" supports the order (weight → local preference → … → AS-path → origin → MED), the default weight and local preference values, that weight is local to the router, and that MED is compared only when the first AS in the AS sequence is the same unless `bgp always-compare-med` is enabled.
  - RFC 4271, *A Border Gateway Protocol 4 (BGP-4)*, §4.3 (Path Attributes, ORIGIN): <https://www.rfc-editor.org/rfc/rfc4271#section-4.3> supports the origin values IGP = 0, EGP = 1, INCOMPLETE = 2.
  - RFC 4271 §9.1.2.2 (Breaking Ties, Phase 2): <https://www.rfc-editor.org/rfc/rfc4271#section-9.1.2.2> supports shortest AS-path, lowest origin, and that MED is compared only among routes learned from the same neighboring AS.
  - RFC 5398, *AS Number Reservation for Documentation Use*, and RFC 5737, *IPv4 Address Blocks Reserved for Documentation*, support the ASNs (64496–64511) and addresses (192.0.2.0/24, 203.0.113.0/24) used in content.

The briefing tells the learner in plain language: "This router follows Cisco's default rules. We model the first five steps only. A real router has more tie-breaks after MED, but every round in this game is settled by one of the five steps shown, so you never need the ones we don't cover." The ambiguity of later tie-breaks is removed by authoring: every round in all three levels has exactly one winning path within the modeled steps, and the player always answers by choosing one path.

## The repeatable game loop

1. **Brief:** introduce one concept, its terms, and a worked example different from the challenge.
2. **Inspect:** show the candidate path table with all decision-relevant values visible: path label, neighbor address, neighboring AS, weight, local preference, AS-path (with its length), origin code, and MED.
3. **Choose:** the player selects one path card and explicitly submits the decision.
4. **Explain:** display the result, the relevant values, and the rule that connects them, as the step ladder: one row per modeled step showing each remaining candidate's value and the status *tie*, *narrows*, *decides*, or *not reached*. A candidate eliminated at a step is shown as out at that step, with the value that eliminated it.
5. **Retry or advance:** a wrong answer leaves the round playable; a correct answer enables Next.
6. **Reflect:** the level summary shows completed rounds, valid attempts, and assistance used.

**Worked interaction:** Round 2.1 shows prefix 203.0.113.0/24 with two paths. Path A: weight 0, local pref 150, AS-path `64500 64520 64530 64510` (length 4), origin `i`, MED 0. Path B: weight 0, local pref 100, AS-path `64501 64510` (length 2), origin `i`, MED 0. The player picks B because its AS-path is half as long. Feedback: "Not this one. Path B has the shorter AS-path, but AS-path is step 3. Step 1, weight: both are 0, so it's a tie. Step 2, local preference: A has 150 and B has 100. Higher wins, so A is chosen before AS-path is checked. Try again." The round stays open. The player picks A. Feedback: "Correct. Path A wins on local preference (150 > 100). Weight tied at 0. AS-path, origin, and MED were not reached." The ladder shows weight *tie*, local pref *decides*, and the other three steps *not reached*. Next becomes available.

## Required stories and acceptance criteria

### US1 · Make and understand a decision — P1

As a learner, I want to apply the rule to visible evidence and understand the result.

- **AC1:** Given a fresh session, when I start, then I see the first briefing before answering a challenge.
- **AC2:** Given Round 2.1 (A: local pref 150, AS-path length 4; B: local pref 100, AS-path length 2; all else equal), when I submit Path A, then Path A is marked as the installed best path, the ladder shows weight *tie* (0 = 0), local preference *decides* (150 > 100), and AS-path, origin, and MED *not reached*, and an explanation appears.
- **AC3:** Given that challenge, when I submit Path B, then feedback identifies the misconception "a shorter AS-path beats a higher local preference" by naming local preference as step 2 and showing 150 vs 100, completion stays unchanged, and I can retry.
- **AC4:** Given no selection, when I submit, then guidance reads "Pick a path before submitting." and attempts/completion remain unchanged.

### US2 · Learn from help and finish the game — P1

As a learner, I want help when stuck and a clear view of my progress.

- **AC5:** A hint first explains the method ("Check the steps in order: weight, local preference, AS-path, origin, MED. At each step, drop the paths that lose; the step that leaves one path decides."). Further help can show a worked solution in the form of the full step ladder for the round. Assistance is recorded without marking the round complete.
- **AC6:** Each valid submission counts as one attempt until the round is solved. Correct submission completes it once; repeated submission after success has no effect.
- **AC7:** A level completes after both of its rounds are solved. Next opens the following round or level; the final round opens a session summary.
- **AC8:** Restart asks for confirmation, then clears the current session and returns to the first briefing. Cancel preserves the session.

### US3 · Play with accessible controls — P1

As a keyboard user, I want to inspect the challenge, choose, submit, get help, and advance without a mouse.

- **AC9:** All core controls have visible focus and accessible names; keyboard interaction reaches every core action. The candidate table is a real table with column headers, and each path card's accessible name includes its label and neighboring AS.
- **AC10:** Correct/incorrect feedback includes text, remains available to read, and is announced to assistive technology. Ladder status uses words (*tie*, *narrows*, *decides*, *not reached*, and *out* for an eliminated candidate) as well as color. Motion can be reduced without losing information.

## Version-one content

**Three levels, two rounds per level, six rounds total.** Every round uses prefix 203.0.113.0/24, a new set of candidates, and the same pick-the-winner mechanic.

| Level | New concept | Prerequisite | Misconception to expose |
| --- | --- | --- | --- |
| 1 | The first non-tied step decides; direction of each attribute (LO1) | Briefing only | "Lower is better for everything" (picking the lower local preference) and "MED doesn't matter if everything else is equal" |
| 2 | An earlier step overrides a more attractive later attribute (LO2) | Level 1 | Scorecard thinking: picking the path with the shortest AS-path or the best origin even though an earlier step already decided |
| 3 | An earlier step can narrow the field without deciding; MED then decides only among the remaining paths from the same neighboring AS, so a lowest-MED path from a different neighboring AS can already be out (LO3) | Level 2 | "The lowest MED always wins" |

The Level 3 briefing explains that MED is compared only between paths from the same neighboring AS, and only among paths that survived the earlier steps. Its worked example differs from both challenges: X: 0 / 100 / `64504 64510` / i / 60 (peer 192.0.2.21) · Y: 0 / 100 / `64504 64510` / i / 25 (peer 192.0.2.25) · Z: 0 / 90 / `64505 64510` / i / 10 (peer 192.0.2.29). Z has the lowest MED but is out at local preference (90 < 100); X and Y both come from neighbor AS 64504, so MED is compared and Y wins (25 < 60). Z's MED is never compared with X's or Y's, because it comes from a different neighboring AS.

**Round content** (weight / local pref / AS-path / origin / MED; neighbor AS = leftmost ASN):

| Round | Candidates | Correct answer | Deciding step |
| --- | --- | --- | --- |
| 1.1 | A: 0 / 100 / `64500 64510` / i / 0 · B: 0 / 200 / `64501 64510` / i / 0 · C: 0 / 100 / `64502 64510` / i / 0 | B | Local preference (200 > 100); weight tied at 0 |
| 1.2 | A: 0 / 100 / `64500 64510` / i / 50 (peer 192.0.2.1) · B: 0 / 100 / `64500 64510` / i / 20 (peer 192.0.2.5) | B | MED (20 < 50), compared because both are from neighbor AS 64500; weight, local pref, AS-path (2 = 2), and origin tied |
| 2.1 | A: 0 / 150 / `64500 64520 64530 64510` / i / 0 · B: 0 / 100 / `64501 64510` / i / 0 | A | Local preference (150 > 100) overrides B's shorter AS-path |
| 2.2 | A: 100 / 100 / `64500 64520 64510` / ? / 0 · B: 0 / 200 / `64501 64510` / i / 0 · C: 0 / 100 / `64502 64510` / i / 0 | A | Weight (100 > 0) overrides B's higher local preference, and A's longer AS-path and worse origin |
| 3.1 | A: 0 / 100 / `64500 64510` / i / 50 (peer 192.0.2.1) · B: 0 / 100 / `64500 64510` / i / 20 (peer 192.0.2.5) · C: 0 / 100 / `64501 64520 64510` / i / 5 (peer 192.0.2.9) | B | Weight and local pref tied; AS-path narrows by eliminating decoy C (3 > 2); origin tied (i); MED decides between A and B, both from neighbor AS 64500 (20 < 50). One-on-one: B beats A on MED and C on AS-path |
| 3.2 | A: 0 / 100 / `64502 64510` / i / 40 (peer 192.0.2.13) · B: 0 / 100 / `64502 64510` / i / 80 (peer 192.0.2.17) · C: 0 / 100 / `64503 64510` / ? / 0 (peer 192.0.2.19) | A | Weight, local pref, and AS-path (2 = 2 = 2) tied; origin narrows by eliminating decoy C (`?` 2 > `i` 0); MED decides between A and B, both from neighbor AS 64502 (40 < 80). One-on-one: A beats B on MED and C on origin |

**Progression:** sequential on first playthrough; retry without penalty. Completion requires a correct submission in every round. Hints remain available. No points, lives, timer, leaderboard, or streak mechanic in v1.

**Session behavior:** progress is held for the current page session; reload starts again. Saving across reloads is a stretch feature and must be specified before it is added.

## Cases the implementation must satisfy

All expected results are derived from the Cisco Document ID 13753 order and RFC 4271 §9.1.2.2 as modeled above.

| Case | Input state | Player action | Expected result | Why / source |
| --- | --- | --- | --- | --- |
| Correct (1.1) | Round 1.1 values | Submit B | Solved; ladder: weight *tie* (0), local pref *decides* (200 > 100), rest *not reached* | Higher local preference wins; Cisco 13753 |
| Plausible mistake (1.1) | Round 1.1 values | Submit A | Open; "Local preference: higher wins. B has 200, A has 100." | Assumes lower is better for every attribute |
| Correct (1.2) | Round 1.2 values | Submit B | Solved; weight, local pref, AS-path (2 = 2), and origin (i) *tie*; MED *decides* (20 < 50, same neighbor AS 64500) | MED compared within the same neighbor AS; RFC 4271 §9.1.2.2 |
| Plausible mistake (1.2) | Round 1.2 values | Submit A | Open; "MED: lower wins, and both paths come from AS 64500, so MED is compared. B has 20, A has 50." | Treats higher MED as preferred |
| Correct (2.1) | Round 2.1 values | Submit A | Solved; local pref *decides* (150 > 100) | Order: local pref before AS-path |
| Plausible mistake (2.1) | Round 2.1 values | Submit B | Open; message from AC3 | Scorecard thinking about AS-path |
| Correct (2.2) | Round 2.2 values | Submit A | Solved; weight *decides* (100 > 0), rest *not reached* | Weight is step 1 on Cisco IOS |
| Plausible mistake (2.2) | Round 2.2 values | Submit B | Open; "B has the highest local preference, but weight is checked first. A has weight 100, B has 0." | Ignores the Cisco-only weight step |
| Correct (3.1) | Round 3.1 values | Submit B | Solved; weight *tie* (0), local pref *tie* (100), AS-path *narrows* (C out: 3 > 2; A and B remain at 2), origin *tie* (i), MED *decides* (20 < 50, both from neighbor AS 64500) | Order: AS-path before MED; MED compared within the same neighbor AS; Cisco 13753, RFC 4271 §9.1.2.2 |
| Plausible mistake (3.1) | Round 3.1 values | Submit C | Open; misconception "the lowest MED always wins": "C has the lowest MED (5), but AS-path is step 3 and C's is longer (3 vs 2), so C is out before MED is checked. C also comes from AS 64501, so its MED would never be compared with A's or B's from AS 64500." | "Lowest MED always wins"; `always-compare-med` off |
| Plausible mistake (3.1) | Round 3.1 values | Submit A | Open; misconception "higher MED is better": "A and B both come from AS 64500, so MED is compared. Lower wins: B has 20, A has 50." | Treats higher MED as preferred |
| Correct (3.2) | Round 3.2 values | Submit A | Solved; weight, local pref, and AS-path (2) *tie*; origin *narrows* (C out: `?` 2 > `i` 0; A and B remain at `i`); MED *decides* (40 < 80, both from neighbor AS 64502) | Origin before MED; RFC 4271 §4.3 and §9.1.2.2 |
| Plausible mistake (3.2) | Round 3.2 values | Submit C | Open; misconception "the lowest MED always wins": "C has the lowest MED (0), but origin is checked first: C is `?` (2), A and B are `i` (0). C is out before MED. C also comes from AS 64503, so its MED is never compared with paths from AS 64502." | Jumping straight to MED |
| Plausible mistake (3.2) | Round 3.2 values | Submit B | Open; misconception "higher MED is better": "A and B both come from AS 64502 and survive origin, so MED is compared. Lower wins: A has 40, B has 80." | Treats higher MED as preferred |
| Boundary (equal-length AS-paths) | A: `64500 64510` / i · B: `64501 64520` / e, weight 0, local pref 100, MED 0 for both, different neighbor ASes | Submit A | Solved; AS-path step shows *tie* (2 = 2) even though the ASN values differ; origin *decides* (`i` 0 < `e` 1); MED *not reached* | Only length counts; RFC 4271 §9.1.2.2 |
| Boundary (MED 0) | Same neighbor AS 64500; MED 0 vs 1, all else equal | Submit the MED 0 path | Solved; MED *decides* (0 < 1) | 0 is a valid, best-possible MED |
| Unsupported (mixed ASes at MED) | A: `64500 64510` / MED 50 · B: `64500 64510` / MED 20 · C: `64501 64510` / MED 5; weight 0, local pref 100, origin i for all | Open round | Visible content error; no grading or progress. C reaches MED from a different neighboring AS than A and B, so C and B are tied within the modeled steps, and a real Cisco router's choice would depend on arrival order and unmodeled tie-breaks | MED only within the same neighbor AS; `deterministic-med` off; Cisco 13753 |
| Unsupported content | Any candidate missing MED; or any round with no single winner after step 5 (candidates still tied, or candidates reaching MED from different neighboring ASes); or two candidates from the same AS tied at MED with equal MED; or an expected winner that does not beat every other candidate one-on-one within the five modeled steps; or an authored answer that disagrees with the evaluator | Open round | Visible content error; no grading or progress | Authoring error, not learner failure |

## Experience direction

- **Visual metaphor:** route cards lined up before a five-gate selection ladder labeled WEIGHT, LOCAL PREF, AS-PATH, ORIGIN, and MED. Each card shows its values aligned under the gate that reads them.
- **One memorable moment:** after a correct submission, the cards pass through the gates one at a time. On a tie, every card passes through together and the gate stamps *tie*. A losing card drops out and is stamped with its value (for example "LOCAL PREF 100 < 150"). In Level 3, the lowest-MED decoy drops out at an earlier gate (for example "AS-PATH 3 > 2") with its MED still showing, unused. At the MED gate, the gate reads the neighbor-AS badges of the two remaining cards, stamps "Same AS 64500: compare MED," and lets the lower MED through. That's the "AS you were" moment.
- **Always visible:** the prefix, the modeled step order with each step's winning direction (↑ higher / ↓ lower), every candidate's six values, each candidate's neighboring AS highlighted in its AS-path, and the AS-path length.
- **Feedback voice:** patient and specific; explain the observed choice before offering the next step.
- **Layout:** challenge first, action next, explanation beside or below it. Don't hide technical values behind hover-only interactions.

## Non-goals

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard, or level editor. No simulation of BGP sessions, update propagation, route policy (route-maps setting attributes), the tie-breaks after MED, multipath, deterministic-med grouping, `always-compare-med`, or other vendors' selection processes. Visual polish must fit the existing mechanic.

## Open decisions for clarify

- How should Level 3 handle rounds that the five modeled steps cannot decide? **Resolved (2026-11-17):** they are not shipped. Every round has exactly one winning path within the five modeled steps, and the player always picks a path; an undecidable round is an authoring error, as the constitution requires. Level 3 keeps the lesson "the lowest MED does not always win" with a lowest-MED decoy from a different neighboring AS that loses at an earlier modeled step, so MED then decides between two paths from the same neighboring AS. No later tie-break is modeled.
- Should a hint ever reveal the correct card directly, or only the full ladder for the round? **Proposed answer:** the second level of help shows the full ladder, which implies the answer. It counts as assistance and does not complete the round.

Delete this section when resolved, or record the answer beside each question. Don't let unresolved decisions become silent implementation guesses.

## Release evidence

All required acceptance criteria must have a recorded result. All six rounds and their explanations must be checked against the references. A teammate must complete the core flow using only the keyboard. The README must describe implemented behavior, exact run/test commands, and any remaining limits.
