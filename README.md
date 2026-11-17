# AS You Were

**Pick the BGP path a Cisco router installs, then watch the five best-path steps show which one decided and why.**

AS You Were is a browser game for network engineering students and early-career network engineers. You play the route selector inside one Cisco IOS router that has learned several paths to 203.0.113.0/24. You choose the path the router installs; the game then walks the best-path steps in order and shows which step tied, which narrowed the field, and which decided. A wrong choice names the misconception behind it so you can try again.

A project from **NAF AC6 — Loop Engineering, Spec-Driven Development & the Future of VibeOps**.

| Project | Details |
| --- | --- |
| Status | Playable. All automated checks pass; the human source review and the playtest are still to do (see *Verification*) |
| Networking topic | BGP best-path selection, Cisco IOS defaults, first five steps |
| Typical session | 5–10 minutes, unlimited thinking time |
| Live demo | Not published yet |
| Built by | Project author (add your name or GitHub handle before publishing) |

## The challenge

Round 2.1 shows two paths. Path A has local preference 150 and AS-path `64500 64498 64499 64510` (length 4). Path B has local preference 100 and AS-path `64501 64510` (length 2). Everything else ties. If you pick B, the game says **Misconception: A shorter AS-path beats a higher local preference**, and shows that local preference (step 2) is checked before AS-path (step 3): A has 150, B has 100. Pick A and the step ladder shows weight *tie*, local preference *decides*, and AS-path, origin, and MED *not reached*.

## What you'll learn

| By the end, you can… | You'll practice by… |
| --- | --- |
| Identify the one attribute that decides when everything else ties (LO1) | Picking the winner in Level 1, where one attribute differs |
| Apply the step order when an earlier step and a later step favor different paths (LO2) | Resisting a decoy with a shorter AS-path or better origin in Level 2 |
| Explain why the lowest MED does not always win (LO3) | Rejecting a lowest-MED decoy that loses earlier, in Level 3, so MED decides between two paths from one neighboring AS |

**Before playing:** know what a prefix and an AS number are, and that a router can learn several paths to one prefix. The first briefing teaches the attributes.

## Play locally

Clone or download this repository, open a terminal in the project root, and run:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000**. Tests are at **http://localhost:8000/tests/**. On Windows use `py -m http.server 8000`. **Ctrl+C** stops the server.

This command listens on every network interface, so other machines on your network can reach it. To keep it on your own machine, use `python3 -m http.server 8000 --bind 127.0.0.1` and open http://127.0.0.1:8000.

