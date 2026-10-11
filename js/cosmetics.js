'use strict';
const Cosmetics = {
  KEY: 'kinhus-adventure:cosmetic', selected: 'original',
  styles: {
    original: { name: 'ORIGINAL', tips: () => ['VISUAL CLÁSSICO DO KINHU.', 'SEM ALTERAR A FÍSICA.'], earned: () => true },
    blue: { name: 'CAMISETA AZUL', tips: p => ['COLETE 3 LEMBRANÇAS NO PERFIL.', 'PROGRESSO: ' + p.memories.length + '/3'], earned: p => p.memories.length >= 3 },
    green: { name: 'CAMISETA VERDE', tips: p => ['COMPLETE A COLEÇÃO DE 15 LEMBRANÇAS.', 'PROGRESSO: ' + p.memories.length + '/15'], earned: p => p.memories.length >= 15 },
    purple: { name: 'CAMISETA ROXA', tips: p => ['CONQUISTE 3 MEDALHAS DIFERENTES.', 'PROGRESSO: ' + Cosmetics.medals(p) + '/3'], earned: p => Cosmetics.medals(p) >= 3 },
    gold: { name: 'CRACHÁ DOURADO', tips: p => ['VENÇA OS DOIS MINICHEFES.', 'PROGRESSO: ' + p.minibosses.length + '/2'], earned: p => p.minibosses.length === 2 },
  },
  medals(p) {
    const medals = new Set();
    for (const [key, r] of Object.entries(p.records)) for (const id of ['noDeaths', 'secrets', 'time']) if (r[id]) medals.add(key.split(':')[0] + ':' + id);
    return medals.size;
  },
  profile() { return Save.data ? Save.data.profile : Exploration.blank(); },
  valid(id) { return Object.prototype.hasOwnProperty.call(this.styles, id); },
  unlocked(id) { return this.valid(id) && this.styles[id].earned(this.profile()); },
  current() { return this.unlocked(this.selected) ? this.selected : 'original'; },
  load() { try { const id = localStorage.getItem(this.KEY); this.selected = this.valid(id) ? id : 'original'; } catch (e) { this.selected = 'original'; } },
  select(id) {
    if (!this.unlocked(id)) return false;
    this.selected = id; try { localStorage.setItem(this.KEY, id); } catch (e) { /* sem armazenamento */ }
    return true;
  },
  sprite(id = this.current()) { return SPR.costumes[id] || SPR.kinhu; },
  badge(x, y, id = this.current()) {
    if (id !== 'gold') return;
    ctx.fillStyle = '#ffe384'; ctx.fillRect(Math.round(x + 5), Math.round(y + 11), 3, 4);
    ctx.fillStyle = '#a65b35'; ctx.fillRect(Math.round(x + 6), Math.round(y + 12), 1, 1);
  },
};
