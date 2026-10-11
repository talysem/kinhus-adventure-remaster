'use strict';

const Comfort = {
  KEY: 'kinhus-adventure:comfort',
  reducedShake: false, reducedFlash: false, music: 100, effects: 100, assist: false,
  load() {
    let data = {}; try { data = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { /* padrão */ }
    for (const key of ['reducedShake', 'reducedFlash', 'assist']) this[key] = data[key] === true;
    for (const key of ['music', 'effects']) this[key] = Number.isFinite(data[key]) ? U.clamp(Math.round(data[key]), 0, 100) : 100;
    Sound.setVolumes(this.music, this.effects);
  },
  set(key, value) {
    if (!['reducedShake', 'reducedFlash', 'music', 'effects', 'assist'].includes(key)) return;
    if ((key === 'music' || key === 'effects') && !Number.isFinite(value)) return;
    this[key] = key === 'music' || key === 'effects' ? U.clamp(Math.round(value), 0, 100) : !!value;
    Sound.setVolumes(this.music, this.effects);
    try { localStorage.setItem(this.KEY, JSON.stringify({ reducedShake: this.reducedShake, reducedFlash: this.reducedFlash, music: this.music, effects: this.effects, assist: this.assist })); } catch (e) { /* sem armazenamento */ }
    if (this.reducedShake && World) World.cam.shake = 0;
  },
  initialTime() { return Math.round(Difficulty.current().time * (Game.assist ? 1.5 : 1)); },
};

const Exploration = {
  // Três lembranças fixas por fase, em rotas que retornam ao percurso principal.
  spots: [
    [[24, 8], [235, 7], [558, 8]],
    [[24, 6], [235, 6], [558, 8]],
    [[24, 8], [235, 7], [558, 8]],
    [[24, 7], [235, 7], [558, 7]],
    [[24, 8], [235, 7], [365, 7]],
  ],
  targets: [300, 300, 300, 300, 240], // segundos ativos; metas iniciais independentes
  names: ['POSTAL', 'BILHETE', 'DISQUETE'],
  id(level, slot) { return 'memory:' + level + ':' + slot; },
  ids(level) { return this.spots[level].map((_, slot) => this.id(level, slot)); },
  blank() { return { memories: [], records: {}, minibosses: [] }; },
  validIds() { return this.spots.flatMap((_, level) => this.ids(level)); },
  blankStats(eligible = true) { return { frames: 0, deaths: 0, found: [], eligible }; },
  sanitizeStats(data, level, eligible = false) {
    data = data && typeof data === 'object' ? data : {};
    const valid = this.ids(level);
    const n = (value, max) => Number.isInteger(value) && value >= 0 ? Math.min(value, max) : 0;
    return { frames: n(data.frames, 21600000), deaths: n(data.deaths, 99999), found: Array.isArray(data.found) ? [...new Set(data.found.filter(id => valid.includes(id)))] : [], eligible: eligible && data.eligible === true };
  },
  key(level = Game.levelIdx, difficulty = Game.difficulty, assist = Game.assist) { return level + ':' + difficulty + ':' + (assist ? 'assist' : 'standard'); },
  sanitize(data) {
    const out = this.blank(); if (!data || typeof data !== 'object') return out;
    const valid = this.validIds();
    out.memories = Array.isArray(data.memories) ? [...new Set(data.memories.filter(id => valid.includes(id)))] : [];
    out.minibosses = Array.isArray(data.minibosses) ? [...new Set(data.minibosses.filter(id => ['fiscal', 'printer'].includes(id)))] : [];
    for (let level = 0; level < LEVELS.length; level++) for (const difficulty of Object.keys(Difficulty.modes)) for (const assist of [false, true]) {
      const key = this.key(level, difficulty, assist), r = data.records && data.records[key];
      if (!r || typeof r !== 'object') continue;
      const clear = r.clear === true;
      const bestFrames = clear && Number.isInteger(r.bestFrames) && r.bestFrames > 0 ? Math.min(r.bestFrames, 21600000) : null;
      out.records[key] = { clear, noDeaths: clear && bestFrames !== null && r.noDeaths === true, secrets: clear && r.secrets === true, time: clear && bestFrames !== null && bestFrames <= this.targets[level] * 60 && r.time === true, bestFrames };
    }
    return out;
  },
  merge(a, b) {
    a = this.sanitize(a); b = this.sanitize(b);
    const out = { memories: [...new Set([...a.memories, ...b.memories])], records: {}, minibosses: [...new Set([...a.minibosses, ...b.minibosses])] };
    for (const key of new Set([...Object.keys(a.records), ...Object.keys(b.records)])) {
      const x = a.records[key] || {}, y = b.records[key] || {};
      out.records[key] = { clear: !!(x.clear || y.clear), noDeaths: !!(x.noDeaths || y.noDeaths), secrets: !!(x.secrets || y.secrets), time: !!(x.time || y.time), bestFrames: Math.min(x.bestFrames || Infinity, y.bestFrames || Infinity) };
      if (!Number.isFinite(out.records[key].bestFrames)) out.records[key].bestFrames = null;
    }
    return out;
  },
  count(level) { return this.ids(level).filter(id => Save.data.profile.memories.includes(id)).length; },
  spawn() {
    this.spots[World.idx].forEach(([x, y], slot) => {
      const id = this.id(World.idx, slot);
      if (!Game.stats.found.includes(id)) addEnt({ kind: 'memory', id, slot, x: x * TS + 2, y: y * TS + 2, w: 12, h: 12, owned: Save.data.profile.memories.includes(id) });
    });
  },
  collect(e) {
    if (!e.alive || World.player.dead || World.clear || !U.overlap(e, World.player)) return;
    e.alive = false;
    if (!Game.stats.found.includes(e.id)) Game.stats.found.push(e.id);
    const first = !Save.data.profile.memories.includes(e.id);
    if (first) { Save.data.profile.memories.push(e.id); addScore(500, e.x, e.y - 8); }
    Sound.fx('check'); sparkle(e.x + 6, e.y + 6, 8, '#ffe384');
    World.banner = first ? 'LEMBRANÇA GUARDADA! ' + this.count(World.idx) + '/3' : 'LEMBRANÇA DO REPLAY: ' + Game.stats.found.length + '/3'; World.bannerT = 150;
    World.saveDirty = true;
  },
  tick() { if (!World.clear && !World.player.dead) Game.stats.frames++; },
  complete() {
    const key = this.key(), old = Save.data.profile.records[key] || {}, stats = Game.stats;
    const timed = stats.eligible && stats.frames > 0;
    const record = { clear: true, noDeaths: !!(old.noDeaths || (timed && stats.deaths === 0)), secrets: !!(old.secrets || stats.found.length === 3), time: !!(old.time || (timed && stats.frames <= this.targets[Game.levelIdx] * 60)), bestFrames: timed ? Math.min(old.bestFrames || Infinity, stats.frames) : old.bestFrames || null };
    Save.data.profile.records[key] = record;
    const medals = ['noDeaths', 'secrets', 'time'].filter(id => record[id] && !old[id]).length;
    if (medals) App.toast(medals + ' DESAFIO' + (medals > 1 ? 'S' : '') + ' CONCLUÍDO' + (medals > 1 ? 'S!' : '!'));
  },
  timeText(frames) { const seconds = Math.floor(frames / 60); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); },
};
