/**
 * G955 (#472): a Butterfly said "&lt;333 msrgs". GameServerJS text is Flash htmlText, and the data
 * builders copied its entities through, so every plain-text draw (Pixi Text, textContent) showed
 * them as written, and an HTML one escaped them a second time. The builders now decode them once
 * (tools/data-text.mjs), the game has one decoder (js/html-text.js) for what still arrives as HTML,
 * and escapes only where it writes HTML.
 * Run: node --test tests/g955-no-entities-in-data.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeEntities, htmlToText } from '../public/js/html-text.js?v=6bbf4d1f';
import { dataText, strayEntity } from '../tools/data-text.mjs';
import { VERB_RESPONSE_POOLS } from '../public/js/verb-responses-data.js?v=0777b59b';
import { ROOK_RESPONSES, rookResponse } from '../public/js/rook-attack.js?v=5e62a79f';

const here = dirname(fileURLToPath(import.meta.url));
const PUB = join(here, '../public');
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/i;

function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(name)) out.push(p);
  }
  return out;
}

function strings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { out.push([`${path} key`, k]); strings(v, `${path}.${k}`, out); }
  return out;
}

describe('one entity decoder (G955)', () => {
  it('decodes named and numeric entities once', () => {
    assert.equal(decodeEntities('i &lt;333 u &amp;lt; &#34;freedom&#34; Moonga Coral&#x9;'), 'i <333 u &lt; "freedom" Moonga Coral\t');
    assert.equal(decodeEntities('&lt;b&gt; &amp;', { keep: new Set(['lt', 'gt', 'amp']) }), '&lt;b&gt; &amp;');
    assert.equal(htmlToText('Plant &amp; Certify<br>now<split butt_txt="Ok" />done&nbsp;!'), 'Plant & Certify\nnow\n\ndone !');
    assert.equal(htmlToText('<span class="act-gain">+3 &lt;3</span>  x', { collapse: true }), '+3 <3 x');
  });

  it('builder text: plain strings fully decoded, markup keeps only &lt; &gt; &amp;', () => {
    assert.equal(dataText('Plant &amp; Certify'), 'Plant & Certify');
    assert.equal(dataText('a<br>&nbsp;&#34;b&#34; &lt;3'), 'a<br> "b" &lt;3');
    assert.equal(strayEntity('i &lt;3 u'), '&lt;');
    assert.equal(strayEntity('<b>x</b> &lt;3'), null);
  });
});

describe('shipped data holds characters, not entities (G955)', () => {
  it('no JSON under public/assets holds a stray entity', () => {
    const bad = [];
    for (const file of walk(join(PUB, 'assets'), (n) => n.endsWith('.json'))) {
      const raw = readFileSync(file, 'utf8');
      if (!ENTITY.test(raw)) continue;
      for (const [path, s] of strings(JSON.parse(raw), '', [])) {
        const e = strayEntity(s);
        if (e) bad.push(`${relative(PUB, file)} ${path}: ${e} in ${JSON.stringify(s.slice(0, 60))}`);
      }
    }
    assert.deepEqual(bad.slice(0, 20), []);
  });

  it('no generated data module holds a stray entity in a string', () => {
    const bad = [];
    for (const file of walk(join(PUB, 'js'), (n) => n.endsWith('-data.js'))) {
      const raw = readFileSync(file, 'utf8');
      if (!ENTITY.test(raw)) continue;
      for (const m of raw.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)) {
        const e = strayEntity(m[0].slice(1, -1));
        if (e) bad.push(`${relative(PUB, file)}: ${e} in ${m[0].slice(0, 60)}`);
      }
    }
    assert.deepEqual(bad.slice(0, 20), []);
  });

  it('#472: the Butterflies, Piggies and Rooks say <3, and the jobs read "&"', () => {
    const lines = Object.values(VERB_RESPONSE_POOLS).flatMap((pools) => Object.values(pools).flat());
    assert.ok(lines.includes('i <3 u + ur msrgs'));
    assert.ok(lines.some((l) => l.includes('<333')));
    assert.ok(!lines.some((l) => /&(lt|gt|amp);/.test(l)));
    const rook = Object.values(ROOK_RESPONSES).flatMap((pools) => Object.values(pools).flat());
    assert.ok(!rook.some((l) => ENTITY.test(l)));
    assert.equal(rookResponse('trant_fruit', 'rooked', () => 0), ROOK_RESPONSES.trant_fruit.rooked[0]);
    const jobs = readFileSync(join(PUB, 'assets/content/street-jobs.json'), 'utf8');
    assert.ok(jobs.includes('"Plant & Certify"'));
  });

  it('no module but js/html-text.js keeps its own entity replaces', () => {
    const own = /\.replace\(\/&(amp|lt|gt|quot|apos|nbsp|hellip|#)/;
    const bad = [];
    for (const file of [...walk(join(PUB, 'js'), (n) => n.endsWith('.js')), join(PUB, 'game.js'), join(PUB, 'content.js')]) {
      const rel = relative(PUB, file);
      // data-urls.js reads "&amp;" in URL query strings, not text.
      if (rel === 'js/html-text.js' || rel === 'js/data-urls.js') continue;
      if (own.test(readFileSync(file, 'utf8'))) bad.push(rel);
    }
    assert.deepEqual(bad, []);
  });
});
