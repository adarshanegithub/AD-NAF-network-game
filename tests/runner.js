// Dependency-free test runner. Zero discovered tests is a failure.
const cases = [];

export function test(id, fn) {
  cases.push({ id, fn });
}

export class AssertionError extends Error {}

export function eq(actual, expected, label = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new AssertionError(`${label ? label + ': ' : ''}expected ${e}, got ${a}`);
  }
}

export function ok(value, label = 'expected truthy') {
  if (!value) throw new AssertionError(label);
}

export async function run() {
  const results = [];
  for (const c of cases) {
    try {
      await c.fn();
      results.push({ id: c.id, pass: true });
    } catch (err) {
      results.push({ id: c.id, pass: false, message: err && err.message ? err.message : String(err) });
    }
  }
  const failed = results.filter((r) => !r.pass);
  const total = results.length;
  return {
    total,
    passed: total - failed.length,
    failed,
    ok: total > 0 && failed.length === 0,
    results,
  };
}
