'use strict';
// A fase principal fica intacta em memória. Só moedas/pontos e tempo ativo
// dos desafios avançam; entrar já registra o uso da sala no save da campanha.
const Bonus = {
  active: null, duration: 45 * 60, completionScore: 1000,
  id(level = World.idx) { const room = LEVELS[level].bonus; return room && PickupLedger.keyForRoom(level, room.door); },
  spawn() {
    const room = World.def.bonus;
    if (room) {
      const id = this.id(), spent = Game.collected.includes(id);
      addEnt({ kind: 'bonusDoor', id, spent, x: room.door[0] * TS, y: room.door[1] * TS, w: 20, h: 32 });
      if (!spent) addEnt({ kind: 'maintenanceKey', id, x: room.key[0] * TS + 2, y: room.key[1] * TS + 2, w: 12, h: 12 });
    }
    const duel = World.def.duel;
    if (duel && Difficulty.current().enemies) {
      const id = 'duel:' + World.idx + ':' + duel.door[0] + ':' + duel.door[1];
      addEnt({ kind: 'duelDoor', id, spent: Game.collected.includes(id), x: duel.door[0] * TS, y: duel.door[1] * TS, w: 20, h: 32 });
    }
  },
  update(e) {
    const p = World.player;
    if (p.dead || World.clear) return;
    if (e.kind === 'maintenanceKey' && U.overlap(e, p)) {
      e.alive = false; p.maintenanceKey = e.id; Sound.fx('check');
      World.banner = 'CRACHÁ: ▲ NA PORTA BÔNUS'; World.bannerT = 160;
    } else if (e.kind === 'bonusCoin' && this.active && U.overlap(e, p)) {
      e.alive = false; this.active.coins++; addCoin(e.x, e.y); World.saveDirty = true;
    } else if (['bonusDoor', 'duelDoor', 'bonusExit'].includes(e.kind) && U.overlap(e, p) && Input.pressed('up')) {
      if (e.kind === 'bonusExit') this.finish(e.complete ? 'complete' : 'leave');
      else if (e.spent) { World.banner = 'SALA JÁ VISITADA NESTA PARTIDA'; World.bannerT = 100; }
      else if (e.kind !== 'duelDoor' && p.maintenanceKey !== e.id) { World.banner = 'BUSQUE O CRACHÁ DE MANUTENÇÃO'; World.bannerT = 120; }
      else this.enter(e);
    }
  },
  enter(door) {
    const fight = door.kind === 'duelDoor';
    if (this.active || App.trans || World.clear || World.player.dead || door.spent || (fight ? !Difficulty.current().enemies : World.player.maintenanceKey !== door.id)) return false;
    const parent = World, room = fight ? parent.def.duel : parent.def.bonus;
    if (!fight) parent.player.maintenanceKey = null;
    door.spent = true;
    Game.collected.push(door.id); parent.saveDirty = true; PickupLedger.flush();
    this.active = { parent, door, fight, health: 3, left: fight ? 90 * 60 : this.duration, coins: 0, tempo: Sound.tempo };
    const width = fight ? 16 : 40;
    const map = Array.from({ length: 14 }, (_, y) => Array(width).fill(y < 2 ? 'Z' : y >= 12 ? '#' : '.'));
    const gaps = fight ? [] : parent.theme === 'escritorio' ? [[9, 11], [19, 21], [29, 31]] : [[8, 11], [20, 23], [31, 33]];
    for (const [a, b] of gaps) {
      for (let x = a; x <= b; x++) { map[12][x] = '.'; map[13][x] = '.'; }
      for (let x = a - 1; x <= b + 1; x++) map[9][x] = '=';
    }
    if (fight) for (const x of [2, 3, 4, 12, 13, 14]) map[9][x] = '=';
    World = { ...parent, def: { id: parent.def.id, name: room.name, indoor: true, bonusRoom: true }, map, w: width, h: 14,
      ents: [], projs: [], parts: [], plats: [], decor: [], bumps: [], switches: [],
      cam: { x: 0, shake: 0, lock: null }, time: fight ? 90 : 45, timeLimit: fight ? 90 : 45, timeT: 0, hurry: false, t: 0, saveDirty: false,
      goal: null, start: null, cps: [], arena: null, boss: null, bossFight: false, house: null, brake: null, clear: null,
      banner: fight ? room.name + ': DESAFIO OPCIONAL' : 'SALA BÔNUS: MOEDAS E SALTOS!', bannerT: 150, player: makePlayer(3 * TS, 12 * TS - 21) };
    for (const [x, y] of fight ? [] : [[5, 10], [8, 8], [11, 8], [15, 10], [18, 8], [21, 8], [25, 10], [28, 8], [31, 8], [35, 10]]) {
      addEnt({ kind: 'bonusCoin', x: x * TS + 3, y: y * TS + 3, w: 10, h: 10 });
    }
    addEnt({ kind: 'bonusExit', complete: false, x: 2 * TS, y: 10 * TS, w: 20, h: 32 });
    if (fight) Minibosses.spawn(room.type);
    else addEnt({ kind: 'bonusExit', complete: true, x: 37 * TS, y: 10 * TS, w: 20, h: 32 });
    Sound.tempo = 1; Sound.fx('door'); Input.clear(); return true;
  },
  tick() {
    if (!this.active || this.active.defeated) return;
    World.time = Math.ceil(--this.active.left / 60);
    if (this.active.left <= 0) this.finish('timeout');
  },
  abort() {
    if (!this.active) return;
    World = this.active.parent; Sound.tempo = this.active.tempo; this.active = null; Input.clear();
  },
  finish(reason) {
    if (!this.active) return;
    const session = this.active;
    this.abort();
    const p = World.player;
    p.x = session.door.x + 24; p.y = session.door.y + 32 - p.h;
    p.vx = p.vy = 0; p.ride = null; p.inv = Math.max(p.inv, 60); cancelMoves(p);
    World.cam.x = U.clamp(p.x - 112, 0, World.w * TS - W);
    if (reason === 'complete') { addScore(this.completionScore, p.x - 10, p.y - 12); Sound.fx('check'); }
    World.banner = reason === 'victory' ? 'MINICHEFE VENCIDO! PERFIL SALVO' : reason === 'complete' ? 'BÔNUS CONCLUÍDO: +1000 PONTOS!' : 'DE VOLTA! SEM PERDER VIDA'; World.bannerT = 150;
    World.saveDirty = true; PickupLedger.flush();
  },
  hurt() {
    if (!this.active.fight) { this.finish('failure'); return; }
    const p = World.player;
    Sound.fx('hurt'); cancelMoves(p); p.inv = Difficulty.current().inv;
    p.vx = -p.facing * 1.6; p.vy = -3; p.onGround = false; p.ride = null;
    if (--this.active.health <= 0) this.finish('failure');
  },
  draw(e) {
    if (e.kind === 'maintenanceKey') { ctx.drawImage(SPR.maintenance.r, e.x - 2, Math.round(e.y - 2 + Math.sin(World.t / 15))); return; }
    if (e.kind === 'bonusCoin') { ctx.drawImage(SPR.coin[Math.floor(World.t / 7) % 4].r, e.x - 3, e.y - 3); return; }
    const exit = e.kind === 'bonusExit', color = e.spent ? '#64738d' : exit ? '#80ff80' : '#ffbf30';
    ctx.fillStyle = '#00153b'; ctx.fillRect(e.x - 2, e.y - 2, 24, 34);
    ctx.fillStyle = color; ctx.fillRect(e.x, e.y, 20, 2); ctx.fillRect(e.x, e.y, 2, 32); ctx.fillRect(e.x + 18, e.y, 2, 32);
    ctx.fillStyle = '#173357'; ctx.fillRect(e.x + 3, e.y + 3, 14, 28);
    Font.draw(exit ? '▲' : e.spent ? 'O' : '+', e.x + 7, e.y + 6, color);
    ctx.fillStyle = color; ctx.fillRect(e.x + 14, e.y + 22, 2, 2);
    Font.draw(exit ? e.complete ? 'FIM' : 'SAIR' : e.kind === 'duelDoor' ? 'DESAFIO' : 'BÔNUS', e.x + 10, e.y - 13, color, { align: 'center', outline: true });
    if (U.overlap({ ...e, x: e.x - 12, w: e.w + 24 }, World.player)) {
      const text = exit ? '▲: SAIR' : e.spent ? 'JÁ VISITADA' : e.kind === 'duelDoor' || World.player.maintenanceKey === e.id ? '▲: ENTRAR' : 'PRECISA DE CRACHÁ';
      Font.draw(text, e.x + 10, e.y - 24, color, { align: 'center', outline: true });
    }
  },
};
