'use strict';
/* =========================================================
   Telas, menus, HUD, transições, salvamento e laço principal.
   ========================================================= */

const CREDITS = [
  'PARABÉNS, KINHU!', '',
  'O MEGA BUG FOI CORRIGIDO', 'E O SISTEMA VOLTOU AO AR.', '',
  'DEPOIS DE UM LONGO DIA', 'DE ÔNIBUS, CHEFES E BUGS,', 'KINHU VOLTA PARA CASA', 'COM O DEVER CUMPRIDO.', '', '',
  '- KINHU\'S ADVENTURE -', '', 'UMA AVENTURA URBANA', 'EM 5 FASES', '', '',
  '{SCORE}', '', '',
  'OBRIGADO POR JOGAR!', '', '', '', 'FIM',
];

const App = {
  state: 'title', t: 0, sub: null, menu: null, trans: null, toastMsg: null, toastT: 0, saveIcon: 0,

  init() {
    IntroArt.preload();
    Kinhurine.preload();
    Origin.preload();
    Input.init();
    Difficulty.load();
    Comfort.load();
    Save.load();
    Cosmetics.load();
    Game.hiscore = Save.data.hiscore;
    Game.unlocked = Save.data.unlocked;
    this.setupDom();
    fitScreen();
    this.go('title', null, true);
  },

  /* ---------- DOM: arquivo, toque, botões ---------- */
  setupDom() {
    if (typeof __NODE_TEST__ !== 'undefined') return;
    const file = document.getElementById('loadFile');
    file.addEventListener('change', () => { if (file.files[0]) this.readFile(file.files[0]); file.value = ''; });
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) this.readFile(f); });
    const unlock = () => Sound.unlock();
    ['keydown', 'pointerdown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.state === 'play') this.openPause(); if (Sound.ctx) Sound.ctx.suspend(); }
      else if (Sound.ctx) Sound.ctx.resume();
    });
    const btn = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', e => { e.preventDefault(); fn(); el.blur(); }); };
    btn('btnOptions', () => this.openOptions());
    btn('btnFull', () => this.toggleFull());
    // controles de toque
    TouchControls.init();
    // tocar na tela do título/história também avança
    const pointer = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') Input.device = 'touch';
      if (this.trans) return;
      if (this.menu && !['help', 'abilities', 'explore'].includes(this.sub)) { const p = pointer(e); this.menuPointer(p.x, p.y); return; }
      if (this.state !== 'play') Input.hits['touch-confirm'] = true;
    });
    cv.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') { const p = pointer(e); const hit = this.menuPointer(p.x, p.y, false); cv.style.cursor = hit ? 'pointer' : 'default'; }
    });
    // toques valem como "apertou" também
    for (const a of ['jump', 'run', 'propel', 'start', 'confirm', 'left', 'right', 'up', 'down', 'back']) if (!Input.map[a].includes('touch-' + a)) Input.map[a].push('touch-' + a);
  },
  openFile() { const f = document.getElementById('loadFile'); if (f) f.click(); },
  readFile(file) {
    const rd = new FileReader();
    rd.onload = () => {
      const r = Save.importText(String(rd.result));
      this.toast(r.msg);
      if (!r.ok) { Sound.fx('hurt'); return; }
      Sound.fx('check');
      Game.hiscore = Save.data.hiscore; Game.unlocked = Save.data.unlocked;
      if (Save.data.run && ['play', 'pause', 'gameover', 'transform', 'story', 'origin'].includes(this.state)) this.continueRun();
      else if (this.state === 'title' || this.state === 'select') { this.openTitleMenu(); }
      else this.go('title');
    };
    rd.readAsText(file);
  },
  exportSave() {
    if (this.state === 'play' || this.state === 'pause' || this.state === 'transform') this.saveProgress(false, true);
    const ok = Save.exportFile();
    this.toast(ok ? 'ARQUIVO DE SAVE BAIXADO!' : 'NÃO FOI POSSÍVEL SALVAR');
  },
  toggleFull() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } catch (e) { /* sem tela cheia */ }
  },
  toggleMute() {
    Sound.setMuted(!Sound.muted);
    this.toast(Sound.muted ? 'SOM DESLIGADO' : 'SOM LIGADO');
    try { localStorage.setItem('kinhus-adventure:mute', Sound.muted ? '1' : '0'); } catch (e) { /* ok */ }
  },
  toast(msg) { this.toastMsg = msg; this.toastT = 150; },

  /* ---------- progresso ---------- */
  saveProgress(cleared, quiet) {
    if (cleared && Game.clearedLevel !== Game.levelIdx) Exploration.complete();
    if (cleared) Game.clearedLevel = Game.levelIdx;
    // Exportar durante a comemoração também conserva a conclusão já salva.
    cleared = cleared || Game.clearedLevel === Game.levelIdx;
    let level = Game.levelIdx, checkpoint = Game.checkpoint;
    if (cleared) { level++; checkpoint = false; }
    Game.hiscore = Math.max(Game.hiscore, Game.score, Save.data.hiscore);
    const d = Save.data;
    d.hiscore = Game.hiscore;
    // Replay pode atualizar recorde, mas preserva campanha, checkpoint e habilidades.
    if (Game.mode === 'replay') return Save.persist();
    if (cleared) Game.progress = Progression.complete(Game.progress, Game.levelIdx);
    d.campaign = Progression.sanitize(Game.progress);
    if (level >= LEVELS.length) { d.completed = true; d.run = null; }
    else {
      d.run = { level, lives: Game.lives, score: Game.score, coins: Game.coins, hearts: cleared ? Game.maxHearts : Math.max(1, Game.hearts), power: Game.power, checkpoint, difficulty: Game.difficulty, collected: !cleared && Game.collectedLevel === level ? Game.collected.slice() : [], assist: Game.assist, stats: !cleared && Game.statsLevel === level ? Exploration.sanitizeStats(Game.stats, level, true) : Exploration.blankStats(), savedAt: Date.now() };
      d.unlocked = Math.max(d.unlocked, level + 1);
    }
    Game.unlocked = d.unlocked;
    const persisted = Save.persist();
    if (!quiet && persisted) this.saveIcon = 90;
    return persisted;
  },
  continueRun() {
    Bonus.abort();
    const r = Save.data.run;
    if (!r) return;
    Game.mode = 'campaign'; Game.completed = false; Game.clearedLevel = null;
    Game.progress = Progression.sanitize(Save.data.campaign, r.level);
    Game.levelIdx = r.level; Game.lives = r.lives; Game.score = r.score; Game.coins = r.coins;
    Game.difficulty = Difficulty.valid(r.difficulty) ? r.difficulty : 'normal';
    Game.collected = PickupLedger.sanitize(r.collected, r.level); Game.collectedLevel = r.level;
    Game.assist = r.assist === true; Game.stats = Exploration.sanitizeStats(r.stats, r.level, true); Game.statsLevel = r.level;
    Game.hearts = r.hearts; Game.power = r.power; Game.checkpoint = r.checkpoint;
    this.go('intro');
  },
  afterStory() {
    this.go('play');
  },
  newGame() {
    Bonus.finish('leave');
    Game.reset();
    if (Game.cheatLives) Game.lives = 9;
    Save.data.plays++;
    // O novo estado fica salvo antes da abertura, inclusive se ela for interrompida.
    this.saveProgress(false, true);
    this.go('story');
  },
  startLevel(idx) {
    Bonus.finish('leave');
    Game.mode = 'replay';
    Game.difficulty = Difficulty.selected; Game.collected = []; Game.collectedLevel = idx;
    Game.assist = Comfort.assist; Game.stats = Exploration.blankStats(); Game.statsLevel = idx;
    Game.clearedLevel = null;
    Game.progress = Progression.sanitize(Save.data.campaign);
    Game.levelIdx = idx; Game.checkpoint = false;
    Game.lives = Math.max(Game.lives, Game.cheatLives ? 9 : Difficulty.current().lives);
    this.go('intro');
  },

  /* ---------- transições ---------- */
  go(state, fn, instant) {
    Bonus.finish('leave');
    if (this.state === 'transform' && state !== 'transform') Kinhurine.active = false;
    const apply = () => { this.state = state; this.t = 0; this.menu = null; this.sub = null; if (fn) fn(); this.enter(state); this.syncAbilityControls(); };
    if (instant) { apply(); return; }
    this.trans = { t: 0, dur: 18, apply, done: false };
  },
  enter(state) {
    Input.clear();
    switch (state) {
      case 'title': Sound.play('title'); break;
      case 'story': Cutscenes.begin(); break;
      case 'intro': {
        Sound.stop();
        const pending = Game.mode === 'campaign' && Progression.nextUnlock(Game.progress);
        if (pending) { this.state = 'origin'; Origin.begin(pending.id); }
        break;
      }
      case 'play':
        loadLevel(Game.levelIdx, Game.checkpoint);
        Game.hearts = Math.max(1, Game.hearts);
        Sound.tempo = 1;
        Sound.play(World.th.music, true);
        this.saveProgress(false, true);
        break;
      case 'gameover':
        Sound.play('gameover', true);
        Game.hiscore = Math.max(Game.hiscore, Game.score);
        Save.data.hiscore = Game.hiscore; Save.persist();
        this.menu = this.makeMenu([
          { label: 'TENTAR DE NOVO (FASE ' + (Game.levelIdx + 1) + ')', fn: () => { Game.lives = Difficulty.current().lives; Game.score = 0; Game.coins = 0; Game.hearts = 3; Game.power = 0; Game.checkpoint = false; Game.stats = Exploration.blankStats(); this.go('intro'); } },
          { label: 'MENU INICIAL', fn: () => this.go('title') },
        ]);
        break;
      case 'ending': Sound.play('ending', true); break;
    }
  },

  /* ---------- menus ---------- */
  makeMenu(items, opt = {}) { return { items, i: opt.i || 0, title: opt.title, back: opt.back, panel: opt.panel }; },
  menuReturn() {
    const previous = { menu: this.menu, sub: this.sub };
    return () => { this.menu = previous.menu; this.sub = previous.sub; Input.clear(); };
  },
  openTitleMenu() {
    this.sub = null;
    const d = Save.data, items = [];
    if (d.run) items.push({ label: 'CONTINUAR', desc: () => ['FASE ' + (d.run.level + 1) + (d.run.checkpoint ? ' · DO PONTO' : ' · DO INÍCIO'), 'RETOME SUA CAMPANHA SALVA.'], fn: () => this.continueRun() });
    items.push({ label: 'NOVO JOGO', desc: ['COMECE UMA NOVA AVENTURA.', 'A COLEÇÃO PERMANENTE CONTINUA.'], fn: () => this.newGame() });
    if (d.unlocked > 1 || d.completed) items.push({ label: 'ESCOLHER FASE', desc: ['REPLAY, LEMBRANÇAS E DESAFIOS.', 'PRESERVA A CAMPANHA SALVA.'], fn: () => this.openSelect() });
    items.push({ label: 'CONFIGURAÇÕES', desc: ['CONTROLES, JOGABILIDADE,', 'ÁUDIO E ACESSIBILIDADE.'], fn: () => this.openSettings() });
    items.push({ label: 'ARQUIVOS DE SAVE', desc: ['GUARDE OU IMPORTE SEU PROGRESSO.', 'A CAMPANHA SALVA NO NAVEGADOR.'], fn: () => this.openSaves() });
    items.push({ label: 'GUIA DO JOGO', desc: ['COMANDOS, PODERES E ITENS.', 'CONSULTE TAMBÉM OS DESAFIOS.'], fn: () => this.openGuide() });
    this.menu = this.makeMenu(items, { title: 'MENU PRINCIPAL', panel: 'navigation', back: () => { this.menu = null; } });
  },
  openSettings() {
    const back = this.menuReturn(); this.sub = 'settings';
    this.menu = this.makeMenu([
      { label: 'CONTROLES', desc: ['ESCOLHA SEU CONJUNTO DE TECLADO.', 'VEJA OS COMANDOS ANTES DE TROCAR.'], fn: () => this.openControls() },
      { label: 'JOGABILIDADE', desc: ['DIFICULDADE E ASSISTÊNCIA.', 'AJUSTES PARA O RITMO DA PARTIDA.'], fn: () => this.openGameplay() },
      { label: 'ÁUDIO', desc: ['MÚSICA, EFEITOS E SOM GERAL.', 'VOLUMES AJUSTADOS SEPARADAMENTE.'], fn: () => this.openAudio() },
      { label: 'ACESSIBILIDADE', desc: ['REDUÇÃO DE TREMOR E FLASHES.', 'MAIS CONFORTO VISUAL.'], fn: () => this.openAccessibility() },
      { label: 'VISUAL DO KINHU', desc: ['CAMISETAS E CRACHÁ DESBLOQUEÁVEIS.', 'RECOMPENSAS DA COLEÇÃO E DESAFIOS.'], fn: () => this.openCosmetics() },
      { label: 'VOLTAR', desc: ['RETORNE AO MENU ANTERIOR.'], fn: back },
    ], { title: 'CONFIGURAÇÕES', panel: 'navigation', back }); Input.clear();
  },
  openGameplay() {
    const back = this.menuReturn(), paused = this.state === 'pause'; this.sub = 'gameplay';
    this.menu = this.makeMenu([
      { label: () => 'DIFICULDADE: ' + Difficulty.modes[paused ? Game.difficulty : Difficulty.selected].name, desc: paused ? ['TROCAR REINICIA DO PONTO.', 'TEMPO/MORTES: REJOGUE DO INÍCIO.'] : ['QUATRO MODOS PARA NOVO JOGO/REPLAY.', 'CONTINUAR USA A DIFICULDADE SALVA.'], fn: () => this.openDifficulty() },
      { label: () => 'ASSISTÊNCIA: ' + ((paused ? Game.assist : Comfort.assist) ? 'SIM' : 'NÃO'), desc: paused ? ['+50% TEMPO; VIDA PRESERVADA NO PONTO.', 'TROCAR REINICIA; DESAFIOS À PARTE.'] : ['+50% TEMPO; VIDA PRESERVADA NO PONTO.', 'VALE PARA NOVO JOGO E REPLAY.'], fn: () => {
        const next = !(paused ? Game.assist : Comfort.assist); Comfort.set('assist', next);
        if (paused) { Game.assist = next; Game.stats.eligible = false; Game.hearts = Game.maxHearts; this.saveProgress(false, true); this.go('play'); }
      } },
      { label: 'VOLTAR', desc: ['RETORNE ÀS CONFIGURAÇÕES.'], fn: back },
    ], { title: 'JOGABILIDADE', panel: 'navigation', back }); Input.clear();
  },
  openCosmetics() {
    const back = this.menuReturn(), ids = Object.keys(Cosmetics.styles); this.sub = 'cosmetics';
    this.menu = this.makeMenu(ids.map(id => ({
      label: () => (Cosmetics.current() === id ? '★ ' : '  ') + Cosmetics.styles[id].name + (Cosmetics.unlocked(id) ? '' : ' (TRANCADO)'),
      desc: () => Cosmetics.styles[id].tips(Cosmetics.profile()), style: id,
      fn: () => { if (Cosmetics.select(id)) Sound.fx('check'); else this.toast('COMPLETE A META PARA LIBERAR'); },
    })).concat([{ label: 'VOLTAR', desc: () => ['RETORNE ÀS CONFIGURAÇÕES.'], fn: back }]), { title: 'VISUAL DO KINHU', back }); Input.clear();
  },
  drawCosmetics() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(8, 22, 240, 194);
    this.drawMenu(this.menu, 128, 30);
    const item = this.menu.items[this.menu.i], id = item.style || Cosmetics.current();
    ctx.drawImage(Cosmetics.sprite(id).idle.r, 117, 139); Cosmetics.badge(121, 142, id);
    item.desc().forEach((line, i) => Font.draw(line, 128, 174 + i * 11, '#a2c4ff', { align: 'center' }));
    Font.draw(Input.device === 'keyboard' ? 'ENTER: VESTIR  ESC: VOLTAR' : 'A: VESTIR  B: VOLTAR', 128, 204, '#ffe384', { align: 'center' });
  },
  openAudio() {
    const back = this.menuReturn(); this.sub = 'audio';
    const volume = key => ({ label: () => (key === 'music' ? 'MÚSICA: ' : 'EFEITOS: ') + Comfort[key] + '%', desc: ['◄ ► AJUSTA; CONFIRMAR ALTERNA.', 'VOLUME SALVO NESTE NAVEGADOR.'], meter: key, fn: () => Comfort.set(key, Comfort[key] >= 100 ? 0 : Comfort[key] + 25), adjust: dir => Comfort.set(key, Comfort[key] + dir * 25) });
    this.menu = this.makeMenu([
      volume('music'), volume('effects'),
      { label: () => 'SOM GERAL: ' + (Sound.muted ? 'DESLIGADO' : 'LIGADO'), desc: ['LIGA OU SILENCIA TODO O ÁUDIO.', 'M TAMBÉM ALTERNA DURANTE O JOGO.'], fn: () => this.toggleMute() },
      { label: 'VOLTAR', desc: ['RETORNE ÀS CONFIGURAÇÕES.'], fn: back },
    ], { title: 'ÁUDIO', panel: 'navigation', back }); Input.clear();
  },
  openAccessibility() {
    const back = this.menuReturn(); this.sub = 'accessibility';
    this.menu = this.makeMenu([
      { label: () => 'REDUZIR TREMOR: ' + (Comfort.reducedShake ? 'SIM' : 'NÃO'), desc: ['SUAVIZA O JOGO E AS CENAS.', 'PRESERVA OS AVISOS DE PERIGO.'], fn: () => Comfort.set('reducedShake', !Comfort.reducedShake) },
      { label: () => 'REDUZIR FLASHES: ' + (Comfort.reducedFlash ? 'SIM' : 'NÃO'), desc: ['REDUZ PISCADAS E TROCAS DE COR.', 'A PROTEÇÃO APÓS DANO CONTINUA.'], fn: () => Comfort.set('reducedFlash', !Comfort.reducedFlash) },
      { label: 'VOLTAR', desc: ['RETORNE ÀS CONFIGURAÇÕES.'], fn: back },
    ], { title: 'ACESSIBILIDADE', panel: 'navigation', back }); Input.clear();
  },
  openSaves() {
    const back = this.menuReturn(); this.sub = 'saves';
    this.menu = this.makeMenu([
      { label: 'BAIXAR ARQUIVO DE SAVE', desc: ['GUARDE CAMPANHA, COLEÇÃO E RECORDES.', 'PARA USAR EM OUTRO NAVEGADOR.'], fn: () => this.exportSave() },
      { label: 'CARREGAR ARQUIVO DE SAVE', desc: ['ESCOLHA UM ARQUIVO DO KINHU.', 'IMPORTAR TROCA A CAMPANHA ATUAL.'], fn: () => this.openFile() },
      { label: 'VOLTAR', desc: ['RETORNE AO MENU ANTERIOR.'], fn: back },
    ], { title: 'ARQUIVOS DE SAVE', panel: 'navigation', back }); Input.clear();
  },
  openGuide() {
    const back = this.menuReturn(); this.sub = 'guide';
    this.menu = this.makeMenu([
      { label: 'COMANDOS', desc: ['MOVIMENTO E BOTÕES DA PARTIDA.'], fn: () => this.openInfo('help', 0) },
      { label: 'HABILIDADES / COMO USAR', desc: ['PODERES CONQUISTADOS E DEMONSTRAÇÕES.'], fn: () => this.openInfo('abilities') },
      { label: 'ITENS / COMO USAR', desc: ['EFEITOS, DURAÇÃO E COMBINAÇÕES.'], fn: () => this.openInfo('help', 1) },
      { label: 'EXPLORAÇÃO / DESAFIOS', desc: ['LEMBRANÇAS E METAS OPCIONAIS.'], fn: () => this.state === 'pause' ? this.openInfo('explore') : this.openSelect() },
      { label: 'VOLTAR', desc: ['RETORNE AO MENU ANTERIOR.'], fn: back },
    ], { title: 'GUIA DO JOGO', panel: 'navigation', back }); Input.clear();
  },
  openInfo(view, page = 0) {
    this.infoBack = this.menuReturn(); this.infoParent = this.menu;
    this.sub = view; this.helpPage = page; this.abilityPage = 0; Input.clear();
  },
  updateInfo() {
    if (this.sub === 'help') this.updateHelp();
    if (this.sub === 'abilities') {
      const progress = this.state === 'title' ? Save.data.campaign : Game.progress, count = progress.abilities.length;
      if (count && (Input.pressed('right') || Input.pressed('down'))) this.abilityPage = ((this.abilityPage || 0) + 1) % count;
      if (count && (Input.pressed('left') || Input.pressed('up'))) this.abilityPage = ((this.abilityPage || 0) + count - 1) % count;
    }
    if (Input.pressed('confirm') || Input.pressed('back') || Input.pressed('start')) {
      if (this.infoBack && this.menu === this.infoParent) this.infoBack(); else this.sub = null;
      this.infoBack = null; Input.clear();
    }
  },
  openSelect() {
    const back = this.menuReturn(); this.sub = 'select';
    const max = Save.data.completed ? LEVELS.length : Save.data.unlocked;
    const items = LEVELS.slice(0, max).map((L, i) => ({ label: () => (i + 1) + '. ' + L.name + ' ' + Exploration.count(i) + '/3', fn: () => { Game.reset(); this.startLevel(i); } }));
    this.menu = this.makeMenu(items, { title: 'ESCOLHER FASE', back }); Input.clear();
  },
  openControls() {
    const back = this.menuReturn(); this.sub = 'controls';
    const ids = Object.keys(Input.presets);
    this.menu = this.makeMenu(ids.map(id => ({ label: () => (Input.preset === id ? '★ ' : '  ') + Input.presets[id].name, fn: () => { if (id !== Input.preset) { Input.setPreset(id); Sound.fx('check'); } } })).concat([{ label: 'VOLTAR', fn: back }]), { title: 'CONTROLES DO TECLADO', i: ids.indexOf(Input.preset), back }); Input.clear();
  },
  openDifficulty() {
    const back = this.menuReturn(), paused = this.state === 'pause'; this.sub = 'difficulty';
    const ids = Object.keys(Difficulty.modes), selected = paused ? Game.difficulty : Difficulty.selected;
    this.menu = this.makeMenu(ids.map(id => ({
      label: () => ((paused ? Game.difficulty : Difficulty.selected) === id ? '★ ' : '  ') + Difficulty.modes[id].name,
      fn: () => {
        Difficulty.select(id); Sound.fx('check');
        if (paused && Game.difficulty !== id) { Game.difficulty = id; Game.lives = Difficulty.current().lives; Game.hearts = Game.maxHearts; Game.stats.eligible = false; this.saveProgress(false, true); this.go('play'); }
      },
    })).concat([{ label: 'VOLTAR', fn: back }]), { title: 'DIFICULDADE', i: ids.indexOf(selected), back }); Input.clear();
  },
  openOptions() {
    if (this.trans || !['title', 'play', 'pause'].includes(this.state) || this.state === 'play' && (World.clear || World.player.dead)) return;
    if (this.state === 'play') this.openPause();
    if (!this.menu) this.openTitleMenu();
    if (this.sub !== 'settings') this.openSettings();
  },
  openPause() {
    this.state = 'pause'; this.sub = null; Sound.fx('pause'); this.syncAbilityControls();
    if (Sound.ctx && Sound.song) Sound.song.out.gain.setTargetAtTime(0.25, Sound.ctx.currentTime, 0.05);
    this.menu = this.makeMenu([
      { label: 'CONTINUAR', desc: ['VOLTE PARA A AVENTURA.'], fn: () => this.closePause() },
      { label: 'CONFIGURAÇÕES', desc: ['CONTROLES, JOGABILIDADE,', 'ÁUDIO E ACESSIBILIDADE.'], fn: () => this.openSettings() },
      { label: 'GUIA DO JOGO', desc: ['COMANDOS, PODERES E ITENS.', 'COLEÇÃO E DESAFIOS DA PARTIDA.'], fn: () => this.openGuide() },
      { label: 'ARQUIVOS DE SAVE', desc: ['BAIXE OU IMPORTE SEU PROGRESSO.'], fn: () => this.openSaves() },
      Bonus.active ? { label: Bonus.active.fight ? 'SAIR DO DESAFIO' : 'SAIR DA SALA BÔNUS', desc: ['RETORNE À PORTA DA FASE.', 'RECOMPENSAS RECOLHIDAS CONTINUAM.'], fn: () => { Bonus.finish('leave'); this.closePause(); } } : { label: 'REINICIAR FASE', desc: ['RECOMEÇA DA FASE OU DO PONTO.', 'ITENS TEMPORÁRIOS SÃO PERDIDOS.'], fn: () => { Game.hearts = Game.maxHearts; this.go('play'); } },
      { label: 'SAIR PARA O MENU', desc: ['SALVA A CAMPANHA ANTES DE SAIR.'], fn: () => { this.saveProgress(false, true); this.go('title'); } },
    ], { title: 'PAUSA', panel: 'navigation', back: () => this.closePause() });
  },
  // C aparece apenas quando a arrancada está disponível.
  syncAbilityControls() {
    const button = document.querySelector ? document.querySelector('[data-act="propel"]') : null;
    if (button) {
      button.hidden = !Progression.usable(Game.progress, 'propulsion') || this.state !== 'play';
      if (TouchControls.active) TouchControls.sync();
    }
    if (TouchControls.buttons) TouchControls.sync();
  },
  acknowledgeUnlock(id, skipped = false) {
    if (!Progression.acknowledge(Game.progress, id, skipped)) return false;
    this.saveProgress(false, true);
    return true;
  },
  closePause() {
    this.state = 'play'; this.menu = null; this.sub = null; this.infoBack = null; Input.clear();
    this.syncAbilityControls();
    if (Sound.ctx && Sound.song) Sound.song.out.gain.setTargetAtTime(1, Sound.ctx.currentTime, 0.05);
  },
  updateMenu() {
    const m = this.menu;
    if (!m) return;
    if (Input.pressed('up')) { m.i = (m.i + m.items.length - 1) % m.items.length; Sound.fx('cursor'); }
    if (Input.pressed('down')) { m.i = (m.i + 1) % m.items.length; Sound.fx('cursor'); }
    if (m.items[m.i].adjust && (Input.pressed('left') || Input.pressed('right'))) m.items[m.i].adjust(Input.pressed('right') ? 1 : -1);
    if (Input.pressed('confirm')) { Sound.fx('select'); m.items[m.i].fn(); return; }
    if (Input.pressed('back') && m.back) { Sound.fx('cursor'); m.back(); }
  },
  menuPointer(x, y, activate = true) {
    if (this.trans || !this.menu || this.drawnMenu !== this.menu) return false;
    const hit = (this.menuRegions || []).find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    if (!hit) return false;
    this.menu.i = hit.i;
    if (activate) { Sound.unlock(); Sound.fx('select'); this.menu.items[hit.i].fn(); Input.clear(); }
    return true;
  },
  drawNavigation() {
    const m = this.menu, x = 8, w = 240;
    ctx.fillStyle = '#00153b'; ctx.fillRect(x, 22, w, 194);
    ctx.fillStyle = '#ffbf30'; ctx.fillRect(x, 22, w, 2); ctx.fillRect(x, 215, w, 1);
    const heading = ['gameplay', 'audio', 'accessibility'].includes(this.sub) ? 'CONFIGURAÇÕES / ' + m.title : m.title;
    Font.draw(heading, 128, 33, '#ffbf30', { align: 'center' });
    ctx.fillStyle = '#2a3a6a'; ctx.fillRect(20, 47, 216, 1);
    this.drawnMenu = m; this.menuRegions = [];
    m.items.forEach((item, i) => {
      const y = 55 + i * 17, selected = i === m.i;
      this.menuRegions.push({ x: 17, y, w: 222, h: 16, i });
      if (selected) { ctx.fillStyle = '#173357'; ctx.fillRect(17, y, 222, 16); ctx.fillStyle = '#ffbf30'; ctx.fillRect(17, y, 2, 16); Font.draw('►', 23, y + 5, '#ffbf30'); }
      Font.draw(typeof item.label === 'function' ? item.label() : item.label, 35, y + 5, selected ? '#ffe384' : '#e9effb');
    });
    const item = m.items[m.i], description = typeof item.desc === 'function' ? item.desc() : item.desc || [];
    if (item.meter) { ctx.fillStyle = '#2a3a6a'; ctx.fillRect(35, 147, 186, 5); ctx.fillStyle = '#ffbf30'; ctx.fillRect(35, 147, Math.round(186 * Comfort[item.meter] / 100), 5); }
    ctx.fillStyle = '#071e40'; ctx.fillRect(17, 166, 222, 29);
    description.forEach((line, i) => Font.draw(line, 128, 173 + i * 11, '#a2c4ff', { align: 'center' }));
    Font.draw(Input.device === 'keyboard' ? '▲ ▼  ENTER: ABRIR  ESC: VOLTAR' : '▲ ▼  A: ABRIR  B: VOLTAR', 128, 204, '#e9effb', { align: 'center' });
  },
  drawMenu(m, cx, y, opt = {}) {
    const lines = m.items.map(it => (typeof it.label === 'function' ? it.label() : it.label));
    const w = Math.max(...lines.map(l => Font.width(l)), m.title ? Font.width(m.title) : 0) + 28;
    const h = lines.length * 12 + (m.title ? 18 : 6) + 6;
    const x = Math.round(cx - w / 2);
    ctx.fillStyle = opt.bg || '#00153b'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffbf30'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = '#ff8130'; ctx.fillRect(x + 1, y + 1, w - 2, 1);
    let yy = y + 6;
    if (m.title) { Font.draw(m.title, cx, yy, '#ffbf30', { align: 'center' }); yy += 16; }
    if (m === this.menu) { this.drawnMenu = m; this.menuRegions = []; }
    lines.forEach((l, i) => {
      const sel = i === m.i;
      if (m === this.menu) this.menuRegions.push({ x: x + 3, y: yy - 3, w: w - 6, h: 12, i });
      if (sel) { ctx.fillStyle = '#173357'; ctx.fillRect(x + 3, yy - 3, w - 6, 12); }
      if (sel) Font.draw('►', x + 7 + (Math.floor(this.t / 8) % 2), yy, '#ffbf30');
      Font.draw(l, x + 16, yy, sel ? '#ffe384' : '#e9effb');
      yy += 12;
    });
  },

  /* ---------- atualização ---------- */
  update() {
    Input.update();
    if (document.hidden) return;
    this.t++;
    if (this.toastT > 0) this.toastT--;
    if (this.saveIcon > 0) this.saveIcon--;
    if (Input.pressed('mute')) this.toggleMute();
    if (Input.pressed('full')) this.toggleFull();
    if (this.trans) {
      const tr = this.trans;
      tr.t++;
      if (tr.t === tr.dur && !tr.done) { tr.done = true; tr.apply(); }
      if (tr.t >= tr.dur * 2) this.trans = null;
      if (tr.t < tr.dur) return;
    }
    switch (this.state) {
      case 'title':
        this.checkCheat();
        if (['help', 'abilities', 'explore'].includes(this.sub)) { this.updateInfo(); break; }
        if (this.menu) this.updateMenu();
        else if (Input.pressed('start') || Input.pressed('confirm') || Input.pressed('jump')) { Sound.unlock(); Sound.fx('select'); this.openTitleMenu(); }
        break;
      case 'story':
        Cutscenes.update();
        break;
      case 'origin': Origin.update(); break;
      case 'transform':
        if (!this.trans) Kinhurine.update();
        break;
      case 'intro':
        if (!this.trans && (this.t > 170 || (this.t > 30 && (Input.pressed('start') || Input.pressed('confirm'))))) this.go('play');
        break;
      case 'play':
        if (Input.pressed('start') && !World.clear && !World.player.dead) { this.openPause(); break; }
        updateWorld();
        break;
      case 'pause':
        if (['help', 'abilities', 'explore'].includes(this.sub)) this.updateInfo(); else this.updateMenu();
        break;
      case 'gameover': if (this.t > 60) this.updateMenu(); break;
      case 'ending':
        if (this.t > 600 && (Input.pressed('start') || Input.pressed('confirm'))) this.go('title');
        break;
    }
  },
  // código secreto na tela de título: ▲▲▼▼◄►◄► X Z
  checkCheat() {
    const seq = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'run', 'jump'];
    for (const a of ['up', 'down', 'left', 'right', 'run', 'jump']) {
      if (!Input.pressed(a)) continue;
      if (a === 'jump' && Input.pressed('up')) continue;
      this.cheat = seq[this.cheat | 0] === a ? (this.cheat | 0) + 1 : a === 'up' ? 1 : 0;
      if (this.cheat === seq.length) {
        this.cheat = 0;
        Save.data.unlocked = LEVELS.length; Save.persist(); Game.unlocked = LEVELS.length;
        Game.cheatLives = true;
        Sound.fx('kinhurine'); this.toast('MODO KINHURINE: TODAS AS FASES + 9 VIDAS!');
        this.openTitleMenu();
      }
      break;
    }
  },
  onDeath() {
    if (this.trans) return;
    if (!(Game.assist && Game.checkpoint)) Game.lives--;
    Game.hearts = Game.maxHearts; Game.power = 0;
    if (Game.lives <= 0) { Game.lives = 0; if (Game.mode !== 'replay') { Save.data.run = null; Save.persist(); } this.go('gameover'); }
    else { this.saveProgress(false, true); this.go('intro'); }
  },
  levelDone() {
    if (this.trans) return;
    Game.levelIdx++;
    Game.checkpoint = false;
    Game.hearts = Game.maxHearts;
    if (Game.levelIdx >= LEVELS.length) { this.go('ending'); return; }
    this.go('intro');
  },
  bossClear() {
    World.clear = { phase: 'tally', t: 0, kind: 'trophy' };
    cancelMoves(World.player); ItemEffects.clear(World.player);
    World.player.control = false; World.player.win = true;
    Sound.stop(); Sound.play('clear');
    Game.completed = true;
    this.saveProgress(true);
  },

  /* ---------- desenho ---------- */
  render() {
    this.menuRegions = []; this.drawnMenu = null;
    const options = document.getElementById('btnOptions');
    if (options) options.disabled = !!this.trans || !['title', 'play', 'pause'].includes(this.state) || this.state === 'play' && (World.clear || World.player.dead);
    const scale = ['story', 'origin', 'transform'].includes(this.state) ? 3 : 1;
    if (cv.width !== W * scale) {
      cv.width = W * scale; cv.height = H * scale;
      ctx.imageSmoothingEnabled = false;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    switch (this.state) {
      case 'title': this.drawTitle(); break;
      case 'story': this.drawStory(); break;
      case 'origin': Origin.draw(); break;
      case 'transform': Kinhurine.draw(); break;
      case 'intro': this.drawIntro(); break;
      case 'play': case 'pause': drawWorld(); this.drawHUD(); if (this.state === 'pause') { ctx.fillStyle = 'rgba(0,10,30,0.55)'; ctx.fillRect(0, 0, W, H); if (this.sub === 'abilities') this.drawAbilities(); else if (this.sub === 'controls') this.drawControls(); else if (this.sub === 'difficulty') this.drawDifficulty(); else if (this.sub === 'cosmetics') this.drawCosmetics(); else if (this.sub === 'explore') this.drawExplore(); else if (this.sub === 'help') this.drawHelp(); else if (this.menu.panel) this.drawNavigation(); else this.drawMenu(this.menu, W / 2, 36); } break;
      case 'gameover': this.drawGameOver(); break;
      case 'ending': this.drawEnding(); break;
    }
    if (this.toastT > 0 && this.toastMsg) {
      const w = Font.width(this.toastMsg) + 12;
      const y = this.state === 'pause' || this.state === 'title' && (this.menu || this.sub) ? 2 : H - 22;
      ctx.fillStyle = 'rgba(0,21,59,0.9)'; ctx.fillRect(W / 2 - w / 2, y, w, 14);
      Font.draw(this.toastMsg, W / 2, y + 4, '#ffe384', { align: 'center' });
    }
    if (this.trans) this.applyTrans();
  },
  applyTrans() {
    const tr = this.trans, k = tr.t < tr.dur ? tr.t / tr.dur : 2 - tr.t / tr.dur;
    const m = 1 + Math.floor(k * 10);
    if (m > 1) {
      // efeito mosaico (marca registrada do SNES)
      if (!this.mos) this.mos = U.canvas(W, H);
      const sw = Math.ceil(W / m), sh = Math.ceil(H / m);
      this.mos.x.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, sw, sh);
      ctx.drawImage(this.mos.c, 0, 0, sw, sh, 0, 0, sw * m, sh * m);
    }
    ctx.fillStyle = 'rgba(0,0,0,' + U.clamp(k * 1.1, 0, 1).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  },
  drawTitle() {
    TitleArt.draw(this.t);
    if (this.sub === 'help') { this.drawHelp(); return; }
    if (this.sub === 'controls') { this.drawControls(); return; }
    if (this.sub === 'select') { this.drawSelect(); return; }
    if (this.sub === 'abilities') { this.drawAbilities(); return; }
    if (this.sub === 'cosmetics') { this.drawCosmetics(); return; }
    if (this.menu && this.menu.panel) { this.drawNavigation(); return; }
    if (this.sub === 'difficulty') { this.drawDifficulty(); return; }
    if (!this.menu) {
      const touch = typeof document !== 'undefined' && document.body && document.body.classList.contains('touch');
      if (Math.floor(this.t / 30) % 2 === 0) Font.draw(touch ? 'TOQUE PARA COMEÇAR' : 'APERTE ENTER OU ESPAÇO', W / 2, 205, '#ffffff', { align: 'center', outline: true });
      if (Game.hiscore > 0) Font.draw('RECORDE ' + String(Game.hiscore).padStart(7, '0'), W / 2, 215, '#ffe384', { align: 'center' });
    } else this.drawMenu(this.menu, W / 2, 82);
  },
  drawExplore() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(5, 20, 246, 197);
    const level = Game.levelIdx, stats = Game.stats;
    const lines = [
      'LEMBRANÇAS DO EXPEDIENTE', '',
      'COLEÇÃO DA FASE: ' + Exploration.count(level) + '/3',
      'NESTA PARTIDA: ' + stats.found.length + '/3', '',
      'DESAFIOS INDEPENDENTES:', 'CONCLUIR SEM MORRER.', 'ENCONTRAR AS TRÊS LEMBRANÇAS.',
      'CONCLUIR EM ATÉ ' + this.timeTarget(level) + '.', '',
      'TEMPO ATIVO: ' + Exploration.timeText(stats.frames), 'MORTES: ' + stats.deaths,
      stats.eligible ? 'TEMPO E MORTES VALEM PARA DESAFIOS.' : 'REJOGUE DO INÍCIO PARA TEMPO/MORTES.', '',
      'COLEÇÃO PERMANENTE, ATÉ NO REPLAY.', 'MODOS / ASSISTÊNCIA TÊM SEUS RECORDES.',
    ];
    lines.forEach((line, i) => Font.draw(line, 128, 29 + i * 10, i ? '#e9effb' : '#ffbf30', { align: 'center' }));
    Font.draw('ENTER / ESC: VOLTAR', 128, 204, '#ffe384', { align: 'center' });
  },
  drawSelect() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(5, 20, 246, 197);
    this.drawMenu(this.menu, 128, 24);
    const level = Math.min(this.menu.i, LEVELS.length - 1), count = Exploration.count(level);
    const record = Save.data.profile.records[Exploration.key(level, Difficulty.selected, Comfort.assist)] || {};
    const y = 24 + this.menu.items.length * 12 + 30;
    Font.draw('LEMBRANÇAS: ' + count + '/3', 128, y, '#ffe384', { align: 'center' });
    for (let slot = 0; slot < 3; slot++) { ctx.globalAlpha = Save.data.profile.memories.includes(Exploration.id(level, slot)) ? 1 : 0.3; ctx.drawImage(SPR.memories[slot].r, 94 + slot * 26, y + 10); }
    ctx.globalAlpha = 1;
    Font.draw((record.noDeaths ? '★' : 'O') + ' SEM MORRER   ' + (record.secrets ? '★' : 'O') + ' 3 SEGREDOS', 128, y + 31, '#e9effb', { align: 'center' });
    Font.draw((record.time ? '★' : 'O') + ' ATÉ ' + this.timeTarget(level) + '  MELHOR: ' + (record.bestFrames ? Exploration.timeText(record.bestFrames) : '--:--'), 128, y + 43, '#e9effb', { align: 'center' });
    Font.draw(Difficulty.modes[Difficulty.selected].name + (Comfort.assist ? ' + ASSISTÊNCIA' : ''), 128, y + 55, '#a2c4ff', { align: 'center' });
    const ids = Save.data.campaign.abilities;
    const powers = Progression.abilities.filter(a => ids.includes(a.id)).map(a => ({ doubleJump: 'PULO', propulsion: 'PUM', bellySlam: 'BARRIGA', steadyStep: 'FIRME' })[a.id]);
    Font.draw(powers.length ? 'PODERES: ' + powers.join(' / ') : 'SEM PODERES CONQUISTADOS', 128, y + 67, '#a2c4ff', { align: 'center' });
    Font.draw('REPLAY PRESERVA SUA CAMPANHA.', 128, 204, '#ffe384', { align: 'center' });
  },
  timeTarget(level) { return Exploration.timeText(Exploration.targets[level] * 60); },
  drawControls() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(5, 25, 246, 184);
    this.drawMenu(this.menu, W / 2, 29);
    const ids = Object.keys(Input.presets), p = Input.presets[ids[this.menu.i]] || Input.presets[Input.preset];
    [p.move + ': ANDAR', p.jump + ': PULAR', p.run + ': CORRER / LATAS', p.propel + ': PUM PROPULSOR', (p.move === 'WASD' ? 'S' : '▼') + ' + PULAR NO AR: BARRIGADA'].forEach((line, i) => Font.draw(line, 128, 113 + i * 12, '#e9effb', { align: 'center' }));
    Font.draw('★ ATIVO  ENTER: SELECIONAR', 128, 180, '#ffe384', { align: 'center' });
    Font.draw('W/S OU ▲/▼: ESCOLHER  ESC: VOLTAR', 128, 194, '#a2c4ff', { align: 'center' });
  },
  drawDifficulty() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(5, 18, 246, 199);
    this.drawMenu(this.menu, W / 2, 22);
    const ids = Object.keys(Difficulty.modes), mode = Difficulty.modes[ids[this.menu.i]] || Difficulty.current();
    mode.tips.forEach((line, i) => Font.draw(line, 128, 115 + i * 12, '#e9effb', { align: 'center' }));
    const hint = this.state === 'pause' ? ['TROCAR REINICIA DO PONTO.', 'ITENS TEMPORÁRIOS SÃO PERDIDOS.'] : ['VALE PARA NOVO JOGO E REPLAY.', 'CONTINUAR MANTÉM O MODO SALVO.'];
    if (this.state === 'pause') hint.push('TEMPO/MORTES: REJOGUE DO INÍCIO.');
    hint.forEach((line, i) => Font.draw(line, 128, 161 + i * 12, '#a2c4ff', { align: 'center' }));
    Font.draw('ENTER: SELECIONAR  ESC: VOLTAR', 128, 201, '#ffe384', { align: 'center' });
  },
  updateHelp() {
    if (Input.pressed('left') || Input.pressed('right')) this.helpPage = ((this.helpPage || 0) + (Input.pressed('right') ? 1 : 4)) % 5;
  },
  drawHelp() {
    ctx.fillStyle = 'rgba(0,21,59,0.94)'; ctx.fillRect(5, 20, W - 10, H - 28);
    const L = this.helpPage === 4 ? [
      ['MINICHEFES E COSMÉTICOS', '#ffbf30'], ['', ''],
      ['PORTAS DESAFIO: ÔNIBUS/ESCRITÓRIO.', '#ffe384'], ['▲ PARA ENTRAR; SEM CRACHÁ.', '#e9effb'],
      ['90S E 3 CORAÇÕES DO DESAFIO.', '#e9effb'], ['SAÍDA/FALHA PRESERVA A CAMPANHA.', '#e9effb'],
      ['FISCAL: AVISA, INVESTE E DESCANSA.', '#94e5ef'], ['RH: AVISA, SOLTA PAPEL E ABRE.', '#94e5ef'],
      ['▼: PISE OU USE COCA/BARRIGADA.', '#e9effb'], ['INTERVALO ENTRE ACERTOS: 40 QUADROS.', '#e9effb'],
      ['VITÓRIA: +3000 E REGISTRO NO PERFIL.', '#e9effb'], ['MODO KINHU: SEM MINICHEFES.', '#a2c4ff'], ['', ''],
      ['CONFIGURAÇÕES > VISUAL DO KINHU.', '#a2c4ff'], ['ROUPAS: COLEÇÃO, MEDALHAS E VITÓRIAS.', '#a2c4ff'], ['COCA/KINHURINE MANTÊM SEU VISUAL.', '#a2c4ff'],
    ] : this.helpPage === 3 ? [
      ['SALAS BÔNUS / MANUTENÇÃO', '#ffbf30'], ['', ''],
      ['CRACHÁ: ESCRITÓRIO E SERVIDORES.', '#ffe384'],
      ['▲ NA PORTA: ENTRAR COM CRACHÁ.', '#e9effb'], ['O CRACHÁ É CONSUMIDO AO ENTRAR.', '#e9effb'],
      ['1 TENTATIVA POR SALA NA PARTIDA.', '#e9effb'], ['', ''],
      ['45S, SALTOS E ATÉ 10 MOEDAS.', '#94e5ef'], ['▲ NA PORTA FINAL: +1000 PONTOS.', '#e9effb'],
      ['MOEDAS RECOLHIDAS SÃO MANTIDAS.', '#e9effb'], ['QUEDA / TEMPO: VOLTA SEM MORRER.', '#e9effb'], ['', ''],
      ['A FASE E OS BÔNUS FICAM PAUSADOS.', '#a2c4ff'], ['TEMPO ATIVO DOS DESAFIOS CONTA.', '#a2c4ff'],
      ['NA PAUSA: SAIR DA SALA BÔNUS.', '#a2c4ff'], ['CRACHÁ NÃO É RESTAURADO NO SAVE.', '#a2c4ff'],
    ] : this.helpPage === 2 ? [
      ['MARMITA E HORA EXTRA', '#ffbf30'], ['', ''],
      ['MARMITA CAPRICHADA', '#ffe384'], ['RECUPERA ATÉ 2 CORAÇÕES.', '#e9effb'],
      ['VIDA CHEIA: +1000 PONTOS.', '#e9effb'], ['', ''],
      ['HORA EXTRA', '#94e5ef'], ['DEVOLVE ATÉ 30 NO CRONÔMETRO.', '#e9effb'],
      ['LIMITE: TEMPO INICIAL DA FASE.', '#e9effb'], ['CONSIDERA MODO E ASSISTÊNCIA.', '#e9effb'], ['', ''],
      ['EFEITO IMEDIATO AO RECOLHER.', '#e9effb'], ['NÃO TROCA CAFÉ, ÍMÃ OU MOCHILA.', '#e9effb'],
      ['DESVIOS ALTOS NAS FASES 3 / 4 / 5.', '#a2c4ff'],
      ['MORTE / RETOMADA: NÃO REAPARECEM.', '#a2c4ff'], ['VOLTAM EM NOVO JOGO / REPLAY.', '#a2c4ff'],
    ] : this.helpPage ? [
      ['ITENS TEMPORÁRIOS', '#ffbf30'], ['', ''],
      ['CAFÉ: +15% DE VELOCIDADE, 8S.', '#ffe384'], ['NÃO AUMENTA A ALTURA DO PULO.', '#e9effb'],
      ['ÍMÃ: MOEDAS ATÉ 3 BLOCOS, 12S.', '#ffe384'], ['RESPEITA PAREDES; SÓ MOEDAS.', '#e9effb'],
      ['MOCHILA: ABSORVE UM GOLPE.', '#94e5ef'], ['PERIGOS FATAIS AINDA MATAM.', '#e9effb'], ['', ''],
      ['COCA + MOCHILA + CAFÉ OU ÍMÃ.', '#e9effb'], ['CAFÉ / ÍMÃ: TROCA OU RENOVA.', '#e9effb'],
      ['KINHURINE PAUSA BÔNUS E TEMPO.', '#e9effb'], ['DANO: MOCHILA, COCA, CORAÇÃO.', '#e9effb'], ['', ''],
      ['MORTE / RETOMADA: BÔNUS ACABAM.', '#a2c4ff'], ['ITENS CONSUMIDOS NÃO REAPARECEM.', '#a2c4ff'],
    ] : [
      ['COMO JOGAR', '#ffbf30'], ['', ''],
      [Input.label('move') + ': ANDAR', '#e9effb'], [Input.label('jump') + ': PULAR', '#e9effb'], [Input.label('run') + ': CORRER', '#e9effb'],
      [Input.label('run', Input.device, true) + ' COM COCA: JOGAR LATAS', '#e9effb'], [Input.label('down') + ' + PULAR: DESCER PLATAFORMA', '#e9effb'], ['ENTER: PAUSA   M: SOM   F: TELA CHEIA', '#e9effb'], ['', ''],
      ['CACHORRO-QUENTE: +1 CORAÇÃO', '#ffb0a0'], ['COCA-COLA: PODER DE ARREMESSO', '#ffd0a0'], ['GARRAS: MODO KINHURINE!', '#ffe384'], ['CRACHÁ: VIDA EXTRA', '#a0ffa0'], ['', ''],
      ['O JOGO SALVA SOZINHO NO NAVEGADOR.', '#a2c4ff'], ['NA PAUSA DÁ PARA BAIXAR O SAVE', '#a2c4ff'], ['E CARREGAR EM OUTRO LUGAR.', '#a2c4ff'],
    ];
    L.forEach(([t, c], i) => { if (t) Font.draw(t.replace('↑', '▲'), W / 2, 28 + i * 10, c, { align: 'center' }); });
    Font.draw('◄ ►  ' + ((this.helpPage || 0) + 1) + '/5   ENTER / ESC: VOLTAR', 128, 204, '#ffe384', { align: 'center' });
  },
  drawStory() {
    Cutscenes.draw();
  },
  drawJumpDemo(y = 182) {
    const t = this.t % 150;
    const rise = t < 25 ? 0 : t < 65 ? Math.sin((t - 25) / 80 * Math.PI) * 25 : t < 125 ? 25 + Math.sin((t - 65) / 60 * Math.PI) * 28 - (t - 65) / 60 * 25 : 0;
    ctx.fillStyle = '#ffbf30'; ctx.fillRect(74, y + 1, 108, 2);
    const spr = t >= 25 && t < 125 ? SPR.kinhu.jump.r : SPR.kinhu.idle.r;
    ctx.drawImage(spr, 117, Math.round(y - spr.height - rise));
    if (t >= 65 && t < 80) Font.draw('★', 143, y - 45, '#80e0ff');
  },
  drawAbilityDemo(id, y = 179) {
    if (id === 'doubleJump') { this.drawJumpDemo(y); return; }
    const t = this.t % 150;
    ctx.fillStyle = '#ffbf30'; ctx.fillRect(58, y + 1, 140, 2);
    let x = 112, rise = 0, spr = SPR.kinhu.idle.r;
    if (id === 'propulsion') {
      x = 83 + (t < 30 ? 0 : t < 42 ? (t - 30) * 4 : 48);
      if (t >= 30 && t < 55) { spr = SPR.kinhu.propel.r; ctx.fillStyle = '#c6d393'; ctx.fillRect(x - 15, y - 12, 11, 6); }
    } else if (id === 'bellySlam') {
      rise = t < 25 ? 0 : t < 65 ? Math.sin((t - 25) / 80 * Math.PI) * 38 : Math.max(0, 38 - (t - 65) * 7);
      spr = t >= 65 && t < 80 ? SPR.kinhu.slam.r : rise > 0 ? SPR.kinhu.jump.r : SPR.kinhu.idle.r;
      Font.draw('▼', 122, y - 57, '#ffe384');
      ctx.fillStyle = '#bf8549'; if (t < 71) ctx.fillRect(111, y - 5, 21, 5);
    } else { ctx.fillStyle = '#8abdd3'; ctx.fillRect(58, y + 3, 140, 4); }
    ctx.drawImage(spr, Math.round(x), Math.round(y - spr.height - rise));
  },
  drawAbilities() {
    ctx.fillStyle = '#00153b'; ctx.fillRect(5, 22, 246, 195);
    Font.draw('HABILIDADES DA CAMPANHA', 128, 32, '#ffbf30', { align: 'center' });
    const progress = this.state === 'title' ? Save.data.campaign : Game.progress;
    const list = Progression.abilities.filter(a => Progression.usable(progress, a.id));
    if (list.length) {
      const a = list[(this.abilityPage || 0) % list.length];
      Progression.feedback(a.id).forEach((line, i) => Font.draw(line, 128, 53 + i * 14, i ? '#e9effb' : '#ffe384', { align: 'center' }));
      a.tips.forEach((line, i) => Font.draw(line, 128, 101 + i * 10, '#a2c4ff', { align: 'center' }));
      this.drawAbilityDemo(a.id);
      Font.draw('◄ ►  ' + ((this.abilityPage || 0) + 1) + '/' + list.length, 128, 187, '#a2c4ff', { align: 'center' });
    } else {
      Font.draw('AINDA SEM HABILIDADES.', 128, 83, '#e9effb', { align: 'center' });
      Font.draw('CONCLUA A PRIMEIRA FASE.', 128, 109, '#a2c4ff', { align: 'center' });
    }
    Font.draw(Input.device === 'keyboard' ? 'ENTER / ESC: VOLTAR' : 'A / START: VOLTAR', 128, 204, '#ffe384', { align: 'center' });
  },
  drawIntro() {
    const L = LEVELS[Game.levelIdx];
    ctx.fillStyle = '#00153b'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { ctx.fillStyle = y % 8 ? '#021a44' : '#00153b'; ctx.fillRect(0, y, W, 2); }
    Font.draw('FASE ' + L.id, W / 2, 46, '#ffbf30', { align: 'center', scale: 2, outline: true });
    Font.draw(L.name, W / 2, 78, '#ffffff', { align: 'center' });
    ctx.drawImage(SPR.clock, W / 2 - 22, 92);
    Font.draw(L.clock, W / 2 - 10, 95, '#a2c4ff');
    Font.draw(Game.difficulty === 'kinhu' && L.boss ? 'PEGUE O TROFÉU!' : L.goal, W / 2, 116, '#ffe384', { align: 'center' });
    const k = SPR.kinhu.idle;
    ctx.drawImage(k.r, W / 2 - 26, 140);
    Font.draw('× ' + Game.lives, W / 2 + 2, 150, '#ffffff');
    Font.draw(Difficulty.current().name, W / 2, 195, '#a2c4ff', { align: 'center' });
    if (Game.checkpoint) Font.draw('CONTINUANDO DO PONTO', W / 2, 180, '#80ff80', { align: 'center' });
  },
  drawGameOver() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, W, H);
    Font.draw('FIM DE JOGO', W / 2, 60, '#ff5a40', { align: 'center', scale: 2, outline: true });
    Font.draw('PONTOS ' + String(Game.score).padStart(7, '0'), W / 2, 92, '#ffffff', { align: 'center' });
    Font.draw('RECORDE ' + String(Game.hiscore).padStart(7, '0'), W / 2, 104, '#ffe384', { align: 'center' });
    ctx.drawImage(SPR.kinhu.hurt.r, W / 2 - 10, 116);
    if (this.menu && this.t > 60) this.drawMenu(this.menu, W / 2, 150);
  },
  drawEnding() {
    BG.draw('final', this.t * 0.8, this.t);
    const T = Tiles.get('bairro');
    for (let x = -16; x < W + 16; x += 16) {
      const ox = Math.round(x - ((this.t * 0.8) % 16));
      ctx.drawImage(T.ground[1][((x / 16) | 0) % 3 < 0 ? 0 : ((x / 16) | 0) % 3], ox, 192); ctx.drawImage(T.ground[0][0], ox, 208);
    }
    const k = SPR.kinhu.run[Math.floor(this.t / 7) % 4];
    ctx.drawImage(k.r, 60, 168);
    ctx.fillStyle = 'rgba(20,10,40,0.35)'; ctx.fillRect(0, 0, W, 160);
    const y0 = 170 - this.t * 0.35;
    CREDITS.forEach((line, i) => {
      const y = y0 + i * 12;
      if (y < -10 || y > 160) return;
      const txt = line === '{SCORE}' ? 'PONTUAÇÃO FINAL: ' + String(Game.score).padStart(7, '0') : line;
      Font.draw(txt, W / 2, y, i === 0 || line === 'FIM' ? '#ffe384' : '#ffffff', { align: 'center' });
    });
    if (this.t > 600 && Math.floor(this.t / 20) % 2) Font.draw('APERTE ENTER', W / 2, 212, '#ffffff', { align: 'center', outline: true });
  },
  drawHUD() {
    const Wd = World, p = Wd.player;
    ctx.fillStyle = 'rgba(0,10,30,0.35)'; ctx.fillRect(0, 0, W, 15);
    ctx.drawImage(SPR.kinhuHead, 0, 0, 20, 12, 1, 1, 20, 12);
    Font.draw('×' + Game.lives, 20, 5);
    const hearts = Bonus.active && Bonus.active.fight ? Bonus.active.health : Game.hearts;
    for (let i = 0; i < Game.maxHearts; i++) ctx.drawImage((i < hearts ? SPR.heart : SPR.heartEmpty).r, 38 + i * 10, 3);
    if (Game.power === 1) ctx.drawImage(SPR.coca.r, 69, -2);
    ctx.drawImage(SPR.coinSmall, 90, 5);
    Font.draw('×' + String(Game.coins).padStart(3, '0'), 97, 5);
    Font.draw(String(Game.score).padStart(7, '0'), 128, 5);
    ctx.drawImage(SPR.clock, 180, 2);
    Font.draw(String(Math.max(0, Wd.time)).padStart(3, '0'), 191, 5, Wd.hurry && (Comfort.reducedFlash || Wd.t % 20 < 10) ? '#ff6040' : '#ffffff');
    Font.draw(Bonus.active ? 'B+' : 'F' + Wd.def.id, 233, 5, '#ffe384');
    if (p.wild > 0) { const w = Math.round((p.wild / 600) * 60); ctx.fillStyle = '#20141c'; ctx.fillRect(3, 27, 62, 4); ctx.fillStyle = ['#ffe040', '#ff80c0', '#60e0ff'][Comfort.reducedFlash ? 0 : Math.floor(Wd.t / 4) % 3]; ctx.fillRect(4, 28, w, 2); }
    if (!Bonus.active) Font.draw('★' + Exploration.count(Game.levelIdx) + '/3', 91, 27, '#ffe384', { outline: true });
    if (Wd.bannerT > 0 && (Comfort.reducedFlash || Wd.bannerT > 20 || Wd.bannerT % 4 < 2)) Font.draw(Wd.banner, W / 2, 38, '#ffe384', { align: 'center', outline: true });
    if (Wd.bossFight && Wd.boss && Wd.boss.alive && Wd.boss.state !== 'dead') {
      const b = Wd.boss;
      Font.draw('MEGA BUG', W / 2, 202, '#a0ff80', { align: 'center', outline: true });
      ctx.fillStyle = '#20141c'; ctx.fillRect(W / 2 - 51, 212, 102, 6);
      ctx.fillStyle = '#3a1020'; ctx.fillRect(W / 2 - 50, 213, 100, 4);
      ctx.fillStyle = b.phase === 2 ? '#ff4060' : '#58d048'; ctx.fillRect(W / 2 - 50, 213, Math.round((Math.max(0, b.hp) / b.maxHp) * 100), 4);
    }
    if (Progression.usable(Game.progress, 'propulsion')) {
      Font.draw(Input.label('propel') + (p.dashCooldown ? ': ' + (p.dashCooldown / 60).toFixed(1) + 'S' : ': OK') + (p.airPropulsionUsed && !p.onGround ? ' AR' : ''), 4, 18, '#e9effb', { outline: true });
    }
    if (p.backpack) ctx.drawImage(SPR.backpack.r, 94, 15, 12, 12);
    if (p.maintenanceKey) ctx.drawImage(SPR.maintenance.r, 78, 15, 12, 12);
    if (p.utility) {
      ctx.drawImage(SPR[p.utility].r, 110, 15, 12, 12);
      Font.draw(p.wild > 0 ? 'PAUSA' : Math.ceil(p.utilityT / 60) + 'S' + (p.utilityT <= 120 ? '!' : ''), 126, 18, p.utilityT <= 120 ? '#ffbf30' : '#e9effb', { outline: true });
    }
    Font.draw((Game.assist ? 'A ' : '') + Difficulty.current().name, 222, 18, '#a2c4ff', { align: 'right', outline: true });
    if (this.saveIcon > 0 && (Comfort.reducedFlash || this.saveIcon % 10 < 7)) Font.draw('SALVO', W - 4, 18, '#80ff80', { align: 'right' });
    if (Bonus.active && Bonus.active.fight) {
      const mini = Wd.ents.find(e => e.kind === 'miniboss');
      ctx.fillStyle = 'rgba(0,21,59,0.9)'; ctx.fillRect(4, 188, 248, 33);
      Font.draw(Minibosses.names[mini.type], 128, 190, '#ffe384', { align: 'center' });
      ctx.fillStyle = '#24397a'; ctx.fillRect(72, 201, 112, 5); ctx.fillStyle = '#80ff80'; ctx.fillRect(72, 201, Math.round(112 * mini.hp / mini.maxHp), 5);
      Font.draw(mini.state === 'recover' ? '▼: ABERTA! ATAQUE POR CIMA OU LATAS.' : mini.state === 'warn' ? '!: PREPARE-SE PARA DESVIAR.' : mini.state === 'dead' ? 'MINICHEFE VENCIDO!' : 'DESVIE E ESPERE O SINAL ▼.', 128, 211, '#e9effb', { align: 'center' });
    } else if (Bonus.active) {
      ctx.fillStyle = 'rgba(0,21,59,0.9)'; ctx.fillRect(4, 198, 248, 20);
      Font.draw('SALA BÔNUS: ' + Bonus.active.coins + '/10 MOEDAS', 128, 200, '#ffe384', { align: 'center' });
      Font.draw('▲ NAS PORTAS. QUEDA NÃO GASTA VIDA.', 128, 209, '#e9effb', { align: 'center' });
    }
    // dica de controles no começo do jogo
    if (Wd.def.id === 1 && !Game.checkpoint && Wd.t < 480 && !Wd.clear) {
      const tip = Input.label('move') + ': ANDAR  ' + Input.label('jump', Input.device, true) + ': PULO  ' + Input.label('run', Input.device, true) + ': CORRER';
      const w = Font.width(tip) + 12;
      ctx.fillStyle = 'rgba(0,21,59,0.8)'; ctx.fillRect(W / 2 - w / 2, 200, w, 14);
      Font.draw(tip, W / 2, 204, '#ffe384', { align: 'center' });
    }
    const practice = Wd.def.practiceAbility || 'doubleJump';
    if (Wd.def.practiceEnd && p.x < Wd.def.practiceEnd * TS && !Game.checkpoint && !Wd.clear && Progression.usable(Game.progress, practice)) {
      ctx.fillStyle = 'rgba(0,21,59,0.9)'; ctx.fillRect(4, 199, 248, 19);
      Font.draw(Progression.command(practice), 128, 201, '#ffe384', { align: 'center' });
      Font.draw(({ doubleJump: 'SOLTE E APERTE. ALCANCE O BAGAGEIRO!', propulsion: 'USE A ARRANCADA NO TRECHO LIVRE.', bellySlam: '▼ NAS CAIXAS E NO BOTÃO DO CHÃO.', steadyStep: 'FIRMEZA AUTOMÁTICA NO PISO MOLHADO.' })[practice], 128, 210, '#e9effb', { align: 'center' });
    }
  },
};

/* ---------- laço principal (60 quadros por segundo fixos) ---------- */
(function boot() {
  try { if (localStorage.getItem('kinhus-adventure:mute') === '1') Sound.muted = true; } catch (e) { /* ok */ }
  App.init();
  if (typeof __NODE_TEST__ !== 'undefined') return;
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(250, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) { App.update(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    App.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
