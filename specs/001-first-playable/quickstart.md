# Quickstart & Validation: AS You Were — First Playable Version

## Prerequisites

- Python 3 (only to serve static files) and a current desktop browser.
- Run everything from the repository root.

## Run

```sh
python3 -m http.server 8000
```

- Game: <http://localhost:8000/>
- Tests: <http://localhost:8000/tests/>

On Windows use `py` in place of `python3`. Opening files with `file://` is not supported. This
command listens on all network interfaces; add `--bind 127.0.0.1` to keep it local.

## Automated validation (tests page)

Expected: a visible summary with total, passed, and failed counts, failed case IDs listed, and
**0 failed**. Zero tests discovered counts as a failure.

| Suite | Proves | Reference |
| --- | --- | --- |
| Rules fixtures | `selectBestPath` gives the survivor and all five step statuses for the six rounds, the Level 3 briefing example, and the boundary cases | [contracts/rules-api.md](contracts/rules-api.md) |
| Head-to-head | Each round's winner beats every other path one-on-one, with the expected `decidedAt` (for example 3.2: A beats B at `med`, C at `origin`); the mixed-AS example fails | [contracts/rules-api.md](contracts/rules-api.md) |
| Feedback text | Exact strings for all 10 wrong choices (label, explanation, next step, message), all 6 correct messages, all 6 worked steps, guidance, and the method hint | [contracts/feedback-text.md](contracts/feedback-text.md) |
| Content | `levels.json` matches the fixtures (values, winner, difficulty, reason codes, text); every rejection rule fires on a broken copy | [contracts/content-schema.md](contracts/content-schema.md) |
| State | Empty submit, wrong submit, repeated submit after success, help order and recording, level completion, level and session summary, restart confirm/cancel | [data-model.md](data-model.md) |

## Manual validation (record pass / fail / not run, date, browser)

1. **Fresh start:** the Level 1 briefing appears before any challenge (AC1).
2. **Round 2.1:** submit B → misconception "A shorter AS-path beats a higher local preference",
   150 vs 100, round open (AC3). Submit A → ladder weight *tie*, local preference *decides*, rest
   *not reached* (AC2).
3. **Help in Round 3.1:** Hint shows only the method; Worked step and Worked solution are
   unavailable until the previous level is viewed; none completes the round (AC5–AC5c).
4. **Full playthrough:** all six rounds → level summaries → session summary showing completed
   rounds, attempts, and help used separately (AC7).
5. **Restart:** cancel keeps progress; confirm returns to the first briefing (AC8).
6. **Keyboard only:** repeat step 4 without a pointer; focus is always visible (AC9).
7. **Reduced motion + narrow window (about 360 px wide):** the same text appears with no delay;
   Submit, Hint, and Next stay visible (AC10).
8. **Broken content:** serve a copy of `levels.json` with Round 3.1's C changed to
   `asPath: [64501, 64510]`; the game does not start and the error names round 3.1 and
   `med-mixed-neighbor-as`.
