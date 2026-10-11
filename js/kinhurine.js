'use strict';
/* Transformação: 60 quadros de carga, 48 de garras emergindo,
   132 de grito/pose final (4 segundos). Mundo e poder ficam congelados. */
const Kinhurine = {
  duration: 240, clawsAt: 60, roarAt: 108, t: 0, active: false, world: null,
  images: {}, promise: null,
  files: {
    charge: 'assets/cutscenes/runtime/kinhurine-charge.png',
    emerge: 'assets/cutscenes/runtime/kinhurine-emerge.png',
    roar: 'assets/cutscenes/runtime/kinhurine-roar.png',
  },
  preload() {
    if (this.promise) return this.promise;
    this.promise = Promise.all(Object.entries(this.files).map(([key, src]) => new Promise(resolve => {
      const im = new Image(); let done = false;
      const end = ok => {
        if (done) return;
        done = true; clearTimeout(timer);
        if (ok) this.images[key] = im;
        resolve();
      };
      const timer = setTimeout(() => end(false), 12000);
      im.onload = () => end(true); im.onerror = () => end(false); im.src = src;
    })));
    return this.promise;
  },
  begin() {
    if (this.active || App.state !== 'play' || App.trans || World.clear || World.player.dead) return false;
    this.active = true; this.t = 0; this.world = World;
    App.state = 'transform'; App.t = 0;
    Input.clear(); Sound.play('kinhurineTransform', true); Sound.fx('wildcharge');
    return true;
  },
  finish() {
    if (!this.active) return;
    this.active = false;
    if (App.state !== 'transform' || World !== this.world) return;
    // Retoma a mesma instância da fase: passar por enter('play') recarregaria tudo.
    App.state = 'play'; App.t = 0; Input.clear();
    Sound.play('kinhurine', true);
  },
  update() {
    if (!this.active || document.hidden) return;
    this.t++;
    if (this.t >= 20 && (Input.pressed('confirm') || Input.pressed('back') || Input.pressed('start'))) { this.finish(); return; }
    if (this.t === this.clawsAt) Sound.fx('clawmetal');
    if (this.t === this.roarAt) Sound.fx('wildroar');
    if (this.t >= this.duration) this.finish();
  },
  draw() {
    const t = this.t, key = t < this.clawsAt ? 'charge' : t < this.roarAt ? 'emerge' : 'roar';
    const im = this.images[key] || this.images.roar || this.images.charge;
    ctx.fillStyle = '#0c142a'; ctx.fillRect(0, 0, W, H);
    if (im) {
      // O plano abre no grito para não cortar nenhuma das seis pontas.
      const inset = t < this.roarAt ? 6 * IntroArt.ease(t / this.roarAt) : 0;
      const sw = 384 - inset * 2, sh = sw * 168 / 256;
      const shake = !Comfort.reducedShake && t >= this.roarAt && t < this.roarAt + 12 ? (Math.floor(t / 2) % 2 ? 1 : -1) : 0;
      ctx.drawImage(im, Math.round(inset), Math.round(2 + inset * 0.65), Math.round(sw), Math.round(sh), shake, 20, 256, 168);
    } else {
      // Falha de rede não prende o gameplay nem altera a duração do poder.
      const sprite = SPR.kinhuWild[Comfort.reducedFlash ? 0 : Math.floor(t / 6) % 3].win.r;
      ctx.drawImage(sprite, 80, 40, sprite.width * 5, sprite.height * 5);
    }
    // Um brilho curto na extensão do metal; sem estrobo repetido.
    if (!Comfort.reducedFlash && t >= this.roarAt && t < this.roarAt + 6) {
      ctx.fillStyle = 'rgba(211,237,255,' + ((this.roarAt + 6 - t) / 6 * 0.38).toFixed(2) + ')';
      ctx.fillRect(0, 20, 256, 168);
    }
    ctx.fillStyle = '#0c142a'; ctx.fillRect(0, 0, 256, 20); ctx.fillRect(0, 188, 256, 36);
    Font.draw('PODER DESPERTADO', 128, 7, '#b8d2e4', { align: 'center' });
    Font.draw(t < this.roarAt ? 'GRRRR...' : 'KINHURINE!', 128, 194, '#ffcd64', { align: 'center', scale: 2, outline: true });
    const touch = document.body.classList.contains('touch');
    Font.draw(touch ? 'TOQUE / A: PULAR' : Input.label('confirm') + ': PULAR', 128, 216, '#9aaac1', { align: 'center' });
    const fadeAt = this.duration - 12;
    if (t > fadeAt) { ctx.fillStyle = 'rgba(12,20,42,' + ((t - fadeAt) / 12).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  },
};
