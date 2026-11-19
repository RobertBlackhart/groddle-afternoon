/**
 * The Python 3.11 the art tools run on, found the same way on every machine:
 * $GRODDLE_PYTHON when set, else Homebrew's (macOS), else the first python3.11 on PATH.
 * Tests that need it skip with `!existsSync(python311)` when none is found.
 */
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

function find() {
  if (process.env.GRODDLE_PYTHON) return process.env.GRODDLE_PYTHON;
  if (existsSync('/opt/homebrew/bin/python3.11')) return '/opt/homebrew/bin/python3.11';
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    const p = join(dir, 'python3.11');
    if (dir && existsSync(p)) return p;
  }
  return '/opt/homebrew/bin/python3.11';
}

export const python311 = find();
