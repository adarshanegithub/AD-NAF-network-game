# Data Model: AS You Were — First Playable Version

Authored content lives in `data/levels.json`. Session state lives in memory only. Field rules
are enforced by `engine/content.js` before play starts (spec FR-005); full rules are in
[contracts/content-schema.md](contracts/content-schema.md).

## ContentDocument

| Field | Type | Rule |
| --- | --- | --- |
| `schemaVersion` | integer | Must be `1` |
| `method` | string | The fixed method hint text (spec AC5) |
| `misconceptions` | object | `reasonCode → { label, allowedAt }`; see the catalog below |
| `sources` | Source[] | Unique `id`s |
| `levels` | Level[] | Exactly 3 |

## Source

`id` (string, unique) · `title` · `url` · `section` · `claim` (all non-empty strings).

## Level

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `"1"`, `"2"`, `"3"`; unique |
| `title` | string | Non-empty |
| `outcome` | string | `"LO1"`, `"LO2"`, or `"LO3"` |
| `briefing` | BriefingExample wrapper: { `concept`, `example`, `sourceIds` } | `concept` non-empty (Level 1's includes the spec's *Briefing wording*); `example` is a BriefingExample; `sourceIds` exist and include Cisco 13753 |
| `rounds` | Round[] | Exactly 2 |

## BriefingExample

| Field | Type | Rule |
| --- | --- | --- |
| `candidates` | CandidatePath[] | 2–4 paths; IDs from `P`–`Z`; no neighboring AS (`asPath[0]`) shared with any round in the same level |
| `winner` | string | A candidate `id`; must equal `selectBestPath(...).survivor` and pass the head-to-head check |
| `explanation` | string | Non-empty; the exact text from spec *Briefing worked examples* |

## Round

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `"1.1"` … `"3.2"`; unique across the document |
| `difficulty` | integer | 1–3; never lower than the previous round in play order |
| `prefix` | string | `"203.0.113.0/24"` |
| `candidates` | CandidatePath[] | 2–4 paths |
| `expectedWinner` | string | A candidate `id`; must equal `selectBestPath(...).survivor` |
| `wrongChoices` | object | One entry per non-winning path: `pathId → { reasonCode, explanation }` |
| `sourceIds` | string[] | Exist in `sources`; at least one is the Cisco 13753 source |

## CandidatePath

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | One uppercase letter, unique in its list: `A`–`D` in rounds, `P`–`Z` in briefing examples |
| `peer` | string | IPv4 in 192.0.2.0/24; unique in round |
| `weight` | integer | 0–65535; higher wins |
| `localPref` | integer | 0–4294967295; higher wins |
| `asPath` | integer[] | 1–6 ASNs, each 64496–64511; length compared; `asPath[0]` is the neighboring AS |
| `origin` | `"i"` \| `"e"` \| `"?"` | Codes 0, 1, 2; lower wins |
| `med` | integer | 0–4294967295; required; lower wins within the same neighboring AS |

## Misconception catalog (v1)

| `reasonCode` | Label | Allowed when the chosen path was eliminated at |
| --- | --- | --- |
| `lower-is-better` | Lower is better for everything | `weight` or `localPref` |
| `higher-med-is-better` | Higher MED is better | `med` |
| `shorter-as-path-beats-local-pref` | A shorter AS-path beats a higher local preference | `localPref` |
| `local-pref-beats-weight` | Local preference beats weight | `weight` |
| `scorecard-later-steps` | Scorecard thinking: a shorter AS-path and better origin outweigh an earlier step | any step before `asPathLength` |
| `lowest-med-always-wins` | The lowest MED always wins | any step before `med`, and the path has the round's lowest MED |

## v1 round assignments

| Round | Difficulty | Winner | Wrong choices → reasonCode |
| --- | --- | --- | --- |
| 1.1 | 1 | B | A → `lower-is-better` · C → `lower-is-better` |
| 1.2 | 1 | B | A → `higher-med-is-better` |
| 2.1 | 2 | A | B → `shorter-as-path-beats-local-pref` |
| 2.2 | 2 | A | B → `local-pref-beats-weight` · C → `scorecard-later-steps` |
| 3.1 | 3 | B | A → `higher-med-is-better` · C → `lowest-med-always-wins` |
| 3.2 | 3 | A | B → `higher-med-is-better` · C → `lowest-med-always-wins` |

Candidate values and explanation text are exactly those in the spec's *Round Content* and
*Wrong-choice Fixtures* tables.

## SessionState (in memory)

| Field | Type | Notes |
| --- | --- | --- |
| `view` | `loading` \| `content-error` \| `briefing` \| `round` \| `level-summary` \| `session-summary` | Current screen |
| `levelIndex`, `roundIndex` | integer | Position in play order |
| `selection` | path ID \| null | Not an answer until submitted |
| `rounds[id]` | { `attempts`, `solved`, `helpLevel`, `lastResult` } | `attempts` counts valid submissions while unsolved; `helpLevel` 0–3 |

### Transitions

```text
loading → (all content valid) → briefing(level 1)
loading → (any content error) → content-error  [names level, round, problem; retry reloads]
briefing → Start → round
round: Submit with no selection → guidance (no attempt)
round: Submit wrong → attempts+1, feedback, stays open
round: Submit correct → attempts+1, solved, feedback, Next enabled, Submit disabled
round: Submit after solved → no change
round: Hint/Worked step/Worked solution → helpLevel+1 (in order), no attempt, not solved
round(solved) → Next → next round | level-summary (after round 2 of a level)
level-summary → Next → briefing(next level) | session-summary (after level 3)
any → Restart → confirm → briefing(level 1) with fresh state; cancel → unchanged
```
