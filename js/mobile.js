'use strict';
/* Controles por ponteiro: cada dedo mantém seu próprio botão pressionado. */
const TouchControls = {
  active: false,
  pointers: new Map(),
  init() {
    this.root = document.getElementById('touch');
    this.buttons = [...this.root.querySelectorAll('[data-act]')];
    this.pad = this.buttons.find(b => b.parentElement.classList.contains('pad')).parentElement;
    this.actions = this.buttons.find(b => b.dataset.act === 'jump,confirm').parentElement;
    const coarse = window.matchMedia('(any-pointer: coarse)');
    const detect = () => {
      if (coarse.matches || (navigator.maxTouchPoints > 0 && Math.min(innerWidth, innerHeight) <= 1024)) this.enable();
    };
    Input.resetTouch = () => this.reset();
    detect();
    if (coarse.addEventListener) coarse.addEventListener('change', detect);
    window.addEventListener('resize', () => { Input.releaseAll(); detect(); fitScreen(); });
    window.addEventListener('orientationchange', () => Input.releaseAll());
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitScreen);
    window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') this.enable(); }, { capture: true });
    this.root.addEventListener('contextmenu', e => e.preventDefault());
    const move = e => {
      const pointer = this.pointers.get(e.pointerId);
      if (!pointer || !pointer.directional) return;
      e.preventDefault(); pointer.buttons = this.directionAt(e); this.sync();
    };
    const release = e => {
      const pointer = this.pointers.get(e.pointerId); if (!pointer) return;
      // Uma perda de captura antiga não solta um novo toque já capturado.
      if (e.type === 'lostpointercapture' && (e.currentTarget !== pointer.owner || pointer.owner.hasPointerCapture && pointer.owner.hasPointerCapture(e.pointerId))) return;
      e.preventDefault(); this.pointers.delete(e.pointerId); this.sync();
    };
    for (const surface of [...this.buttons, this.pad, this.actions]) {
      surface.addEventListener('pointerdown', e => this.press(e, surface));
      surface.addEventListener('pointermove', move);
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(event, release);
    }
    for (const button of this.buttons) button.setAttribute('aria-pressed', 'false');
    // Fallback também libera o dedo quando a captura não está disponível.
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  },
  press(e, surface) {
    if (e.button !== 0 || this.pointers.has(e.pointerId)) return;
    e.preventDefault(); this.enable();
    const directional = surface === this.pad || surface.parentElement === this.pad;
    const buttons = directional ? this.directionAt(e, this.buttons.includes(surface) ? surface : null)
      : this.buttons.includes(surface) ? [surface] : this.actionAt(e);
    if (buttons.some(b => b.hidden)) return;
    const owner = directional ? this.pad : buttons[0] || surface;
    this.pointers.set(e.pointerId, { owner, directional, buttons });
    this.sync();
    try { if (owner.setPointerCapture) owner.setPointerCapture(e.pointerId); } catch (err) { /* fim do toque tratado pela janela */ }
  },
  directionAt(e, fallback = null) {
    const r = this.pad.getBoundingClientRect();
    if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY) || !Number.isFinite(r.left)) {
      const target = fallback || document.elementFromPoint(e.clientX, e.clientY);
      return this.buttons.includes(target) && target.parentElement === this.pad ? [target] : [];
    }
    if (e.clientX < r.left - 12 || e.clientX > r.right + 12 || e.clientY < r.top - 12 || e.clientY > r.bottom + 12) return [];
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 3), y = (e.clientY - r.top - r.height / 2) / (r.height / 3);
    if (Math.abs(x) < 0.22 && Math.abs(y) < 0.22) return [];
    const actions = [];
    if (Math.abs(x) >= Math.abs(y) * 0.65) actions.push(x < 0 ? 'left' : 'right');
    if (Math.abs(y) >= Math.abs(x) * 0.65) actions.push(y < 0 ? 'up' : 'down');
    return this.buttons.filter(b => b.parentElement === this.pad && actions.includes(b.dataset.act));
  },
  actionAt(e) {
    let best = null, score = Infinity;
    for (const button of this.buttons) {
      if (button.parentElement !== this.actions || button.hidden) continue;
      const r = button.getBoundingClientRect();
      const distance = Math.hypot(Math.max(r.left - e.clientX, 0, e.clientX - r.right), Math.max(r.top - e.clientY, 0, e.clientY - r.bottom));
      const rank = distance * 1000 + Math.hypot(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
      if (distance <= 12 && rank < score) { best = button; score = rank; }
    }
    return best ? [best] : [];
  },
  enable() {
    Input.device = 'touch';
    if (this.active) return;
    this.active = true;
    document.body.classList.add('touch');
    this.root.setAttribute('aria-hidden', 'false');
    fitScreen();
  },
  sync() {
    const next = {};
    for (const [id, pointer] of this.pointers) if (pointer.buttons.some(b => b.hidden)) this.pointers.delete(id);
    for (const { buttons } of this.pointers.values()) {
      for (const button of buttons) for (const action of button.dataset.act.split(',')) next[action] = true;
    }
    for (const action in Input.touch) if (Input.touch[action] && !next[action]) Input.touchReleased[action] = true;
    for (const action in next) if (!Input.touch[action]) {
      Input.hits['touch-' + action] = true;
      Input.anyKey = true;
    }
    Input.touch = next;
    for (const button of this.buttons) {
      const pressed = !button.hidden && [...this.pointers.values()].some(pointer => pointer.buttons.includes(button));
      button.classList.toggle('on', pressed);
      button.setAttribute('aria-pressed', String(pressed));
    }
  },
  reset() {
    this.pointers.clear();
    this.sync();
  },
};
