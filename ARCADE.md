---
# Adapted from NAF_AC6 WORKSHOP/LAB/StarterKit/ARCADE.md. Filled in by the build agent from its
# session records, the repository and a fresh run of the game. The creator supplied the (HUMAN)
# fields.
arcade_version: 1

game:
  title: "AS You Were"
  slug: as-you-were
  tagline: "Pick the BGP path a Cisco router installs, then see which best-path step decided."
  summary: "You play the route selector inside one Cisco IOS router and pick which of several candidate paths to 203.0.113.0/24 it installs. A step ladder then shows which of the first five best-path steps tied, narrowed or decided, and every wrong pick names the misconception behind it."
  topics: [BGP, "BGP best-path selection", "Cisco IOS", "local preference", "AS-path", MED]
  category: routing
  skill_level: intermediate      # spec audience: students and early-career engineers who have configured or read about BGP
  play_minutes: 10               # design target from the spec (5-10 min); not yet timed with a real player
  levels: 3                      # 3 levels, 6 rounds in total
  card_image: "assets/images/card.png"   # 1280x720 PNG rendered from assets/images/card.svg
  card_image_alt: "The title AS You Were and its tagline beside a five-step BGP best-path ladder where weight ties, local preference decides with 150 over 100, and AS-path, origin and MED are not reached."
  repo: "https://github.com/adarshanegithub/AD-NAF-network-game"
  repo_path: ""
  license: Apache-2.0

creator:
  name: "Amod Darshane"
  github: adarshanegithub
  location: "Autocon6"
  organization: ""
  links: []
  first_spec_project: true
  workshop: "NAF AC6"
  consent_to_publish: true

build:
  started: "2026-11-17T19:09:49Z"    # first build prompt (SPEC.md)
  finished: "2026-11-17T20:08:41Z"   # build agent's final implementation report
  wall_time: "59m"                   # elapsed between those two timestamps, not active time
  spec_driven:
    framework: "GitHub Spec Kit"
    framework_version: "1.4.3.dev0"  # from .specify/init-options.json; `specify version` was not run
    artifacts: [constitution, spec, clarify, plan, tasks, checklists, research, data-model, contracts, quickstart]
    task_count: 37                   # 35 done; T036 source review and T037 playtest need a person
    loops_or_phases: 6               # phases in tasks.md
  model: "claude-opus-5-5"
  helper_models: []                  # no sub-agents were spawned
  harness: "Claude Code (CLI, connected to VS Code)"
  harness_version: "2.1.326"
  mcp_servers: ["claude.ai Claude Docs (connected, not called)", "claude.ai Microsoft 365 (connected, not called)", "easel (connected, not called)", "Claude Code IDE bridge for VS Code (connected, not called)"]
  rag_and_sources: ["Workshop StarterKit CONSTITUTION.md, SPEC.md and PLAN.md, personalized by the creator", "Cisco Select BGP Best Path Algorithm, Document ID 13753", "RFC 4271 sections 4.3 and 9.1.2.2", "RFC 5398", "RFC 5737", "MDN JavaScript modules guide", "No web pages were fetched during the build; references came from the creator's inputs and model knowledge"]
  skills_and_plugins: ["Spec Kit skills: speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement"]
  other_tools: ["Python 3.9.6 http.server", "Google Chrome 157.0.8103.79 headless (--dump-dom, plus Python scripts over the DevTools Protocol for keyboard, layout and reduced-motion checks)", "Git", "Bash"]
  human_prompts: 15                  # up to the final implementation report, across the two build sessions
  usage:
    input_tokens: unknown
    output_tokens: unknown
    cost_note: "Cost and billing plan not recorded."
  ai_generated_assets: ["code, text and styling: claude-opus-5-5", "images: none", "audio: none"]

runtime:
  kind: static-web
  stack: [HTML, CSS, "JavaScript ES modules", JSON]
  start: "python3 -m http.server 8000 --bind 127.0.0.1"
  url_after_start: "http://127.0.0.1:8000"
  hosted_url: "https://adarshanegithub.github.io/AD-NAF-network-game/"
  static_root: "."
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: ["Google Chrome 157.0.8103.79 (headless)"]
  accessibility: "Keyboard-only playthrough with visible focus, Restart dialog, 360 px layout and reduced motion all checked by scripted headless Chrome. Not yet played by keyboard by a person; no screen-reader test."
  save_state: "none; progress lives in the page and reloading starts a fresh session"

verification:
  tests: "python3 -m http.server 8000 --bind 127.0.0.1, then open http://127.0.0.1:8000/tests/"
  tests_passing: 123                 # rerun 2026-11-18: 123 tests, 123 passed, 0 failed
  facts_sourced_from: ["Cisco Select BGP Best Path Algorithm, Document ID 13753, How the Best Path Algorithm Works", "RFC 4271 sections 4.3 and 9.1.2.2", "RFC 5398", "RFC 5737"]
  known_limits: ["Models only the first five Cisco IOS best-path steps (weight, local preference, AS-path length, origin, MED) on one router.", "Excludes eBGP over iBGP, IGP metric, oldest path, router ID and later tie-breaks, locally originated and AIGP steps, multipath, confederations, AS_SET counting, route policy, sessions and other vendors.", "bgp always-compare-med, deterministic-med and med missing-as-worst are off; every path is eBGP-learned with an explicit MED.", "Teaching text has not yet been reviewed by a person against Cisco 13753 (task T036).", "First-time-player timing and teammate explanation playtest not yet run (task T037).", "Level-summary placement follows spec FR-014; the clarify question about it was never answered."]
---

## In one paragraph

AS You Were is a browser game for network engineering students and early-career
network engineers who know what BGP is but have not yet memorized the order the
best-path attributes are compared in. Each round shows a table of candidate paths
to one prefix, and you pick the one a Cisco IOS router installs. A correct pick
shows a step ladder that marks each of the first five steps as tie, narrows,
decides or not reached. A wrong pick names the misconception, such as "a shorter
AS-path beats a higher local preference", and shows the values at the step you
skipped. Six rounds across three levels take about ten minutes.

## How it was built

The creator first replaced the workshop's StarterKit SPEC.md, CONSTITUTION.md and
PLAN.md with game-specific versions, then ran the Spec Kit sequence: constitution,
specify, clarify, plan, tasks, analyze, implement. The creator changed direction
twice early on. They dropped "No modeled winner" as a player answer, which meant
both Level 3 rounds had to be redesigned so a lowest-MED decoy loses at an earlier
step. They also swapped the MED values in round 3.2 so path A wins. To keep every
answer identical to what a real Cisco router would install whatever order the
paths arrived in, the content check also requires each winner to beat every other
path one-on-one. In clarify, the creator chose to have broken content stop the game
before play starts. The second clarify question, about level summaries, was left
unanswered. The analyze pass found three critical issues and fixed them before any
code was written. AS numbers 64520 and 64530 were outside the documentation range,
which would have blocked round 2.1 from loading. Two briefings had no worked
examples, and the fixtures did not cite Cisco 13753. Implementation finished 35 of
37 tasks. The test page passes 123 of 123. Deliberately breaking the engine twice
caused 1 and 7 failures, and the suite passed again once each change was undone.

## What we'd tell the next builder

- Check that the answer does not depend on arrival order: with deterministic-med off, a real router compares paths two at a time, so each winner should beat every other candidate one-on-one.
- Run analyze before implement and fix what it flags. It caught out-of-range AS numbers that would have stopped the first round from loading.
- Plan for the checks only people can do, such as reviewing the text against sources and timing a real playtest. Scripted browser checks do not replace them.
