'use strict';
/* Ilustrações da abertura. O gameplay continua em 256×224; a apresentação
   usa 768×672, com arte de 384×256 ampliada sem suavização. */
const IntroArt = {
  files: {
    home: 'assets/cutscenes/runtime/01-home-office.png',
    plea: 'assets/cutscenes/runtime/02-desespero.png',
    fall: 'assets/cutscenes/runtime/02-queda.png',
    day: 'assets/cutscenes/runtime/03-casa-dia.png',
    night: 'assets/cutscenes/runtime/03-casa-noite.png',
    bed: 'assets/cutscenes/runtime/04-dormindo.png',
    awake: 'assets/cutscenes/runtime/04-acordando.png',
    run: 'assets/cutscenes/runtime/05-corrida.png',
  },
  images: {}, status: 'idle', loaded: 0, failed: [], promise: null,
  preload() {
    if (this.promise) return this.promise;
    this.status = 'loading';
    this.promise = Promise.all(Object.entries(this.files).map(([key, src]) => new Promise(resolve => {
      const im = new Image(); let settled = false;
      const end = ok => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (ok) { this.images[key] = im; this.loaded++; } else this.failed.push(key);
        resolve();
      };
      // Uma imagem ausente nunca pode impedir o jogador de iniciar a fase.
      const timer = setTimeout(() => end(false), 12000);
      im.onload = () => end(true); im.onerror = () => end(false); im.src = src;
    }))).then(() => { this.status = this.failed.length ? 'fallback' : 'ready'; });
    return this.promise;
  },
  loading() {
    ctx.fillStyle = '#141d30'; ctx.fillRect(0, 16, W, 168);
    Font.draw('PREPARANDO A ABERTURA', 128, 83, '#efbe85', { align: 'center' });
    ctx.fillStyle = '#33415b'; ctx.fillRect(48, 105, 160, 3);
    ctx.fillStyle = '#efbe85'; ctx.fillRect(48, 105, 160 * this.loaded / 8, 3);
    Font.draw('ESC / START: PULAR', 128, 123, '#a6b5c9', { align: 'center' });
  },
  ease(t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
  // Camera em coordenadas dos arquivos de 384×256, sempre com proporção 256:168.
  camera(key, view = [0, 2, 384], alpha = 1, shake = 0) {
    const im = this.images[key];
    if (!im) return;
    const [x, y, w] = view, h = w * 168 / 256;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.drawImage(im, Math.round(x), Math.round(y), Math.round(w), Math.round(h), shake, 16, 256, 168);
    ctx.restore();
  },
  push(key, t, amount = 10, anchor = [0.5, 0.5]) {
    const d = amount * this.ease(t);
    this.camera(key, [d * anchor[0], 2 + d * 168 / 256 * anchor[1], 384 - d]);
  },
  // Email na tela: a fonte do jogo garante o texto exato, sem letras geradas.
  email(closeup) {
    if (!closeup) return;
    ctx.fillStyle = '#182737'; ctx.fillRect(20, 35, 216, 131);
    ctx.fillStyle = '#f5e9cd'; ctx.fillRect(23, 38, 210, 125);
    ctx.fillStyle = '#b65146'; ctx.fillRect(23, 38, 210, 17);
    Font.draw('EMPRESA / COMUNICADO', 31, 43, '#fff1d9');
    Font.draw('ACABOU O HOME OFFICE,', 128, 73, '#7d332f', { align: 'center', shadow: null });
    Font.draw('ESTEJA AMANHÃ', 128, 92, '#253249', { align: 'center', shadow: null });
    Font.draw('NA EMPRESA', 128, 109, '#253249', { align: 'center', shadow: null });
    ctx.fillStyle = '#cdbfa9'; ctx.fillRect(32, 134, 192, 1);
    Font.draw('DOMINGO, 16:59  /  LIDA', 33, 145, '#6b6570', { shadow: null });
  },
  clock(t, view) {
    // Display acompanha a mesma câmera da imagem, no retângulo preto original.
    const [sx, sy, sw] = view, k = 256 / sw;
    const x = (49 - sx) * k, y = 16 + (154 - sy) * k;
    ctx.save();
    ctx.setTransform(3 * k, 0, 0, 3 * k, Math.round(x * 3), Math.round(y * 3));
    Font.draw('07:42', 0, 0, t % 75 < 52 ? '#ff9474' : '#9d504b', { scale: 1, shadow: null });
    ctx.restore();
  },
  draw(scene, t) {
    if (this.status === 'loading' || this.status === 'idle') { this.loading(); return true; }
    if (this.status !== 'ready') return false;
    switch (scene) {
      case 0:
        this.push('home', t / 660, 12, [0.68, 0.5]);
        if (t >= 390) {
          const y = 27 + Math.round((1 - this.ease((t - 390) / 18)) * -40);
          ctx.fillStyle = '#1b2b41'; ctx.fillRect(9, y, 139, 29);
          ctx.fillStyle = '#efbe85'; ctx.fillRect(9, y, 2, 29);
          Font.draw('EMPRESA', 18, y + 5, '#efbe85');
          Font.draw('1 NOVA MENSAGEM', 18, y + 17, '#fff0d6');
        }
        break;
      case 1:
        if (t < 112) this.push('plea', t / 112, 7, [0.6, 0.5]);
        else if (t < 235) {
          const impact = t >= 177 && t < 197 ? (Math.floor(t / 3) % 2 ? 1 : -1) : 0;
          this.camera('fall', [0, 2, 384], 1, impact);
          if (t >= 177 && t < 205) Font.draw('TUM!', 223, 148, '#ffe0a6', { align: 'right', outline: true });
        } else {
          const k = this.ease((t - 235) / 70);
          this.camera('plea', [U.lerp(0, 81, k), U.lerp(2, 21, k), U.lerp(384, 130, k)]);
          if (t >= 305) this.email(true);
        }
        break;
      case 2: {
        this.camera('day');
        const darkness = t < 180 ? this.ease(t / 180) : t < 300 ? 1 : 1 - this.ease((t - 300) / 150);
        this.camera('night', undefined, darkness);
        Font.draw(t < 150 ? 'DOMINGO, 18:30' : t < 320 ? 'DOMINGO, 23:58' : 'SEGUNDA, 07:42', 12, 28, '#fff0cf', { outline: true });
        break;
      }
      case 3: {
        const view = [0, 2, 384];
        this.camera(t < 340 ? 'bed' : 'awake', view);
        this.clock(t, view);
        if (t >= 340) Font.draw('ATRASADO!', 232, 32, '#ffe1a0', { align: 'right', outline: true });
        break;
      }
      case 4:
        if (t < 40) this.camera('day');
        else this.push('run', (t - 40) / 260, 24, [0.86, 0.6]);
        Font.draw('07:42', 12, 28, '#fff0cf', { outline: true });
        // Corte acelerado para o controle do jogador, preservando a leitura da pose.
        if (t > 246) {
          ctx.fillStyle = '#141d30';
          ctx.fillRect(0, 16, Math.floor(this.ease((t - 246) / 54) * 256), 168);
        }
        break;
    }
    return true;
  },
};
