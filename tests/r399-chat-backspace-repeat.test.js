/**
 * #399 (iPhone): holding Backspace in the chat box deleted one character, then nothing. G563's
 * guards (js/ui/chat-input.js strayRepeat, heldAtFocus) drop a walking key's repeats; the on-screen
 * keyboard sends a key-up after each delete and marks the next ones as repeats, so they looked stray.
 * Backspace and Delete never walk, so they are never held back (editKey).
 * Run: node --test tests/r399-chat-backspace-repeat.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EDIT_KEYS, bindChatInput, editKey, heldAtFocus, strayRepeat } from '../public/js/ui/chat-input.js?v=4cde830b';
import { FakeEl } from './social-fake-dom.js';

function field() {
  const f = new FakeEl('textarea');
  const form = new FakeEl('form');
  form.requestSubmit = () => {};
  form.append(f);
  f.selectionStart = 0;
  f.selectionEnd = 0;
  f.setSelectionRange = (a, b) => { f.selectionStart = a; f.selectionEnd = b; };
  return { f, form };
}

describe('#399: a held Backspace deletes on', () => {
  it('editKey is Backspace or Delete, by name or code', () => {
    assert.deepEqual([...EDIT_KEYS], ['Backspace', 'Delete']);
    assert.equal(editKey({ key: 'Backspace' }), true, 'an on-screen keyboard sends no code');
    assert.equal(editKey({ key: 'Delete', code: 'Delete' }), true);
    assert.equal(editKey({ key: 'Unidentified', code: 'Backspace' }), true);
    assert.equal(editKey({ key: 'd', code: 'KeyD' }), false);
    assert.equal(editKey(null), false);
  });

  it('the pure guards never drop an edit key, and still drop a walking key', () => {
    assert.equal(strayRepeat({ key: 'Backspace', repeat: true }, new Set()), false);
    assert.equal(heldAtFocus({ key: 'Backspace', code: 'Backspace' }, new Set(['backspace'])), false);
    assert.equal(strayRepeat({ key: 'd', code: 'KeyD', repeat: true }, new Set()), true, 'G563 stays');
    assert.equal(heldAtFocus({ key: 'a', code: 'KeyA' }, new Set(['keya'])), true, 'G563 stays');
  });

  it("the phone's sequence: down, up, then repeats each with its up, all delete", () => {
    const { f, form } = field();
    bindChatInput(f, { form, win: {} });
    const first = f.dispatch('keydown', { key: 'Backspace', code: '' });
    assert.equal(first.defaultPrevented, false);
    f.dispatch('keyup', { key: 'Backspace', code: '' });
    for (let i = 0; i < 5; i += 1) {
      const rep = f.dispatch('keydown', { key: 'Backspace', code: '', repeat: true });
      assert.equal(rep.defaultPrevented, false, `repeat ${i + 1}`);
      assert.equal(f.dispatch('beforeinput', { inputType: 'deleteContentBackward' }).defaultPrevented, false);
      f.dispatch('keyup', { key: 'Backspace', code: '' });
    }
  });

  it('a Backspace whose key-up went missing still deletes the next time the box opens', () => {
    const win = new FakeEl('window');
    const { f, form } = field();
    win.append(form);
    bindChatInput(f, { form, win });
    // The window saw it go down; its key-up came named otherwise, so the watch still holds it.
    win.dispatch('keydown', { key: 'Backspace', code: '' });
    win.dispatch('keyup', { key: 'Unidentified', code: '' });
    f.dispatch('focus');
    assert.equal(f.dispatch('keydown', { key: 'Backspace', code: '' }).defaultPrevented, false);
    assert.equal(f.dispatch('keydown', { key: 'Backspace', code: '', repeat: true }).defaultPrevented, false);
  });
});
