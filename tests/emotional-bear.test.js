import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { python311 } from './python311.js';

import {
  EMOTIONAL_BEAR_ACTIONS,
  EMOTIONAL_BEAR_COMPANIONS,
  createEmotionalBearState,
  emotionalBearActionQuote,
  emotionalBearIcon,
  emotionalBearIconState,
  emotionalBearUpgradeQuote,
  listEmotionalBearActions,
  normalizeEmotionalBearState,
  performEmotionalBearAction,
  upgradeEmotionalBear,
} from '../public/js/emotional-bear.js?v=1c88a46a';

const publicRoot = join(import.meta.dirname, '..', 'public');

describe('source-authored Emotional Bear', () => {
  it('starts plain and preserves the four original visual states', () => {
    const plain = createEmotionalBearState();
    assert.equal(emotionalBearIconState(plain), 'plain');
    assert.equal(emotionalBearIcon(plain), 'assets/sprites/emotional-bear/iconic_plain.webp');
    assert.equal(emotionalBearIconState(createEmotionalBearState({ upgrades: ['kiss'] })), 'kiss');
    assert.equal(emotionalBearIconState(createEmotionalBearState({ upgrades: ['moon'] })), 'moon');
    assert.equal(
      emotionalBearIconState(createEmotionalBearState({ upgrades: ['moon', 'kiss'] })),
      'moon_kiss'
    );
  });

  it('consumes Lips and Moon exactly once and exposes the unlocked emotes', () => {
    const state = createEmotionalBearState();
    const inventory = { lips: 1, moon: 1 };
    assert.equal(emotionalBearUpgradeQuote(state, inventory, 'kiss').ok, true);
    assert.equal(upgradeEmotionalBear(state, inventory, 'kiss').ok, true);
    assert.equal(inventory.lips, 0);
    assert.equal(emotionalBearIconState(state), 'kiss');
    assert.equal(upgradeEmotionalBear(state, inventory, 'kiss').reason, 'already_upgraded');
    assert.equal(upgradeEmotionalBear(state, inventory, 'moon').ok, true);
    assert.equal(inventory.moon, 0);
    assert.deepEqual(state.upgrades, ['kiss', 'moon']);
    assert.equal(emotionalBearIconState(state), 'moon_kiss');
  });

  it('preserves the original social energy and mood economy', () => {
    const state = createEmotionalBearState({ upgrades: ['kiss', 'moon'] });
    const pc = { energy: 50, mood: 40 };

    const hug = performEmotionalBearAction(state, pc, 'hug', 'Amp');
    assert.equal(hug.ok, true);
    assert.deepEqual(hug.effects, { energy: -5, mood: 2 });
    assert.deepEqual(hug.targetEffects, { mood: 2 });
    assert.equal(pc.energy, 45);
    assert.equal(pc.mood, 42);
    assert.equal(state.companionMood.Amp, 72);

    const highFive = performEmotionalBearAction(state, pc, 'high_five', 'Bumbishfish');
    assert.equal(highFive.ok, true);
    assert.deepEqual(highFive.effects, { energy: -10 });
    assert.equal(state.companionMood.Bumbishfish, 80);

    const kiss = performEmotionalBearAction(state, pc, 'kiss', 'Lily Linguistic');
    assert.equal(kiss.ok, true);
    assert.equal(kiss.durationMs, 3000);
    const moon = performEmotionalBearAction(state, pc, 'moon', 'Lily Linguistic');
    assert.equal(moon.ok, true);
    assert.equal(moon.durationMs, 6000);
    assert.equal(state.totalEmotes, 4);
  });

  it('requires more energy than the cost and blocks race outbursts', () => {
    const state = createEmotionalBearState();
    assert.equal(
      emotionalBearActionQuote(state, { energy: 5 }, 'hug', 'Amp').reason,
      'energy'
    );
    assert.equal(
      emotionalBearActionQuote(state, { energy: 6 }, 'hug', 'Amp').ok,
      true
    );
    assert.equal(
      emotionalBearActionQuote(state, { energy: 99 }, 'hug', 'Amp', { inRace: true }).reason,
      'race'
    );
    assert.equal(
      emotionalBearActionQuote(state, { energy: 99 }, 'kiss', 'Amp').reason,
      'missing_upgrade'
    );
    assert.equal(
      emotionalBearActionQuote(state, { energy: 99 }, 'hug', 'Not A Player').reason,
      'target'
    );
  });

  it('anthropomorphizes for up to 20 mood once per game day', () => {
    const state = createEmotionalBearState();
    const pc = { energy: 20, mood: 88 };
    const first = performEmotionalBearAction(
      state,
      pc,
      'anthropomorphize',
      '',
      { dayKey: '16-07-25' }
    );
    assert.equal(first.ok, true);
    assert.deepEqual(first.effects, { mood: 12 });
    assert.equal(pc.mood, 100);
    assert.equal(
      performEmotionalBearAction(
        state,
        pc,
        'anthropomorphize',
        '',
        { dayKey: '16-07-25' }
      ).reason,
      'daily_limit'
    );
    assert.equal(
      performEmotionalBearAction(
        state,
        pc,
        'anthropomorphize',
        '',
        { dayKey: '16-07-26' }
      ).ok,
      true
    );
  });

  it('tracks distinct companion interactions and sanitizes old saves', () => {
    const state = createEmotionalBearState();
    const pc = { energy: 100, mood: 10 };
    assert.equal(performEmotionalBearAction(state, pc, 'hug', 'Amp').uniqueTarget, true);
    assert.equal(performEmotionalBearAction(state, pc, 'hug', 'Amp').uniqueTarget, false);
    assert.equal(performEmotionalBearAction(state, pc, 'hug', 'Bumbishfish').uniqueTarget, true);
    assert.equal(state.interactions.hug.Amp, 2);
    assert.equal(state.interactions.hug.Bumbishfish, 1);

    const cleaned = normalizeEmotionalBearState({
      upgrades: ['kiss', 'kiss', 'bad'],
      anthropomorphizedDay: '<bad day>',
      companionMood: { Amp: 999, Hacker: 50 },
      interactions: { hug: { Amp: 3.8, Hacker: 99 }, hack: { Amp: 5 } },
      totalEmotes: -10,
    });
    assert.deepEqual(cleaned.upgrades, ['kiss']);
    assert.equal(cleaned.anthropomorphizedDay, 'badday');
    assert.equal(cleaned.companionMood.Amp, 100);
    assert.deepEqual(cleaned.interactions.hug, { Amp: 3 });
    assert.equal(cleaned.totalEmotes, 0);
  });

  it('publishes the original action table and target roster', () => {
    assert.deepEqual(EMOTIONAL_BEAR_COMPANIONS, ['Amp', 'Bumbishfish', 'Lily Linguistic']);
    assert.equal(EMOTIONAL_BEAR_ACTIONS.hug.energy, 5);
    assert.equal(EMOTIONAL_BEAR_ACTIONS.hug.selfMood, 2);
    assert.equal(EMOTIONAL_BEAR_ACTIONS.high_five.targetMood, 10);
    assert.equal(EMOTIONAL_BEAR_ACTIONS.kiss.upgrade, 'kiss');
    assert.equal(EMOTIONAL_BEAR_ACTIONS.moon.upgrade, 'moon');
    const rows = listEmotionalBearActions(
      createEmotionalBearState(),
      { energy: 100 },
      { dayKey: 'day-1' }
    );
    assert.deepEqual(
      rows.filter((row) => row.available).map((row) => row.id),
      ['hug', 'high_five', 'anthropomorphize']
    );
  });

  it('ships clean OGA states, animation atlases, pack controls, and deterministic QA', () => {
    const assetRoot = join(publicRoot, 'assets', 'sprites', 'emotional-bear');
    for (const file of [
      'iconic_plain.webp',
      'iconic_kiss.webp',
      'iconic_moon.webp',
      'iconic_moon_kiss.webp',
      'hug.webp',
      'high-five.webp',
      'kiss.webp',
      'moon.webp',
    ]) {
      const path = join(assetRoot, file);
      assert.equal(existsSync(path), true, file);
      assert.ok(statSync(path).size > 100, file);
    }
    for (const file of ['lips.webp', 'moon.webp', 'emotional_bear.webp']) {
      assert.equal(existsSync(join(publicRoot, 'assets', 'sprites', 'icons', file)), true, file);
    }
    const game = readFileSync(join(publicRoot, 'game.js'), 'utf8');
    const html = readFileSync(join(publicRoot, 'play/index.html'), 'utf8');
    const css = readFileSync(join(publicRoot, 'style.css'), 'utf8');
    assert.match(game, /openEmotionalBearPicker/);
    assert.match(game, /upgradePackedEmotionalBear/);
    assert.match(game, /beardemo/);
    assert.match(html, /id="emotional-bear-picker"/);
    assert.match(html, /id="emotional-bear-fx"/);
    assert.match(css, /\.emotional-bear-target/);
    assert.match(css, /\.pack-bear-state/);
  });
});

