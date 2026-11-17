// Content validation. Any error stops the game before play (spec FR-005).
// Contract: specs/001-first-playable/contracts/content-schema.md
import { STEPS, ORIGIN_CODE, selectBestPath, checkHeadToHead, eliminatedAt } from './rules.js';

const STEP_IDS = STEPS.map((s) => s.step);
const MAX32 = 4294967295;
const CISCO = 'cisco-13753';
const PREFIX = '203.0.113.0/24';

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

export function validateContent(doc) {
  const errors = [];
  const err = (levelId, roundId, field, problem) => errors.push({ levelId, roundId, field, problem });

  try {
    if (!doc || typeof doc !== 'object') {
      err(null, null, 'document', 'content is not an object');
      return { ok: false, errors };
    }
    if (doc.schemaVersion !== 1) err(null, null, 'schemaVersion', 'must be 1');
    if (!isStr(doc.method)) err(null, null, 'method', 'must be a non-empty string');

    const catalog = doc.misconceptions;
    if (!catalog || typeof catalog !== 'object') {
      err(null, null, 'misconceptions', 'missing');
    } else {
      for (const [code, m] of Object.entries(catalog)) {
        if (!m || !isStr(m.label)) err(null, null, `misconceptions.${code}.label`, 'must be a non-empty string');
        if (!m || !Array.isArray(m.allowedAt) || m.allowedAt.length === 0 || m.allowedAt.some((s) => !STEP_IDS.includes(s))) {
          err(null, null, `misconceptions.${code}.allowedAt`, 'must list valid steps');
        }
      }
    }

    const sourceIds = new Set();
    if (!Array.isArray(doc.sources)) {
      err(null, null, 'sources', 'missing');
    } else {
      for (const s of doc.sources) {
        if (!s || !isStr(s.id)) { err(null, null, 'sources.id', 'must be a non-empty string'); continue; }
        if (sourceIds.has(s.id)) err(null, null, `sources.${s.id}`, 'duplicate source id');
        sourceIds.add(s.id);
        for (const f of ['title', 'url', 'section', 'claim']) {
          if (!isStr(s[f])) err(null, null, `sources.${s.id}.${f}`, 'must be a non-empty string');
        }
      }
    }

    const checkSources = (levelId, roundId, field, ids) => {
      if (!Array.isArray(ids) || ids.length === 0) { err(levelId, roundId, field, 'must list at least one source'); return; }
      for (const id of ids) if (!sourceIds.has(id)) err(levelId, roundId, field, `unknown source "${id}"`);
      if (!ids.includes(CISCO)) err(levelId, roundId, field, 'must include the Cisco 13753 source');
    };

    if (!Array.isArray(doc.levels)) {
      err(null, null, 'levels', 'missing');
      return { ok: false, errors };
    }
    if (doc.levels.length !== 3) err(null, null, 'levels', `must contain exactly 3 levels (found ${doc.levels.length})`);

    const levelIds = new Set();
    const roundIds = new Set();
    let lastDifficulty = 0;

    for (const level of doc.levels) {
      const lid = level && level.id;
      if (!['1', '2', '3'].includes(lid)) err(lid ?? null, null, 'level.id', 'must be "1", "2", or "3"');
      else if (levelIds.has(lid)) err(lid, null, 'level.id', 'duplicate level id');
      levelIds.add(lid);
      if (!isStr(level.title)) err(lid, null, 'level.title', 'must be a non-empty string');
      if (!['LO1', 'LO2', 'LO3'].includes(level.outcome)) err(lid, null, 'level.outcome', 'must be LO1, LO2, or LO3');

      const rounds = Array.isArray(level.rounds) ? level.rounds : [];
      if (rounds.length !== 2) err(lid, null, 'level.rounds', `must contain exactly 2 rounds (found ${rounds.length})`);

      // Briefing
      const b = level.briefing;
      if (!b || typeof b !== 'object') {
        err(lid, null, 'briefing', 'missing');
      } else {
        if (!isStr(b.concept)) err(lid, null, 'briefing.concept', 'must be a non-empty string');
        checkSources(lid, null, 'briefing.sourceIds', b.sourceIds);
        const ex = b.example;
        if (!ex || typeof ex !== 'object') {
          err(lid, null, 'briefing.example', 'missing');
        } else {
          const okPaths = checkCandidates(ex.candidates, /^[P-Z]$/, lid, null, 'briefing.example.candidates', err);
          if (!isStr(ex.explanation)) err(lid, null, 'briefing.example.explanation', 'must be a non-empty string');
          if (okPaths) {
            const r = selectBestPath(ex.candidates);
            if (r.status !== 'ok') err(lid, null, 'briefing.example', r.reasonCode);
            else {
              if (ex.winner !== r.survivor) err(lid, null, 'briefing.example.winner', `authored winner ${ex.winner} but the rule selects ${r.survivor}`);
              const h = checkHeadToHead(ex.candidates, r.survivor);
              if (!h.ok) err(lid, null, 'briefing.example', `head-to-head check failed against ${h.failures.join(', ')}`);
            }
            const roundNeighbors = new Set(rounds.flatMap((rd) => (Array.isArray(rd && rd.candidates) ? rd.candidates.map((c) => c && Array.isArray(c.asPath) ? c.asPath[0] : null) : [])));
            for (const c of ex.candidates) {
              if (roundNeighbors.has(c.asPath[0])) err(lid, null, 'briefing.example.candidates', `neighboring AS ${c.asPath[0]} is also used by a round in this level`);
            }
          }
        }
      }

      for (const round of rounds) {
        validateRound(round, lid, { err, catalog: catalog || {}, roundIds, checkSources });
        if (round && Number.isInteger(round.difficulty)) {
          if (round.difficulty < lastDifficulty) err(lid, round.id ?? null, 'difficulty', `lower than the previous round (${round.difficulty} < ${lastDifficulty})`);
          lastDifficulty = Math.max(lastDifficulty, round.difficulty);
        }
      }
    }
  } catch (e) {
    err(null, null, 'document', `could not be read: ${e.message}`);
  }
  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}

