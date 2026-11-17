// Session state. Pure transitions: reduce(state, action, content) -> new state.
// Transitions: specs/001-first-playable/data-model.md (SessionState).
import { evaluate } from './rules.js';
import { explain } from './feedback.js';

export const HELP_MAX = 3; // 1 method hint, 2 worked step, 3 worked solution

export function initialState(content) {
  const rounds = {};
  for (const level of content.levels) {
    for (const r of level.rounds) rounds[r.id] = { attempts: 0, solved: false, helpLevel: 0, lastResult: null };
  }
  return { view: 'briefing', levelIndex: 0, roundIndex: 0, selection: null, feedback: null, rounds };
}

export const currentLevel = (state, content) => content.levels[state.levelIndex];
export const currentRound = (state, content) => currentLevel(state, content).rounds[state.roundIndex];

function updateRound(state, id, patch) {
  return { ...state, rounds: { ...state.rounds, [id]: { ...state.rounds[id], ...patch } } };
}

export function reduce(state, action, content) {
  switch (action.type) {
    case 'start':
      if (state.view !== 'briefing') return state;
      return { ...state, view: 'round', roundIndex: 0, selection: null, feedback: null };

    case 'select': {
      if (state.view !== 'round') return state;
      const round = currentRound(state, content);
      if (state.rounds[round.id].solved) return state;
      return { ...state, selection: action.pathId };
    }

    case 'submit': {
      if (state.view !== 'round') return state;
      const round = currentRound(state, content);
      const rs = state.rounds[round.id];
      if (rs.solved) return state; // repeated Submit after success has no effect
      const ev = evaluate(round, { pathId: state.selection });
      const feedback = { ...explain(round, ev, content), evaluation: ev };
      if (ev.status === 'invalid-input' || ev.status === 'content-error') {
        return { ...state, feedback };
      }
      const next = updateRound(state, round.id, {
        attempts: rs.attempts + 1,
        solved: ev.status === 'correct',
        lastResult: ev.status,
      });
      return { ...next, feedback };
    }

    case 'help': {
      if (state.view !== 'round') return state;
      const round = currentRound(state, content);
      const rs = state.rounds[round.id];
      if (rs.helpLevel >= HELP_MAX) return state;
      return updateRound(state, round.id, { helpLevel: rs.helpLevel + 1 });
    }

    case 'next': {
      if (state.view === 'round') {
        const round = currentRound(state, content);
        if (!state.rounds[round.id].solved) return state;
        const level = currentLevel(state, content);
        if (state.roundIndex + 1 < level.rounds.length) {
          return { ...state, roundIndex: state.roundIndex + 1, selection: null, feedback: null };
        }
        return { ...state, view: 'level-summary', selection: null, feedback: null };
      }
      if (state.view === 'level-summary') {
        if (state.levelIndex + 1 < content.levels.length) {
          return { ...state, view: 'briefing', levelIndex: state.levelIndex + 1, roundIndex: 0 };
        }
        return { ...state, view: 'session-summary' };
      }
      return state;
    }

    case 'restart':
      return initialState(content);

    default:
      return state;
  }
}

function summarize(state, ids) {
  let completed = 0, attempts = 0, helpViews = 0, roundsWithHelp = 0;
  for (const id of ids) {
    const r = state.rounds[id];
    if (r.solved) completed += 1;
    attempts += r.attempts;
    helpViews += r.helpLevel;
    if (r.helpLevel > 0) roundsWithHelp += 1;
  }
  return { rounds: ids.length, completed, attempts, helpViews, roundsWithHelp };
}

export function levelSummary(state, content, levelIndex = state.levelIndex) {
  return summarize(state, content.levels[levelIndex].rounds.map((r) => r.id));
}

export function sessionSummary(state, content) {
  return summarize(state, content.levels.flatMap((l) => l.rounds.map((r) => r.id)));
}

export function levelComplete(state, content, levelIndex = state.levelIndex) {
  return content.levels[levelIndex].rounds.every((r) => state.rounds[r.id].solved);
}
