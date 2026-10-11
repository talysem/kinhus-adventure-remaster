'use strict';
/* Cada flashback só aparece na aquisição correspondente, com sua própria arte. */
const Origin = {
  files: {
    doubleJump: 'assets/cutscenes/runtime/09-origem-pulo-duplo.png',
    propulsion: 'assets/cutscenes/runtime/10-origem-pum.png',
    bellySlam: 'assets/cutscenes/runtime/11-origem-barrigada.png',
    steadyStep: 'assets/cutscenes/runtime/12-origem-passo-firme.png',
  },
  images: {}, statuses: {}, promise: null, id: null, beat: 0, t: 0, total: 0, done: false,
  preload() {
    if (this.promise) return this.promise;
    this.promise = Promise.all(Object.entries(this.files).map(([id, file]) => new Promise(resolve => {
      const im = new Image(); let settled = false; this.statuses[id] = 'loading';
      const end = ok => {
        if (settled) return; settled = true; clearTimeout(timer);
        this.images[id] = ok ? im : null; this.statuses[id] = ok ? 'ready' : 'fallback'; resolve();
      };
      const timer = setTimeout(() => end(false), 12000);
      im.onload = () => end(true); im.onerror = () => end(false); im.src = file;
    })));
    return this.promise;
  },
  begin(id) {
    this.id = id; this.preload(); this.beat = 0; this.t = 0; this.total = 0; this.done = false;
    Sound.play('home', true); Sound.fx('power');
  },
  finish(skipped) {
    if (this.done) return; this.done = true;
    App.acknowledgeUnlock(this.id, skipped); App.go('intro');
  },
  next() { if (this.beat === 1) this.finish(false); else { this.beat = 1; this.t = 0; Input.clear(); } },
  update() {
    if (this.done || document.hidden || App.trans) return;
    this.t++; this.total++;
    const skip = Input.pressed('back') || (Input.pressed('start') && !Input.pressed('confirm'));
    if (this.t > 20 && skip) { this.finish(true); return; }
    if (this.t > 20 && Input.pressed('confirm')) { this.next(); return; }
    if (this.id === 'propulsion' && this.beat === 0 && this.t === 60) Sound.fx('rumble');
    if (this.id === 'propulsion' && this.beat === 0 && this.t === 130) Sound.fx('propulsion');
    if (this.t >= (this.beat === 0 ? 420 : 360)) this.next();
  },
  draw() {
    const a = Progression.abilities.find(item => item.id === this.id);
    ctx.fillStyle = '#101b30'; ctx.fillRect(0, 0, W, H);
    const im = this.images[this.id];
    if (im) ctx.drawImage(im, 0, 0, 384, 256, 2, 21, 252, 168);
    else {
      const spr = SPR.kinhu.idle.r;
      ctx.drawImage(spr, 105, 61, spr.width * 3, spr.height * 3);
    }
    Font.draw(a.name, 128, 7, '#efbe85', { align: 'center' });
    ctx.fillStyle = '#101b30'; ctx.fillRect(0, 185, W, 39);
    const lines = this.beat === 0 ? a.story : [Progression.command(a.id), ...a.tips.slice(0, 2)];
    lines.forEach((line, i) => Font.draw(line, 128, 187 + i * 8, '#fff0d6', { align: 'center' }));
    Font.draw(Input.sceneHint(), 128, 214, '#a6b5c9', { align: 'center' });
  },
};
