# Contract: Content File (`data/levels.json`) and Validation (`engine/content.js`)

Shape and field ranges are in [../data-model.md](../data-model.md). `validateContent(doc)` returns
`{ ok: true }` or `{ ok: false, errors: [{ levelId, roundId, field, problem }] }`. Any error stops
the game before play (spec FR-005, clarification 2026-11-17).

## Rejections

**Structure**
- `schemaVersion` is not `1`; a required field is missing or has the wrong type.
- Not exactly 3 levels with 2 rounds each; a duplicate level or round ID.
- An unknown `sourceId`; a round or briefing with no Cisco 13753 source.
- An empty `method`, `misconceptions` entry `label`, Source `title`/`url`/`section`/`claim`,
  Level `title`, or briefing `concept`.

**Values**
- A candidate value out of range (including a missing `med`); a duplicate path ID or peer.
- `difficulty` missing, not 1–3, or lower than the previous round's in play order.
- `prefix` is not `203.0.113.0/24`.

**Rule agreement**
- `selectBestPath` returns `content-error` (`med-mixed-neighbor-as` or `tied-after-med`).
- `expectedWinner` differs from `selectBestPath(...).survivor`.
- `checkHeadToHead` fails for any candidate.
- A briefing example's `winner` differs from its survivor, fails the head-to-head check, uses a
  path ID outside `P`–`Z`, has an empty `explanation`, or shares a neighboring AS (`asPath[0]`) with a round in its level.

**Feedback agreement**
- `wrongChoices` lacks a non-winning path, includes the winner, or has an empty `explanation`.
- `reasonCode` is not in `misconceptions`.
- `reasonCode`'s `allowedAt` does not include the step where that path was eliminated (from the
  ladder). For `lowest-med-always-wins`, the path must also have the round's lowest MED.
- The explanation contains an integer that is not one of: a candidate's weight, local preference,
  AS-path length, origin code, MED, or any ASN in an AS-path; or a step number 1–5.

## Example round (Round 3.1)

```json
{
  "id": "3.1",
  "difficulty": 3,
  "prefix": "203.0.113.0/24",
  "sourceIds": ["cisco-13753", "rfc4271-9.1.2.2"],
  "candidates": [
    { "id": "A", "peer": "192.0.2.1", "weight": 0, "localPref": 100, "asPath": [64500, 64510], "origin": "i", "med": 50 },
    { "id": "B", "peer": "192.0.2.5", "weight": 0, "localPref": 100, "asPath": [64500, 64510], "origin": "i", "med": 20 },
    { "id": "C", "peer": "192.0.2.9", "weight": 0, "localPref": 100, "asPath": [64501, 64498, 64510], "origin": "i", "med": 5 }
  ],
  "expectedWinner": "B",
  "wrongChoices": {
    "A": { "reasonCode": "higher-med-is-better",
           "explanation": "A and B both come from AS 64500, so MED is compared. Lower wins: B has 20, A has 50." },
    "C": { "reasonCode": "lowest-med-always-wins",
           "explanation": "C has the lowest MED (5), but AS-path is step 3 and C's is longer (3 vs 2), so C is out before MED is checked. C also comes from AS 64501, so its MED would never be compared with A's or B's from AS 64500." }
  }
}
```