The game loads JavaScript modules and JSON over HTTP, so opening `index.html` as a file does not work. [Why modules need serving](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## How to play

1. Read the level briefing and its worked example, then choose **Start the challenge**.
2. Inspect the candidate table, pick a path card, and choose **Submit**.
3. Read the feedback. A wrong answer names the misconception and lets you retry; a correct answer shows the step ladder and enables **Next**.
4. If you are stuck, use **Hint** (the method only), then **Worked step** (step 1 applied to this round), then **Worked solution** (the full ladder). Each unlocks only after the previous one. Help is recorded but never completes a round.
5. Finish the six rounds across three levels. Each level ends with a summary; the last one leads to the session summary.

| Control | Action |
| --- | --- |
| Click a path card | Select that path |
| Tab / Shift+Tab | Move between controls; focus is always outlined |
| Arrow keys (in the path cards) | Select the next or previous path |
| Enter or Space | Activate the focused button |
| Hint / Worked step / Worked solution | Method → this round's first step → full step ladder, in that order |
| Restart | Asks for confirmation. Restart clears the session and returns to the first briefing; Cancel or Escape keeps it |

**Progress:** each valid submission to an unsolved round counts as one attempt. A round completes once, only on a correct submission. Submitting with no path selected shows "Pick a path before submitting." and counts nothing. Summaries show completed rounds, attempts, and help views separately. Progress lives in the page only: reloading starts a fresh session.

## What this game models

Cisco IOS default BGP best-path selection on one router, modeling only the first five steps, checked in order:

1. Highest weight (Cisco-only, local to the router; default 0)
2. Highest local preference (default 100)
3. Shortest AS-path (the number of ASes counts; the AS numbers themselves are never compared)
4. Lowest origin code (`i` = 0, `e` = 1, `?` = 2)
5. Lowest MED, compared only between paths from the same neighboring AS (the leftmost AS in the AS-path)

At each step, paths without the best value drop out; the step that leaves one path decides. `bgp always-compare-med`, `bgp deterministic-med`, and `bgp bestpath med missing-as-worst` are off. Every candidate is a valid eBGP-learned path with a reachable next hop and an explicit MED.

Every round has exactly one winner within these five steps, and that winner beats every other path one-on-one. That means a real Cisco router installs the same path whatever order the paths arrived in. The game checks this before it starts. If any round fails, the game shows a content error instead of playing.

**Outside the model:** prefer eBGP over iBGP, IGP metric to the next hop, oldest path, router ID and every later tie-break, locally originated and AIGP steps, multipath, confederations, AS_SET counting, route policy, BGP sessions, and other vendors' selection processes.

| Reference | What it supports |
| --- | --- |
| [Cisco, Select BGP Best Path Algorithm, Document ID 13753](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/13753-25.html), "How the Best Path Algorithm Works" | Step order; weight and local-preference defaults; weight is local; MED compared only when the first AS is the same unless always-compare-med is on |
| [RFC 4271 §4.3](https://www.rfc-editor.org/rfc/rfc4271#section-4.3) | Origin values IGP = 0, EGP = 1, INCOMPLETE = 2 |
| [RFC 4271 §9.1.2.2](https://www.rfc-editor.org/rfc/rfc4271#section-9.1.2.2) | Shortest AS-path, lowest origin, MED only among routes from the same neighboring AS |
| [RFC 5398](https://www.rfc-editor.org/rfc/rfc5398), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) | Documentation ASNs (64496–64511) and addresses (192.0.2.0/24, 203.0.113.0/24) used in every round |

## How it was built

The project follows the workshop's Spec Kit workflow: **constitution → specify → clarify → plan → tasks → analyze → implement**.

- **Stack:** HTML, CSS, and native JavaScript modules. No framework, bundler, or runtime dependency.
- **Build tools:** Claude Code with GitHub Spec Kit 1.4.3.dev0.
- **Runtime:** a current browser and any static file server. No account, backend, model, or API key.
- **Planning inputs:** `StarterKit/CONSTITUTION.md`, `StarterKit/SPEC.md`, `StarterKit/PLAN.md`.
- **Working artifacts:** `.specify/memory/constitution.md`; `specs/001-first-playable/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`).
- **Code:** `engine/rules.js` (best-path rules), `engine/content.js` (content checks), `engine/feedback.js` (all feedback text), `engine/state.js` (session), `ui/` (screens and controls), `data/levels.json` (all rounds, briefings, sources).
- **One useful design decision:** Level 3 originally ended in "No modeled winner" rounds. Redesigning them so a lowest-MED decoy loses at an earlier step, plus the head-to-head check, keeps every answer identical to what a real Cisco router would install, whatever order the paths arrived in. The cross-artifact analysis also caught AS numbers (64520, 64530) outside the documentation range, which would have stopped the first round from loading.

## Verification

**Last checked:** 2026-11-17, macOS 27.2.1, Google Chrome 157.0.8103.79 (headless, driven by script), Python 3.9.6 `http.server`, working tree on top of commit `e80fbb6`.

The test page (`/tests/`) reported **123 tests · 123 passed · 0 failed**. Two deliberate breaking changes were caught, and the suite passed again once each was undone. One made MED be compared across neighboring ASes (1 failure). The other changed one word in the correct-answer text (7 failures).

| Check | Result | Evidence / notes |
| --- | --- | --- |
| Correct, incorrect, and boundary cases | Pass | For all six rounds, checks the winner, all five step statuses, values, and paths out. Also checks the head-to-head result with the deciding step against every other path. Also covers the three briefing examples, the equal-length AS-path and MED 0 boundaries, and both unsupported cases |
| Feedback text against fixtures | Pass | Exact text for all 10 wrong choices (label, explanation, next step, full message), all 6 correct messages, all 6 worked steps, the guidance message, and the method hint |
| Content validation | Pass | `levels.json` matches the hand-typed fixtures. 32 broken copies (19 round-level, 1 from quickstart step 8, 12 document-level) and non-object input are each rejected, and the error names the round where there is one |
| Broken content stops the game | Pass | `/?content=tests/broken/winner-2.1-B.json` shows "Level 2, round 2.1 · expectedWinner: authored winner B but the rule selects A". `/?content=tests/broken/mixed-as-3.1.json` shows "Level 3, round 3.1 · candidates: med-mixed-neighbor-as" |
| Retry, hint, duplicate Submit, completion, restart | Pass | State and UI tests: an empty Submit counts no attempt; a wrong Submit counts one and the round stays open; a repeat Submit after success is ignored; help unlocks in order and never solves; level and session summaries; Restart cancel and confirm |
| Keyboard-only core playthrough | Pass (scripted) | Real Tab, arrow, Space, Enter and Escape key events in headless Chrome, from the first briefing to the session summary, including one wrong answer per level. The focus outline was visible at every Tab stop. Restart worked with Escape and with confirm, and the help order was checked. **A person has not yet played it by keyboard** |
| Narrow layout and reduced motion | Pass (scripted) | At 360 px wide there is no sideways page scroll, Submit, the help buttons and Next stay within the screen, and the table scrolls inside its own labeled box. With reduced motion on, no animations run, and feedback and Next appear at once (with motion on, they also appear at once) |
| Briefings and explanations checked against sources | **Not run** | Needs a person to compare every text with Cisco 13753 and record their name and date (task T036) |
| First-time player time (SC-001) and teammate explanation (SC-008) | **Not run** | Needs a real player and teammate (task T037) |
| Fresh checkout run instructions | Pass (scripted) | `python3 -m http.server` from the project root, in a fresh browser profile; the game and tests loaded |
| Published demo | Not used | — |

The automated checks test code behavior. They do not replace a person reviewing the teaching content or playing the game.

## Known limitations and next steps

- **Known limitation:** the briefing text, explanations, and generated feedback have not yet been reviewed by a person against Cisco 13753. Until that review is recorded, treat the content as unreviewed.
- **Known limitation:** the level-summary placement follows spec FR-014. The clarify question about it was never answered, so it may still change.
- **Next improvement:** run the playtest (time to finish, plus a teammate explaining one misconception) to check the learning outcomes with real players.

Found an incorrect answer or unclear explanation? Open an issue with the level/round, input values, your choice, expected result, actual result, and a reference if available.

## Credits

Workshop by John Capobianco, Joksan Flores, and Elliot Conner. Adapted from the [NAF AC6 workshop materials](https://github.com/automateyournetwork/NAF_AC6) and [Networking Video Game Starter Kit](https://github.com/automateyournetwork/NetworkingVideoGameStarterKit), using [GitHub Spec Kit](https://github.com/github/spec-kit).

**Assets and dependencies:** none. All code, text, and styling are original to this project; no fonts, images, or libraries are loaded.

**License:** Apache License 2.0 — see [LICENSE](LICENSE).
