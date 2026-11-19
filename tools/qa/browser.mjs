/**
 * Playwright's Chrome with the project's flags, behind the one-browser lock.
 *
 *   import { openBrowser } from './browser.mjs';
 *   const { browser, close } = await openBrowser({ online: true, label: 'my check' });
 *   ...
 *   await close();            // closes Chrome, then releases the lock
 *
 * Flags: the GPU path the game is measured on (gpuArgs: Metal on macOS, Vulkan on Linux), autoplay
 * without a gesture, and `--mute-audio` (unless GRODDLE_BROWSER_SOUND=1); `online: true` adds `--disable-features=LocalNetworkAccessChecks` (and
 * the older private-network names) so /play/online/ on https://groddle.localhost may reach
 * the local socket. Real Chrome by default (GRODDLE_BROWSER_CHANNEL= empty uses Playwright's
 * own Chromium). launchBrowser() alone launches without the lock: only for code that already
 * holds it.
 */
import { chromium } from 'playwright';
import { acquireLock } from './browser-lock.mjs';

/**
 * The real GPU for headless Chrome (pure). ANGLE's Metal backend exists only on macOS: on Linux
 * Chrome given `--use-angle=metal` has no WebGL2 at all, and with no flag it falls back to
 * SwiftShader (software, a few fps, so game timers run slow). Vulkan reaches the real GPU there.
 */
export function gpuArgs(platform = process.platform) {
  return platform === 'darwin'
    ? ['--use-angle=metal', '--enable-gpu']
    : ['--use-angle=vulkan', '--enable-gpu', '--enable-features=Vulkan', '--ignore-gpu-blocklist'];
}
export const GPU_ARGS = gpuArgs();

// --mute-audio: QA browsers play the game silently (Austin 2026-11-15: background test runs were audible);
// GRODDLE_BROWSER_SOUND=1 keeps the sound for a run that checks audio by ear.
export const BASE_ARGS = [...GPU_ARGS, '--autoplay-policy=no-user-gesture-required', ...(process.env.GRODDLE_BROWSER_SOUND === '1' ? [] : ['--mute-audio'])];
export const ONLINE_ARGS = ['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'];

/** The launch arguments (pure). */
export function browserArgs({ online = false, extra = [] } = {}) {
  return [...BASE_ARGS, ...(online ? ONLINE_ARGS : []), ...extra];
}

/** Launches Chrome; the caller must already hold the browser lock. */
export async function launchBrowser({ online = false, headless = true, extra = [], channel = process.env.GRODDLE_BROWSER_CHANNEL ?? 'chrome' } = {}) {
  return chromium.launch({ ...(channel ? { channel } : {}), headless, args: browserArgs({ online, extra }) });
}

/**
 * Takes the lock (waiting), then launches. close() closes Chrome and releases the lock; it is
 * safe to call more than once. Lock options (label, waitMs, staleMs, handleSignals, log) pass
 * through to acquireLock.
 */
export async function openBrowser({ online = false, headless = true, extra = [], channel, ...lockOptions } = {}) {
  const lock = await acquireLock(lockOptions);
  let browser;
  try {
    browser = await launchBrowser({ online, headless, extra, ...(channel !== undefined ? { channel } : {}) });
  } catch (e) {
    lock.release();
    throw e;
  }
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await browser.close().catch(() => {});
    lock.release();
  };
  return { browser, lock, close };
}
