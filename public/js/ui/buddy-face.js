/**
 * A buddy's round avatar: the lettered circle, with the buddy's own look over it once the picture
 * loads (report #178, the site's tile picture). Shared by the Social drawer's Buddies tab and Who's
 * here list (js/ui/social-drawer.js) and the Buddies window (js/features/buddies-feature.js,
 * report #608), so a picture that does not load falls back the same way everywhere: the lettered
 * circle stays, no broken image, and the picture is not asked for again for a while
 * (js/buddy-list.js createFaceMemory).
 *
 * The look is .social-av / .social-face in style.css (the head fitted to the circle, report #229).
 */
import { createFaceMemory } from '../buddy-list.js?v=b418f3f2';

/** A name's initial and a colour slot (0-7) for the round avatar. */
export function avatarOf(name) {
  const s = String(name || '?').trim() || '?';
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return { initial: [...s][0].toUpperCase(), hue: h % 8 };
}

function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  if (text) node.textContent = text;
  return node;
}

/**
 * The faces of one list (or a few lists): faceNode(r, nodes) is the one picture node of buddy r
 * ({ id, face }), moved into each redraw of their row (no reload, no flash), or null when there is
 * no picture or it did not load; avatar(r, o) is the whole round avatar ({ id, name, face }).
 * `lazy`: the picture loads only when its circle is shown (a skin that hides the circle asks for none).
 */
export function createBuddyFaces({ memory = createFaceMemory(), lazy = false } = {}) {
  const shared = new Map();

  function faceNode(r, nodes = shared) {
    if (!r.face || memory.state(r.id) === 'bad') return null;
    const had = nodes.get(r.id);
    if (had && had.src === r.face) return had.node;
    const node = el('span', { class: 'social-face' });
    const img = el('img', { src: r.face, alt: '', width: '100', height: '144', decoding: 'async', draggable: 'false', loading: lazy ? 'lazy' : false });
    // The circle the picture sits in now (its row is drawn again whenever the list changes).
    const circle = () => node.parentElement || null;
    img.addEventListener('load', () => { memory.ok(r.id); circle()?.setAttribute('data-face', ''); });
    img.addEventListener('error', () => {
      memory.bad(r.id);
      nodes.delete(r.id);
      circle()?.removeAttribute('data-face');
      node.remove?.();
    });
    node.append(img);
    nodes.set(r.id, { src: r.face, node });
    return node;
  }

  /** The lettered circle with the buddy's face over it (shown at once when it loaded before). */
  function avatar(r, { nodes = shared, className = '' } = {}) {
    const a = avatarOf(r.name);
    const av = el('span', { class: className ? `social-av ${className}` : 'social-av', 'data-hue': String(a.hue), 'aria-hidden': 'true' }, a.initial);
    const face = faceNode(r, nodes);
    if (face) {
      if (memory.state(r.id) === 'ok') av.setAttribute('data-face', '');
      av.append(face);
    }
    return av;
  }

  return { memory, faceNode, avatar };
}
