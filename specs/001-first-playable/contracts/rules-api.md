# Contract: Domain Rules (`engine/rules.js`)

All functions are pure: same input, same output; no DOM, timers, network, randomness, or
progress changes. Field names follow [../data-model.md](../data-model.md).

## `STEPS`

Ordered list: `weight` (higher wins), `localPref` (higher), `asPathLength` (lower), `origin`
(lower; `i`=0, `e`=1, `?`=2), `med` (lower; same neighboring AS only).

## `selectBestPath(candidates) → BestPathResult`

```text
BestPathResult = {
  status: "ok" | "content-error",
  survivor: pathId | null,
  reasonCode: null | "med-mixed-neighbor-as" | "tied-after-med",
  ladder: LadderStep[5]          // always five entries, in STEPS order
}
LadderStep = {
  step: "weight" | "localPref" | "asPathLength" | "origin" | "med",
  status: "tie" | "narrows" | "decides" | "not-reached",
  values: { [pathId]: number | string },   // remaining paths at this step; {} if not-reached
  best: number | string | null,
  eliminated: pathId[],
  neighborAs: { [pathId]: asn } | null     // med step only
}
```

Algorithm: start with all candidates remaining. For each step, compute each remaining path's
value and the best value, and eliminate paths without it. Status is `tie` if none were eliminated,
`narrows` if some were and two or more remain, `decides` if exactly one remains. Steps after
`decides` are `not-reached`. Before comparing MED, if the remaining paths' `asPath[0]` values
differ, return `content-error` / `med-mixed-neighbor-as` (ladder filled up to `origin`). If more
than one path remains after MED, return `content-error` / `tied-after-med`.

## `compareHeadToHead(a, b) → { winner: pathId | null, decidedAt: step | null }`

Runs the five steps on just `a` and `b`. MED is compared only when `a.asPath[0] === b.asPath[0]`;
otherwise the MED step cannot decide. Returns `{ winner: null, decidedAt: null }` when the two are
still tied after the five steps.

## `checkHeadToHead(candidates, survivorId) → { ok, failures: pathId[] }`

`ok` is true only when `compareHeadToHead(survivor, other).winner === survivorId` for every other
candidate.

## `evaluate(round, answer) → Evaluation`

```text
Evaluation = {
  status: "correct" | "incorrect" | "invalid-input" | "content-error",
  chosen: pathId | null,         // the submitted path, used to look up its wrong-choice text
  expected: pathId | null,
  reasonCode: string | null,     // misconception code for incorrect; rules code for content-error
  evidence: BestPathResult | null
}
```

- `answer.pathId` missing or not a candidate → `invalid-input`, no evidence.
- `selectBestPath` content error → `content-error`.
- `answer.pathId === survivor` → `correct`.
- otherwise → `incorrect` with `reasonCode = round.wrongChoices[pathId].reasonCode`.

The authored `expectedWinner` is never used to decide the answer; it is checked against
`survivor` during content validation.
