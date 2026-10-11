'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const bundled = process.argv.includes('--bundle');
class Element {
  constructor(act = '') {
    this.dataset = { act }; this.style = { setProperty() {} }; this.events = {}; this.attrs = {}; this.hidden = false;
    const classes = new Set();
    this.classList = { add: c => classes.add(c), contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) };
  }
  addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
  emit(type, props = {}) { for (const fn of this.events[type] || []) fn({ type, currentTarget: this, button: 0, pointerType: 'touch', preventDefault() {}, ...props }); }
  setAttribute(key, value) { this.attrs[key] = value; }
  setPointerCapture() {}
  getContext() { return {}; }
  getBoundingClientRect() { return this.rect || { width: 360, height: 480 }; }
}
function boot({ coarse = false, points = 0, width = 390, height = 844 } = {}) {
  const window = new Element(), document = new Element(), pad = new Element(), ab = new Element(); pad.classList.add('pad');
  const buttons = ['up', 'left', 'right', 'down', 'start', 'run,back', 'jump,confirm', 'propel'].map(act => {
    const el = new Element(act); el.parentElement = ['up', 'left', 'right', 'down'].includes(act) ? pad : act === 'start' ? new Element() : ab; return el;
  });
  const elements = Object.fromEntries(['screen', 'touch', 'wrap', 'bar'].map(id => [id, new Element()]));
  elements.touch.querySelectorAll = () => buttons;
  document.body = new Element(); document.getElementById = id => elements[id];
  document.elementFromPoint = () => document.hit;
  Object.assign(window, { innerWidth: width, innerHeight: height,
    matchMedia: () => ({ matches: coarse, addEventListener() {} }),
    getComputedStyle: () => ({ paddingLeft: '12', paddingRight: '12', paddingTop: '12', paddingBottom: '0' }) });
  const sandbox = vm.createContext({ window, document, navigator: { maxTouchPoints: points }, innerWidth: width, innerHeight: height,
    localStorage: { getItem() { return null; }, setItem() {} }, console });
  let scripts = ['js/core.js', 'js/mobile.js'].map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  if (bundled) {
    const html = fs.readFileSync(path.join(root, 'dist/kinhus-adventure.html'), 'utf8');
    scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => /const (Input|TouchControls) =/.test(s));
    assert.equal(scripts.length, 2);
  }
  for (const script of scripts) vm.runInContext(script, sandbox);
  vm.runInContext('Input.init(); TouchControls.init()', sandbox);
  return { window, document, elements, buttons, input: vm.runInContext('Input', sandbox), controls: vm.runInContext('TouchControls', sandbox) };
}
assert(!boot({ width: 1440, height: 900 }).controls.active, 'desktop sem toque mantém teclado');
assert(!boot({ width: 320, height: 568 }).controls.active, 'largura sozinha não identifica celular');
assert(boot({ coarse: true }).controls.active, 'ponteiro coarse ativa controles');
assert(boot({ points: 5, width: 1024, height: 1366 }).controls.active, 'tablet com touch points é detectado');
const late = boot(); late.window.emit('pointerdown'); assert(late.controls.active, 'primeiro toque ativa fallback');
const { window, document, elements, buttons, input, controls } = boot({ points: 5 });
const [up, left, right, down, start, run, jump, propel] = buttons;
assert.equal(input.device, 'touch'); assert.equal(elements.touch.attrs['aria-hidden'], 'false');
right.emit('pointerdown', { pointerId: 1 }); run.emit('pointerdown', { pointerId: 2 }); jump.emit('pointerdown', { pointerId: 3 });
input.update(); assert(input.down('right') && input.down('run') && input.pressed('jump'));
input.update(); assert(!input.pressed('jump'), 'segurar não repete pulo');
jump.emit('pointerup', { pointerId: 3 }); input.update(); jump.emit('pointerdown', { pointerId: 3 }); input.update();
assert(input.pressed('jump'), 'soltar e tocar novamente permite pulo duplo');
jump.emit('pointerup', { pointerId: 3 }); jump.emit('pointerdown', { pointerId: 3 }); input.update();
assert(input.pressed('jump') && !input.prev.jump, 'retocar entre quadros continua sendo novo pulo');
document.hit = left; right.emit('pointermove', { pointerId: 1 }); input.update();
assert(input.down('left') && !input.down('right') && input.down('run'), 'deslizar troca apenas direção');
document.hit = null; right.emit('pointermove', { pointerId: 1 }); input.update(); assert(!input.down('left'));
document.hit = down; right.emit('pointermove', { pointerId: 1 }); input.update(); assert(input.down('down'));
right.emit('pointerup', { pointerId: 1 }); input.update(); assert(!input.down('down'));
input.releaseAll();
jump.emit('pointerdown', { pointerId: 4 }); jump.emit('pointerdown', { pointerId: 5 });
jump.emit('pointerup', { pointerId: 4 }); input.update(); assert(input.down('jump'), 'outro dedo ainda segura A');
jump.emit('lostpointercapture', { pointerId: 4 }); input.update(); assert(input.down('jump'));
jump.emit('pointercancel', { pointerId: 5 }); input.update(); assert(!input.down('jump'));
input.releaseAll(); start.emit('pointerdown', { pointerId: 6 }); start.emit('pointerup', { pointerId: 6 });
input.update(); assert(input.pressed('start'), 'toque curto entre quadros funciona'); input.update(); assert(!input.pressed('start'));
for (const event of ['blur', 'resize', 'orientationchange', 'visibilitychange']) {
  right.emit('pointerdown', { pointerId: 7 }); jump.emit('pointerdown', { pointerId: 8 });
  if (event === 'visibilitychange') { document.hidden = true; document.emit(event); } else window.emit(event);
  input.update(); assert(!input.down('right') && !input.pressed('jump'), event + ' limpa comandos');
  assert(buttons.every(button => button.attrs['aria-pressed'] === 'false'));
  assert.equal(controls.pointers.size, 0);
}
window.emit('keydown', { code: 'ArrowRight' }); assert(elements.touch.attrs['aria-hidden'] === 'false');
jump.emit('pointerdown', { pointerId: 9 }); assert.equal(input.device, 'touch');
input.setPreset('wasd'); input.update(); assert(!input.down('jump')); assert.equal(controls.pointers.size, 0);
propel.emit('pointerdown', { pointerId: 10 }); input.update(); assert(input.down('propel'));
propel.hidden = true; controls.sync(); input.update(); assert(!input.down('propel'));
propel.hidden = false; controls.sync(); input.update(); assert(!input.down('propel'), 'C oculto não reaperta ao voltar da pausa');
// A cruz inteira responde, incluindo diagonais e espaços entre as setas.
input.releaseAll(); controls.pad.rect = { left: 0, top: 0, right: 180, bottom: 180, width: 180, height: 180 };
controls.pad.emit('pointerdown', { pointerId: 11, clientX: 135, clientY: 135 }); input.update();
assert(input.down('right') && input.down('down'), 'diagonal responde ao toque na área antes vazia');
window.emit('pointermove', { pointerId: 11, clientX: 112, clientY: 90 }); input.update(); assert(input.down('right') && !input.down('down'));
window.emit('pointermove', { pointerId: 11, clientX: 90, clientY: 90 }); input.update(); assert(!input.down('right'), 'centro tem posição neutra');
window.emit('pointermove', { pointerId: 11, clientX: -30, clientY: 90 }); input.update(); assert(!input.down('left'), 'fora da área não mantém direção');
window.emit('pointerup', { pointerId: 11 }); assert.equal(controls.pointers.size, 0);
// Captura ausente/falha não impede o comando e a janela garante a soltura.
jump.setPointerCapture = () => { throw new Error('captura indisponível'); };
jump.emit('pointerdown', { pointerId: 12 }); input.update(); assert(input.pressed('jump'));
window.emit('pointerup', { pointerId: 12 }); input.update(); assert(!input.down('jump'));
// Rótulos/cantos dos círculos e até 12px de borda são tolerados, sem pegar C oculto.
jump.rect = { left: 280, top: 60, right: 360, bottom: 140, width: 80, height: 80 };
run.rect = { left: 190, top: 150, right: 270, bottom: 230, width: 80, height: 80 };
propel.rect = { left: 190, top: 0, right: 262, bottom: 72, width: 72, height: 72 };
controls.actions.emit('pointerdown', { pointerId: 13, clientX: 365, clientY: 100 }); input.update(); assert(input.pressed('jump'));
window.emit('pointercancel', { pointerId: 13 }); input.update(); assert(!input.down('jump'));
propel.hidden = true; controls.actions.emit('pointerdown', { pointerId: 14, clientX: 220, clientY: 30 }); input.update(); assert(!input.down('propel'));
input.releaseAll();
console.log(`OK${bundled ? ' (offline)' : ''}: detecção celular/tablet/desktop, multitoque, arraste, pulo duplo, toque curto, cancelamento e limpeza de comandos.`);
