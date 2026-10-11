'use strict';
/* =========================================================
   Salvamento: progresso automático no navegador (localStorage)
   e arquivo de estado (.json) para exportar/importar em
   outro computador ou navegador.
   ========================================================= */

const Save = {
  KEY: 'kinhus-adventure:save',
  FORMAT: 5,
  writable: true,
  data: null,
  blank() { return { version: this.FORMAT, unlocked: 1, hiscore: 0, completed: false, run: null, plays: 0, campaign: Progression.blank(), profile: Exploration.blank() }; },
  hash(str) {
    // FNV-1a 32 bits: detecta arquivo corrompido ou editado por engano
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  },
  sanitize(d, sourceVersion = d && d.version === undefined ? 1 : d && d.version) {
    const n = (v, a, b, def) => (Number.isFinite(+v) ? U.clamp(Math.floor(+v), a, b) : def);
    const out = this.blank();
    if (!d || typeof d !== 'object') return out;
    if (!Number.isInteger(sourceVersion) || sourceVersion < 1 || sourceVersion > this.FORMAT) throw new Error('VERSÃO DE SAVE INVÁLIDA');
    out.unlocked = n(d.unlocked, 1, LEVELS.length, 1);
    out.hiscore = n(d.hiscore, 0, 9999999, 0);
    out.completed = !!d.completed;
    out.plays = n(d.plays, 0, 1e6, 0);
    out.profile = sourceVersion >= 5 ? Exploration.sanitize(d.profile) : Exploration.blank();
    const r = d.run;
    if (r && typeof r === 'object') {
      out.run = {
        level: n(r.level, 0, LEVELS.length - 1, 0),
        lives: n(r.lives, 1, 99, 3),
        score: n(r.score, 0, 9999999, 0),
        coins: n(r.coins, 0, COINS_PER_LIFE - 1, 0),
        hearts: n(r.hearts, 1, 3, 3),
        power: n(r.power, 0, 1, 0),
        checkpoint: !!r.checkpoint,
        difficulty: sourceVersion >= 4 && Difficulty.valid(r.difficulty) ? r.difficulty : 'normal',
        collected: sourceVersion >= 4 ? PickupLedger.sanitize(r.collected, n(r.level, 0, LEVELS.length - 1, 0)) : [],
        assist: sourceVersion >= 5 && r.assist === true,
        stats: Exploration.sanitizeStats(sourceVersion >= 5 ? r.stats : null, n(r.level, 0, LEVELS.length - 1, 0), sourceVersion >= 5),
        savedAt: n(r.savedAt, 0, 4102444800000, Date.now()),
      };
      out.unlocked = Math.max(out.unlocked, out.run.level + 1);
    }
    out.campaign = sourceVersion === 1
      ? Progression.legacy(out.run ? out.run.level : 0)
      : sourceVersion === 2
        ? Progression.migrateV2(d.campaign, out.run ? out.run.level : LEVELS.length)
        : Progression.sanitize(d.campaign, out.run ? out.run.level : LEVELS.length);
    return out;
  },
  load() {
    this.data = this.blank();
    this.writable = true;
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Não sobrescreve dados de uma versão mais nova do jogo.
        if (parsed && parsed.version > this.FORMAT) { this.writable = false; return this.data; }
        this.data = this.sanitize(parsed);
        this.persist();
      }
    } catch (e) { /* navegador sem armazenamento: segue sem salvar */ }
    return this.data;
  },
  persist() {
    if (!this.writable) return false;
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); return true; } catch (e) { return false; }
  },
  // monta o arquivo de estado
  fileText() {
    const save = this.data;
    const body = { game: "Kinhu's Adventure", format: this.FORMAT, exportedAt: new Date().toISOString(), save, check: this.hash(JSON.stringify(save)) };
    return JSON.stringify(body, null, 2);
  },
  fileName() {
    const d = new Date();
    const pad = v => String(v).padStart(2, '0');
    return `kinhus-adventure-save-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  },
  exportFile() {
    try {
      const blob = new Blob([this.fileText()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = this.fileName();
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return true;
    } catch (e) { return false; }
  },
  // lê o texto de um arquivo de estado; devolve { ok, msg }
  importText(text) {
    let body;
    try { body = JSON.parse(text); } catch (e) { return { ok: false, msg: 'ARQUIVO INVÁLIDO' }; }
    if (!body || body.game !== "Kinhu's Adventure" || !body.save || typeof body.save !== 'object' || Array.isArray(body.save)) return { ok: false, msg: 'NÃO É UM SAVE DO KINHU' };
    if (body.format > this.FORMAT) return { ok: false, msg: 'SAVE DE VERSÃO MAIS NOVA' };
    if (!Number.isInteger(body.format) || body.format < 1) return { ok: false, msg: 'FORMATO DE SAVE INVÁLIDO' };
    if (body.save.version > this.FORMAT) return { ok: false, msg: 'SAVE DE VERSÃO MAIS NOVA' };
    if (body.check !== this.hash(JSON.stringify(body.save))) return { ok: false, msg: 'ARQUIVO CORROMPIDO' };
    if ((body.format >= 2 && body.save.version !== body.format) || (body.format === 1 && body.save.version !== undefined && body.save.version !== 1)) return { ok: false, msg: 'FORMATO DE SAVE INVÁLIDO' };
    const d = this.sanitize(body.save, body.format);
    // mantém o melhor recorde entre os dois
    d.hiscore = Math.max(d.hiscore, (this.data && this.data.hiscore) || 0);
    d.profile = Exploration.merge(this.data && this.data.profile, d.profile);
    this.data = d;
    this.writable = true;
    this.persist();
    return { ok: true, msg: d.run ? 'SAVE CARREGADO: FASE ' + (d.run.level + 1) : 'SAVE CARREGADO' };
  },
};
