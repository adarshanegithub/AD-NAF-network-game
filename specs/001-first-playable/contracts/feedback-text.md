# Contract: Feedback Text (`engine/feedback.js`)

`explain(round, evaluation, content) → Feedback`. Tests compare **every string exactly** against
hand-transcribed fixtures in `tests/fixtures.js` (constitution principle I).

**Source for every expected string below:** Cisco Document ID 13753, "How the Best Path Algorithm
Works", plus RFC 4271 §4.3 for origin codes. A human reviewer confirms each string against that
section and records name and date before release (tasks T036).

```text
Feedback = {
  kind: "correct" | "incorrect" | "guidance" | "content-error",
  heading: string,
  misconception: string | null,   // label from the catalog (incorrect only)
  explanation: string,
  nextStep: string | null,        // incorrect only
  message: string                 // the exact text shown and announced
}
```

## Fixed strings

- Guidance (no selection): `Pick a path before submitting.`
- Next step (every incorrect answer): `Try again: start at weight and stop at the step that leaves one path.`
- Method hint: `Check the steps in order: weight, local preference, AS-path, origin, MED. At each step, drop the paths that lose; the step that leaves one path decides.`

## Incorrect

`message = "Not this one. Misconception: " + label + ". " + explanation + " " + nextStep`

`label` comes from the misconception catalog; `explanation` is the round's authored text. The ten
expected explanations are the spec's *Wrong-choice Fixtures* table.

## Correct (generated from the ladder)

1. `Correct. Path {W} wins on {step} ({winner value} {> or <} {best loser value}{, both from AS N for MED}).`
2. For each reached step before the deciding step, in order:
   - tie: `{Step} tied at {value}.` (AS-path is written `AS-path length tied at {n}.`)
   - narrows: `{Step} removed {IDs} ({loser value} {> or <} {best value}).`
3. Steps not reached: `{list} was/were not reached.` (Oxford comma; "AS-path", "origin", "MED",
   "local preference" written lowercase except AS-path and MED, first word capitalized.)

Step names: weight, local preference, AS-path, origin, MED. Origin values are written `i`, `e`, `?`
for ties and `? = 2 > i = 0` style when compared.

| Round | Expected `message` |
| --- | --- |
| 1.1 | Correct. Path B wins on local preference (200 > 100). Weight tied at 0. AS-path, origin, and MED were not reached. |
| 1.2 | Correct. Path B wins on MED (20 < 50, both from AS 64500). Weight tied at 0. Local preference tied at 100. AS-path length tied at 2. Origin tied at i. |
| 2.1 | Correct. Path A wins on local preference (150 > 100). Weight tied at 0. AS-path, origin, and MED were not reached. |
| 2.2 | Correct. Path A wins on weight (100 > 0). Local preference, AS-path, origin, and MED were not reached. |
| 3.1 | Correct. Path B wins on MED (20 < 50, both from AS 64500). Weight tied at 0. Local preference tied at 100. AS-path removed C (3 > 2). Origin tied at i. |
| 3.2 | Correct. Path A wins on MED (40 < 80, both from AS 64502). Weight tied at 0. Local preference tied at 100. AS-path length tied at 2. Origin removed C (? = 2 > i = 0). |

Round 2.1 matches the spec's worked interaction text exactly.

## Worked step (help level 2, generated from ladder step 1)

- tie: `Step 1, weight: {A} has {v}, {B} has {v}[, …]. Every remaining path has {v}, so it's a tie. Continue with local preference.`
- decides: `Step 1, weight: {A} has {v}, …. Higher wins, so only {W} remains: weight decides.`
- narrows: `Step 1, weight: …. Higher wins, so {IDs} drop out. Continue with local preference.`

| Round | Expected worked step |
| --- | --- |
| 1.1, 3.1, 3.2 | Step 1, weight: A has 0, B has 0, C has 0. Every remaining path has 0, so it's a tie. Continue with local preference. |
| 1.2, 2.1 | Step 1, weight: A has 0, B has 0. Every remaining path has 0, so it's a tie. Continue with local preference. |
| 2.2 | Step 1, weight: A has 100, B has 0, C has 0. Higher wins, so only A remains: weight decides. |

## Worked solution (help level 3)

The full ladder, rendered as rows with the same words as the correct `message`, plus each step's
status word (*tie*, *narrows*, *decides*, *not reached*).
