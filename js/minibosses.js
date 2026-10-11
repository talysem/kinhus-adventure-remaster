'use strict';
const Minibosses = {
  names: { fiscal: 'FISCAL DA LINHA', printer: 'IMPRESSORA DO RH' },
  spawn(type) {
    const hp = (type === 'fiscal' ? 6 : 8) + (Game.difficulty === 'easy' ? -2 : Game.difficulty === 'hard' ? 2 : 0);
    addEnt({ kind: 'miniboss', type, x: 10 * TS, y: 12 * TS - (type === 'fiscal' ? 32 : 24), w: type === 'fiscal' ? 22 : 28, h: type === 'fiscal' ? 32 : 24,
      hp, maxHp: hp, state: 'warn', t: 0, inv: 0, dir: -1 });
  },
  update(e) {
    if (!Bonus.active || !Bonus.active.fight) return;
    const p = World.player; e.t++; if (e.inv > 0) e.inv--;
    if (e.state === 'dead') { if (e.t >= 60) Bonus.finish('victory'); return; }
    if (e.state === 'warn' && e.t >= Difficulty.frames(42)) {
      e.dir = U.sign(p.x - e.x) || -1; e.state = 'attack'; e.t = 0; Sound.fx(e.type === 'fiscal' ? 'warn' : 'shoot');
    } else if (e.state === 'attack') {
      if (e.type === 'fiscal') e.x = U.clamp(e.x + e.dir * 2.6 * Difficulty.current().speed, 5 * TS, 11 * TS - e.w);
      else if (e.t === 1 || e.t === Difficulty.frames(12) || e.t === Difficulty.frames(24)) {
        World.projs.push({ type: 'paper', x: e.x + e.w / 2, y: e.y + 10, w: 8, h: 5, vx: e.dir * 2.1 * Difficulty.current().speed, vy: 0, life: 100, hostile: true, t: 0, owner: 'miniboss' });
        Sound.fx('shoot');
      }
      if (e.t >= Difficulty.frames(32)) { e.state = 'recover'; e.t = 0; }
    } else if (e.state === 'recover' && e.t >= Difficulty.frames(90)) { e.state = 'warn'; e.t = 0; }
    if (U.overlap(e, p)) {
      const above = p.vy > 0 && p.prevY + p.h <= e.y + 10;
      if (above || p.wild > 0) {
        const damage = above && p.slam ? 2 : 1; cancelMoves(p); p.y = e.y - p.h; p.vy = -7.2;
        this.hit(e, damage);
      } else hurtPlayer();
    }
  },
  hit(e, damage = 1) {
    if (!Bonus.active || !Bonus.active.fight || e.state !== 'recover' || e.inv > 0 || !e.alive) return false;
    e.hp = Math.max(0, e.hp - damage); e.inv = 40; Sound.fx('bosshit'); sparkle(e.x + e.w / 2, e.y, 6);
    if (e.hp === 0) {
      e.state = 'dead'; e.t = 0; Bonus.active.defeated = e.type;
      if (!Save.data.profile.minibosses.includes(e.type)) Save.data.profile.minibosses.push(e.type);
      addScore(3000, e.x, e.y - 10); World.projs = World.projs.filter(q => q.owner !== 'miniboss');
      World.saveDirty = true; PickupLedger.flush();
    }
    return true;
  },
  draw(e) {
    const spr = e.type === 'fiscal' ? e.state === 'warn' || e.state === 'attack' ? SPR.fiscal.act : SPR.fiscal.walk[Math.floor(World.t / 8) % 4] : SPR.hrPrinter[e.state === 'recover' ? 1 : 0];
    ctx.drawImage(e.dir < 0 ? spr.l : spr.r, Math.round(e.x - 1), Math.round(e.y - 1), e.w + 2, e.h + 2);
    Font.draw(e.state === 'warn' ? '!' : e.state === 'recover' ? '▼' : e.state === 'dead' ? 'O' : '', e.x + e.w / 2 - 3, e.y - 12, '#ffe384', { outline: true });
  },
};