describe('the four emotes are the SWF\'s scenes, built and checked by tools/emote-art (#530)', () => {
  const root = join(import.meta.dirname, '..');
  const meta = JSON.parse(readFileSync(join(root, 'tools/emote-art/bears.json'), 'utf8'));
  // emotional_bear.swf's scene table (DefineSceneAndFrameLabelData) and items/emotional_bear.js's overlay times.
  const SCENES = { hug: [10, 100, 'hug', 5000], high_5: [246, 322, 'high_five', 4000], moon: [101, 245, 'moon', 6000], kiss: [323, 391, 'kiss', 3000] };
  const riff = (file) => {
    const b = readFileSync(join(publicRoot, file));
    assert.equal(b.toString('ascii', 0, 4), 'RIFF', file);
    const out = { frames: 0, ms: 0, loop: -1, canvas: null, durs: [] };
    for (let i = 12; i + 8 <= b.length;) {
      const id = b.toString('ascii', i, i + 4);
      const len = b.readUInt32LE(i + 4);
      if (id === 'ANMF') { const d = b.readUIntLE(i + 8 + 12, 3); out.frames += 1; out.ms += d; out.durs.push(d); }
      if (id === 'ANIM') out.loop = b.readUInt16LE(i + 12);
      if (id === 'VP8X') out.canvas = [b.readUIntLE(i + 12, 3) + 1, b.readUIntLE(i + 15, 3) + 1];
      i += 8 + len + (len & 1);
    }
    return out;
  };

  it('each file is one scene, every frame of it, played once at Glitch\'s 30 fps and held for the overlay\'s time, inside the 220 x 226 box', () => {
    assert.deepEqual(Object.keys(meta.emotes).sort(), Object.keys(SCENES).sort());
    for (const [state, [first, last, action, overlay]] of Object.entries(SCENES)) {
      const e = meta.emotes[state];
      const count = last - first + 1;
      assert.deepEqual(e.frames, [first, last], state);
      assert.equal(e.count, count, state);
      assert.equal(e.boxes.length, count, state);
      assert.equal(e.overlayMs, overlay, state);
      assert.equal(EMOTIONAL_BEAR_ACTIONS[action].durationMs, overlay, `${state}: the game shows it for the overlay's time`);
      assert.equal(e.file, `assets/sprites/emotional-bear/${EMOTIONAL_BEAR_ACTIONS[action].animation}.webp`);
      const w = riff(e.file);
      assert.deepEqual(w.canvas, e.size, state);
      assert.ok(e.size[0] <= 220 && e.size[1] <= 226, `${state} ${e.size}`);
      assert.ok(w.frames <= count && w.frames >= count * 0.6, `${state}: ${w.frames} pictures for ${count} frames`);
      assert.equal(w.ms, overlay, state);
      // Glitch played the scene at the SWF's 30 fps and stopped on its last frame (MainTimeline stop()):
      // the art is over by (count - 1) / 30 s, the empty last picture holds until the overlay ends.
      assert.equal(e.fps, 30, state);
      assert.equal(w.loop, 1, `${state} plays once`);
      const lastStart = w.ms - w.durs.at(-1);
      assert.ok(lastStart <= Math.ceil(((count - 1) * 1000) / 30) && lastStart >= ((count - 1) * 1000) / 30 * 0.9, `${state}: the scene runs ${lastStart} ms for ${count} frames`);
      const sorted = [...w.durs].sort((a, b) => a - b);
      assert.ok([33, 34].includes(sorted[sorted.length >> 1]), `${state}: most pictures last a 30th of a second`);
      // The scene fades in from nothing and out to nothing; every frame between draws inside the file.
      assert.equal(e.boxes[0], null, `${state} starts empty`);
      assert.equal(e.boxes[count - 1], null, `${state} ends empty`);
      for (const b of e.boxes.filter(Boolean)) assert.ok(b[0] >= 0 && b[1] >= 0 && b[2] <= e.size[0] && b[3] <= e.size[1], `${state} box ${b}`);
    }
  });

  it('the shipped pictures draw where the scene does, frame by frame (a mis-cut sheet or trails fail)', { skip: !existsSync(python311) && 'no python3.11' }, () => {
    let out;
    try {
      out = execFileSync(python311, ['-I', join(root, 'tools/emote-art/build.py'), '--check', '--only', 'bears', '--no-render'], { encoding: 'utf8' });
    } catch (err) {
      if (/ENOENT|No module named/.test(String(err.stderr || err))) return;
      throw new Error(String(err.stdout || err));
    }
    assert.match(out, /bear emotes: 4 current/);
  });
});
