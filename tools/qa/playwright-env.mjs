/**
 * Playwright's host settings, read when playwright loads (import this module before 'playwright').
 *
 * WebKit (R52, 2026-11-24): Playwright ships WebKit builds for Ubuntu and Debian only. On another
 * Linux (this project's Arch machine) it falls back to an old Ubuntu 20.04 build that no longer
 * exists. tools/qa/setup-webkit.sh installs the Ubuntu 24.04 build and the four Ubuntu libraries it
 * needs into the build's own sys/lib folder, so here we only tell Playwright to use that build and
 * to skip its apt-based dependency check. Ubuntu, Debian, macOS and Windows are left alone.
 */
import { existsSync, readFileSync } from 'node:fs';

function debianLike() {
  try {
    return /^(ID|ID_LIKE)=.*\b(ubuntu|debian)\b/m.test(readFileSync('/etc/os-release', 'utf8'));
  } catch {
    return false;
  }
}

if (process.platform === 'linux' && process.arch === 'x64' && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE && !debianLike() && !existsSync('/etc/debian_version')) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'ubuntu24.04-x64';
  process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS ||= '1';
}