function checkCandidates(list, idPattern, lid, rid, field, err) {
  if (!Array.isArray(list) || list.length < 2 || list.length > 4) {
    err(lid, rid, field, 'must contain 2 to 4 paths');
    return false;
  }
  let valid = true;
  const ids = new Set();
  const peers = new Set();
  for (const c of list) {
    const pid = c && c.id;
    const bad = (f, problem) => { err(lid, rid, `${field}.${pid ?? '?'}.${f}`, problem); valid = false; };
    if (!c || typeof c !== 'object') { bad('path', 'not an object'); continue; }
    if (typeof pid !== 'string' || !idPattern.test(pid)) bad('id', `must match ${idPattern}`);
    else if (ids.has(pid)) bad('id', 'duplicate path id');
    ids.add(pid);
    const m = typeof c.peer === 'string' && c.peer.match(/^192\.0\.2\.(\d{1,3})$/);
    if (!m || Number(m[1]) > 255) bad('peer', 'must be an IPv4 address in 192.0.2.0/24');
    else if (peers.has(c.peer)) bad('peer', 'duplicate peer');
    peers.add(c.peer);
    if (!isInt(c.weight, 0, 65535)) bad('weight', 'must be an integer 0-65535');
    if (!isInt(c.localPref, 0, MAX32)) bad('localPref', 'must be an integer 0-4294967295');
    if (!Array.isArray(c.asPath) || c.asPath.length < 1 || c.asPath.length > 6 || c.asPath.some((a) => !isInt(a, 64496, 64511))) {
      bad('asPath', 'must be 1-6 ASNs in 64496-64511');
    }
    if (!Object.prototype.hasOwnProperty.call(ORIGIN_CODE, c.origin)) bad('origin', 'must be "i", "e", or "?"');
    if (!isInt(c.med, 0, MAX32)) bad('med', 'required; must be an integer 0-4294967295');
  }
  return valid;
}

