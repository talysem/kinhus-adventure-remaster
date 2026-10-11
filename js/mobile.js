'use strict';
/* Controles por ponteiro: cada dedo mantém seu próprio botão pressionado. */
const TouchControls = {
  active: false,
  pointers: new Map(),
  init() {
    this.root = document.getElementById('touch');
    this.buttons = [...this.root.querySelectorAll('[data-act]')];
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
    for (const button of this.buttons) {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        this.enable();
        button.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { button, directional: button.parentElement.classList.contains('pad') });
        this.sync();
      });
      button.addEventListener('pointermove', e => {
        const pointer = this.pointers.get(e.pointerId);
        if (!pointer || !pointer.directional) return;
        e.preventDefault();
        const target = document.elementFromPoint(e.clientX, e.clientY);
        pointer.button = this.buttons.includes(target) && target.parentElement.classList.contains('pad') ? target : null;
        this.sync();
      });
      const release = e => {
        if (!this.pointers.has(e.pointerId)) return;
        e.preventDefault();
        this.pointers.delete(e.pointerId);
        this.sync();
      };
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
    }
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
    for (const [id, pointer] of this.pointers) if (pointer.button && pointer.button.hidden) this.pointers.delete(id);
    for (const { button } of this.pointers.values()) {
      if (button && !button.hidden) for (const action of button.dataset.act.split(',')) next[action] = true;
    }
    for (const action in next) if (!Input.touch[action]) {
      Input.hits['touch-' + action] = true;
      Input.anyKey = true;
    }
    Input.touch = next;
    for (const button of this.buttons) {
      const pressed = !button.hidden && [...this.pointers.values()].some(pointer => pointer.button === button);
      button.classList.toggle('on', pressed);
      button.setAttribute('aria-pressed', String(pressed));
    }
  },
  reset() {
    this.pointers.clear();
    this.sync();
  },
};
