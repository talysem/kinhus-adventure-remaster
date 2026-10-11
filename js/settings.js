'use strict';
const Difficulty = {
  KEY: 'kinhus-adventure:difficulty', selected: 'normal',
  modes: {
    kinhu: { name: 'KINHU', lives: 9, time: 1500, enemies: false, speed: 1, delay: 1, inv: 180, bossHP: 0, tips: ['SEM INIMIGOS OU CHEFE.', '9 TENTATIVAS, TEMPO 1500.', 'BURACOS E PERIGOS CONTINUAM.'] },
    easy: { name: 'FÁCIL', lives: 5, time: 1200, enemies: true, speed: 0.75, delay: 1.35, inv: 180, bossHP: 16, tips: ['INIMIGOS MAIS LENTOS.', '5 TENTATIVAS, TEMPO 1200.', 'CHEFE COM 16 DE VIDA.'] },
    normal: { name: 'NORMAL', lives: 3, time: 900, enemies: true, speed: 1, delay: 1, inv: 120, bossHP: 24, tips: ['RITMO ORIGINAL DA AVENTURA.', '3 TENTATIVAS, TEMPO 900.', 'CHEFE COM 24 DE VIDA.'] },
    hard: { name: 'DIFÍCIL', lives: 2, time: 750, enemies: true, speed: 1.2, delay: 0.8, inv: 90, bossHP: 32, tips: ['INIMIGOS E ATAQUES MAIS RÁPIDOS.', '2 TENTATIVAS, TEMPO 750.', 'CHEFE COM 32 DE VIDA.'] },
  },
  valid(id) { return Object.prototype.hasOwnProperty.call(this.modes, id); },
  current() { return this.modes[Game.difficulty] || this.modes.normal; },
  frames(n) { return Math.round(n * this.current().delay); },
  load() { try { const id = localStorage.getItem(this.KEY); this.selected = this.valid(id) ? id : 'normal'; } catch (e) { this.selected = 'normal'; } },
  select(id) { if (!this.valid(id)) return false; this.selected = id; try { localStorage.setItem(this.KEY, id); } catch (e) { /* sem armazenamento */ } return true; },
};

const ItemEffects = {
  coffeeFrames: 480, magnetFrames: 720, coffeeFactor: 1.15, magnetRadius: 3 * TS,
  clear(p) { p.backpack = false; p.utility = null; p.utilityT = 0; },
  active(p, id) { return p.utility === id && p.utilityT > 0 && p.wild === 0; },
  acquire(p, id) {
    if (id === 'backpack') { p.backpack = true; Sound.fx('shield'); popup(p.x - 14, p.y - 10, 'MOCHILA!', '#94e5ef'); }
    else {
      if (p.utility && p.utility !== id) popup(p.x - 24, p.y - 22, 'BÔNUS TROCADO', '#ffe384');
      p.utility = id; p.utilityT = id === 'coffee' ? this.coffeeFrames : this.magnetFrames;
      Sound.fx(id); popup(p.x - 12, p.y - 10, id === 'coffee' ? 'CAFÉ: 8S' : 'ÍMÃ: 12S', '#ffe384');
    }
    World.banner = id === 'backpack' ? 'MOCHILA: PROTEGE DE UM GOLPE' : id === 'coffee' ? 'CAFÉ: MAIS VELOCIDADE POR 8S' : 'ÍMÃ: MOEDAS POR 12S, ATÉ 3 BLOCOS';
    World.bannerT = 150;
  },
  update(p) {
    if (!p.utility || p.wild > 0 || p.dead) return;
    if (p.utilityT > 0 && --p.utilityT === 0) { p.utility = null; popup(p.x - 14, p.y - 12, 'BÔNUS FIM', '#ffe384'); }
  },
  visible(x, y, endX, endY) {
    const steps = Math.ceil(Math.hypot(endX - x, endY - y) / 4);
    for (let i = 1; i <= steps; i++) if (isSolid(tileAt(Math.floor((x + (endX - x) * i / steps) / TS), Math.floor((y + (endY - y) * i / steps) / TS)))) return false;
    return true;
  },
  magnet(p) {
    if (!this.active(p, 'magnet')) return;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2, r = this.magnetRadius;
    const targets = [];
    for (let ty = Math.max(0, Math.floor((cy - r) / TS)); ty <= Math.min(World.h - 1, Math.floor((cy + r) / TS)); ty++) {
      for (let tx = Math.max(0, Math.floor((cx - r) / TS)); tx <= Math.min(World.w - 1, Math.floor((cx + r) / TS)); tx++) {
        const x = tx * TS + 8, y = ty * TS + 8;
        if (tileAt(tx, ty) !== 'c' || Math.hypot(x - cx, y - cy) > r || !this.visible(cx, cy, x, y)) continue;
        targets.push({ tx, ty, x, y });
      }
    }
    for (const c of targets) {
      setTile(c.tx, c.ty, '.');
      if (!PickupLedger.claim('coin', c.tx, c.ty)) continue;
      addCoin(c.x, c.y);
      addEnt({ kind: 'coin', attracted: true, x: c.x - 5, y: c.y - 5, w: 10, h: 10, vx: 0, vy: 0, t: 0 });
    }
    for (const e of World.ents) {
      if (e.kind !== 'coin' || e.attracted || !e.alive || e.t <= 20) continue;
      const x = e.x + e.w / 2, y = e.y + e.h / 2;
      if (Math.hypot(x - cx, y - cy) <= r && this.visible(cx, cy, x, y)) {
        e.attracted = true; e.t = 0; addCoin(x, y);
      }
    }
  },
};

// Só coletáveis fixos do nível atual; consumidos não reaparecem ao retomar.
const PickupLedger = {
  key(type, x, y) { return type + ':' + Game.levelIdx + ':' + x + ':' + y; },
  claim(type, x, y) {
    const id = this.key(type, x, y);
    if (Game.collected.includes(id)) return false;
    Game.collected.push(id); if (World) World.saveDirty = true; return true;
  },
  validIds(level) {
    const ids = new Set();
    buildLevelRows(LEVELS[level]).forEach((row, y) => [...row].forEach((c, x) => {
      if (c === 'c') ids.add('coin:' + level + ':' + x + ':' + y);
      if ('?HL!BFR'.includes(c)) ids.add('block:' + level + ':' + x + ':' + y);
    }));
    for (const item of LEVELS[level].items || []) ids.add('item:' + level + ':' + item.x + ':' + item.y);
    return ids;
  },
  sanitize(ids, level) { const valid = this.validIds(level); return Array.isArray(ids) ? [...new Set(ids.filter(id => valid.has(id)))] : []; },
  restore() {
    for (const id of Game.collected) {
      const [type, level, x, y] = id.split(':'); if (+level !== World.idx || type === 'item') continue;
      const t = tileAt(+x, +y);
      if (type === 'coin' && t === 'c') setTile(+x, +y, '.');
      if (type === 'block') {
        if ('?HL!'.includes(t)) setTile(+x, +y, 'U');
        else if (t === 'B' || t === 'F') setTile(+x, +y, '.');
        else if (t === 'R') { const s = World.switches.find(s => s.tx === +x && s.ty === +y); if (s) s.pressed = true; }
      }
    }
  },
  flush() { if (World.saveDirty && App.state !== 'title') { World.saveDirty = false; App.saveProgress(false, true); } },
};
