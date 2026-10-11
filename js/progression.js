'use strict';
/* Marcos pertencem à campanha, nunca ao perfil de seleção de fases. */
const Progression = {
  abilities: [
    { id: 'doubleJump', after: 1, ready: true, name: 'PULO DUPLO', motto: 'PERDI O ÔNIBUS!', practiceLevel: 1, tips: ['SOLTE E APERTE DE NOVO.', 'UM PULO EXTRA ATÉ POUSAR.'], story: ['O ÔNIBUS JÁ ESTAVA SAINDO!', 'NO SUSTO, KINHU DEU OUTRO', 'PULO EM PLENO AR.'] },
    { id: 'propulsion', after: 2, ready: true, name: 'PUM PROPULSOR', motto: 'FOI O MUMU!', practiceLevel: 2, tips: ['ARRANCADA DE TRÊS BLOCOS.', '1 SEGUNDO ENTRE USOS.', 'NO AR: UMA VEZ ATÉ POUSAR.'], story: ['KINHU COMEU MUMU NO ÔNIBUS.', 'INTOLERÂNCIA À LACTOSE...', 'O PUM VIROU UMA ARRANCADA!'] },
    { id: 'bellySlam', after: 3, ready: true, name: 'BARRIGADA', motto: 'LICENÇA, PESSOAL!', practiceLevel: 3, tips: ['DESÇA SOBRE AS CAIXAS FRÁGEIS', 'OU APERTE OS BOTÕES NO CHÃO.', 'ATINJA INIMIGOS POR CIMA.'], story: ['NO ESCRITÓRIO, KINHU TROPEÇOU.', 'CAIU DE BARRIGA NAS CAIXAS...', 'E ABRIU CAMINHO NA PANCADA!'] },
    { id: 'steadyStep', after: 4, ready: true, name: 'PASSO FIRME', motto: 'VETERANO DO EXPEDIENTE', practiceLevel: 4, tips: ['30% MENOS RECUO E DESLIZAMENTO.', 'FUNCIONA SEM APERTAR BOTÃO.', 'CUIDADO COM ÁGUA ELETRIFICADA!'], story: ['DEPOIS DE TANTO EXPEDIENTE,', 'KINHU APRENDEU A FIRMAR OS PÉS.', 'ATÉ NO PISO ESCORREGADIO.'] },
  ],
  config: { doubleJumpImpulse: 6.6, propulsionBlocks: 3, propulsionFrames: 12, propulsionCooldown: 60, airPropulsions: 1, recoilReduction: 0.3, bellySpeed: 9, bossSlamInterval: 70 },
  blank() { return { completedLevels: 0, abilities: [], stories: {}, tutorials: [], pendingUnlocks: [] }; },
  sanitize(value, maxCompleted = 5) {
    const p = value && typeof value === 'object' ? value : {};
    const count = Number.isInteger(p.completedLevels) ? U.clamp(p.completedLevels, 0, maxCompleted) : 0;
    const ids = this.abilities.filter(a => a.after <= count).map(a => a.id);
    const list = v => ids.filter(id => Array.isArray(v) && v.includes(id));
    const tutorials = list(p.tutorials), stories = {};
    for (const id of ids) {
      const status = p.stories && p.stories[id];
      if (['seen', 'skipped', 'legacy'].includes(status)) stories[id] = status;
      else if (tutorials.includes(id)) stories[id] = 'legacy';
    }
    return { completedLevels: count, abilities: ids, stories, tutorials,
      pendingUnlocks: list(p.pendingUnlocks).filter(id => !stories[id]) };
  },
  legacy(level) {
    const p = this.sanitize({ completedLevels: level });
    for (const id of p.abilities) p.stories[id] = 'legacy';
    p.tutorials = p.abilities.slice(); return p;
  },
  migrateV2(value, maxCompleted) {
    const p = this.sanitize(value, maxCompleted);
    for (const id of p.abilities) if (!p.pendingUnlocks.includes(id)) p.stories[id] = p.stories[id] || 'legacy';
    return p;
  },
  complete(progress, level) {
    const before = this.sanitize(progress);
    const next = this.sanitize({ ...before, completedLevels: Math.max(before.completedLevels, level + 1) });
    for (const id of next.abilities) if (!before.abilities.includes(id)) next.pendingUnlocks.push(id);
    return next;
  },
  usable(progress, id) { return this.abilities.some(a => a.id === id && a.ready) && progress.abilities.includes(id); },
  nextUnlock(progress) { return this.abilities.find(a => a.ready && progress.pendingUnlocks.includes(a.id)) || null; },
  acknowledge(progress, id, skipped = false) {
    if (!this.usable(progress, id) || !progress.pendingUnlocks.includes(id)) return false;
    progress.pendingUnlocks = progress.pendingUnlocks.filter(item => item !== id);
    if (!progress.tutorials.includes(id)) progress.tutorials.push(id);
    progress.stories[id] = skipped ? 'skipped' : 'seen'; return true;
  },
  command(id, device = Input.device) {
    const jump = Input.label('jump', device);
    if (id === 'doubleJump') return jump + ' NOVAMENTE NO AR';
    if (id === 'propulsion') return Input.label('propel', device) + ': ARRANCADA';
    if (id === 'bellySlam') return Input.label('down', device) + ' + ' + jump + ' NO AR';
    return 'EFEITO PASSIVO';
  },
  feedback(id, device = Input.device) {
    const a = this.abilities.find(item => item.id === id);
    return a ? [a.name, a.motto, this.command(id, device)] : [];
  },
};