function citedNumbersAllowed(round) {
  const allowed = new Set([1, 2, 3, 4, 5]);
  for (const c of round.candidates) {
    allowed.add(c.weight); allowed.add(c.localPref); allowed.add(c.asPath.length);
    allowed.add(ORIGIN_CODE[c.origin]); allowed.add(c.med);
    for (const a of c.asPath) allowed.add(a);
  }
  return allowed;
}

function validateRound(round, lid, { err, catalog, roundIds, checkSources }) {
  if (!round || typeof round !== 'object') { err(lid, null, 'round', 'not an object'); return; }
  const rid = round.id;
  if (typeof rid !== 'string' || !/^[1-3]\.[12]$/.test(rid)) err(lid, rid ?? null, 'round.id', 'must look like "1.1"');
  else if (roundIds.has(rid)) err(lid, rid, 'round.id', 'duplicate round id');
  roundIds.add(rid);
  if (!isInt(round.difficulty, 1, 3)) err(lid, rid, 'difficulty', 'must be an integer 1-3');
  if (round.prefix !== PREFIX) err(lid, rid, 'prefix', `must be ${PREFIX}`);
  checkSources(lid, rid, 'sourceIds', round.sourceIds);

  if (!checkCandidates(round.candidates, /^[A-D]$/, lid, rid, 'candidates', err)) return;

  const result = selectBestPath(round.candidates);
  if (result.status !== 'ok') { err(lid, rid, 'candidates', result.reasonCode); return; }
  if (round.expectedWinner !== result.survivor) {
    err(lid, rid, 'expectedWinner', `authored winner ${round.expectedWinner} but the rule selects ${result.survivor}`);
  }
  const h = checkHeadToHead(round.candidates, result.survivor);
  if (!h.ok) err(lid, rid, 'candidates', `head-to-head check failed against ${h.failures.join(', ')}`);

  const wc = round.wrongChoices;
  if (!wc || typeof wc !== 'object') { err(lid, rid, 'wrongChoices', 'missing'); return; }
  if (Object.prototype.hasOwnProperty.call(wc, result.survivor)) err(lid, rid, `wrongChoices.${result.survivor}`, 'lists the winning path');
  const allowedNums = citedNumbersAllowed(round);
  const lowestMed = Math.min(...round.candidates.map((c) => c.med));
  for (const c of round.candidates) {
    if (c.id === result.survivor) continue;
    const w = wc[c.id];
    const f = `wrongChoices.${c.id}`;
    if (!w) { err(lid, rid, f, 'missing named misconception for this wrong choice'); continue; }
    if (!isStr(w.explanation)) err(lid, rid, `${f}.explanation`, 'must be a non-empty string');
    const m = catalog[w.reasonCode];
    if (!m) { err(lid, rid, `${f}.reasonCode`, `unknown reasonCode "${w.reasonCode}"`); continue; }
    const at = eliminatedAt(result.ladder, c.id);
    if (!Array.isArray(m.allowedAt) || !m.allowedAt.includes(at)) {
      err(lid, rid, `${f}.reasonCode`, `"${w.reasonCode}" does not fit a path eliminated at ${at}`);
    }
    if (m.requiresLowestMed && c.med !== lowestMed) {
      err(lid, rid, `${f}.reasonCode`, `"${w.reasonCode}" requires the path to have the round's lowest MED`);
    }
    if (isStr(w.explanation)) {
      for (const n of (w.explanation.match(/\d+/g) || []).map(Number)) {
        if (!allowedNums.has(n)) err(lid, rid, `${f}.explanation`, `cites ${n}, which is not a value in this round`);
      }
    }
  }
}
