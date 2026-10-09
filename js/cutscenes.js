'use strict';
/* Abertura em cinco planos. Arte em camadas, pixels inteiros e animação a 60 Hz.
   Tudo é local: também funciona no HTML único e sem conexão. */
const Cutscenes = {
  scene: 0, t: 0, done: false, built: false,
  lengths: [660, 720, 480, 540, 300],
  names: ['A VIDA ERA BOA', 'MENSAGEM DA EMPRESA', 'A ÚLTIMA NOITE', 'SÓ MAIS CINCO MINUTOS', 'CORRE, KINHU!'],
  captions: [
    [['PIZZA, CONOSQUINHOS E COCA.', 'HOME OFFICE ERA BOM DEMAIS.'], ['TRABALHAR? SÓ DE VEZ EM QUANDO.', 'ATÉ QUE CHEGOU UMA MENSAGEM...']],
    [['NÃO... O PRESENCIAL, NÃO!', 'QUEM VAI CUIDAR DO MEU SOFÁ?'], ['ACABOU O HOME OFFICE.', 'AMANHÃ, A VIDA SERIA DIFERENTE.']],
    [['O SOL SE FOI. A FICHA NÃO CAIU.', 'SÓ MAIS UMA NOITE DE SOSSEGO.'], ['ENQUANTO O BAIRRO ACORDAVA...', 'KINHU AINDA SONHAVA COM PIZZA.']],
    [['SEGUNDA-FEIRA. JÁ SÃO 07:42.', 'E O KINHU? BEM ESPARRAMADO.'], ['O ALARME TOCOU. E TOCOU DE NOVO.', 'EU TÔ MUITO ATRASADO!']],
    [['SEM TEMPO NEM PARA UM CONOSQUINHO.', 'AGORA É PEGAR O ÔNIBUS!'], ['DO CONFORTO DE CASA...', 'PARA A AVENTURA DO PRESENCIAL.']],
  ],
  begin() {
    IntroArt.preload(); this.scene = 0; this.t = 0; this.done = false;
    Sound.play('home', true);
  },
  finish() {
    if (this.done) return;
    this.done = true; Game.levelIdx = 0;
    App.go('play');
  },
  next() {
    if (this.done) return;
    if (this.scene === 4) { this.finish(); return; }
    this.scene++; this.t = 0; Input.clear();
    Sound.stop();
    if (this.scene === 2) Sound.play('night', true);
    if (this.scene === 4) Sound.fx('door');
  },
  update() {
    if (this.done || document.hidden) return;
    if (IntroArt.status === 'loading') {
      if (Input.pressed('back') || Input.pressed('start')) this.finish();
      return;
    }
    this.t++;
    // Enter também é confirm: avança. Esc, Start e B pulam toda a abertura.
    if (this.t > 20 && (Input.pressed('back') || (Input.pressed('start') && !Input.pressed('confirm')))) { this.finish(); return; }
    if (this.t > 20 && Input.pressed('confirm')) { this.next(); return; }
    const t = this.t;
    if (this.scene === 0 && t === 390) { Sound.stop(); Sound.fx('notification'); }
    if (this.scene === 1 && t === 112) Sound.fx('hurt');
    if (this.scene === 1 && t === 177) Sound.fx('thud');
    if (this.scene === 3 && t < 340 && t % 75 === 1) Sound.fx('alarm');
    if (this.scene === 3 && t === 340) Sound.fx('spring');
    if (this.scene === 4 && t > 60 && t < 230 && t % 16 === 0) Sound.fx('step');
    if (t >= this.lengths[this.scene]) this.next();
  },
  // Volume e sombras por faixas, sem antialiasing.
  oval(g, x, y, rx, ry, colors) {
    g.ellipse(x, y, rx, ry, (nx, ny) => colors[U.clamp(Math.floor((nx * 0.35 + ny * 0.65 + 1) * colors.length / 2), 0, colors.length - 1)]);
  },
  head(g, x, y, back = false, asleep = false) {
    const o = this.oval;
    o(g, x, y, 19, 23, ['#ffe1ac', '#edb17e', '#cf895e', '#a95e44']);
    g.ellipse(x - 18, y + 3, 4, 6, '#d99668'); g.ellipse(x + 18, y + 3, 4, 6, '#c07b53');
    g.ellipse(x - 5, y - 14, 8, 3, '#ffe8bd');
    g.rect(x - 18, y - 1, 3, 8, '#49302c'); g.rect(x + 15, y - 1, 3, 8, '#49302c');
    if (back) { g.ellipse(x, y + 17, 14, 5, '#b77552'); return; }
    o(g, x, y + 12, 17, 13, ['#684431', '#4d302b', '#30212a']);
    g.rect(x - 15, y - 3, 13, 10, '#251f32'); g.rect(x + 2, y - 3, 13, 10, '#251f32');
    g.rect(x - 13, y - 1, 9, 6, '#9bbfc7'); g.rect(x + 4, y - 1, 9, 6, '#9bbfc7');
    g.rect(x - 3, y, 6, 2, '#251f32');
    if (asleep) { g.line(x - 12, y + 3, x - 6, y + 3, '#332637'); g.line(x + 5, y + 3, x + 11, y + 3, '#332637'); }
    else { g.rect(x - 8, y, 2, 4, '#251f32'); g.rect(x + 8, y, 2, 4, '#251f32'); g.set(x - 12, y, '#e9f5ea'); g.set(x + 5, y, '#e9f5ea'); }
    g.ellipse(x, y + 7, 5, 4, '#efb681');
    g.rect(x - 5, y + 15, 10, 2, '#e7ae87'); g.rect(x - 3, y + 18, 6, 1, '#95624b');
  },
  pizza(g, x, y) {
    g.poly([[x, y], [x + 21, y + 3], [x + 11, y + 24]], '#6b382c');
    g.poly([[x + 2, y + 3], [x + 19, y + 5], [x + 11, y + 21]], '#ffc55f');
    g.line(x, y, x + 20, y + 3, '#ef9c43');
    g.ellipse(x + 8, y + 8, 3, 3, '#b94335'); g.ellipse(x + 13, y + 14, 2, 2, '#b94335');
    g.set(x + 13, y + 6, '#fff2a9'); g.set(x + 9, y + 17, '#fff2a9');
  },
  can(g, x, y) {
    g.rect(x, y, 11, 20, '#762e3a'); g.rect(x + 1, y + 2, 8, 16, '#d64c46');
    g.rect(x + 2, y + 2, 2, 16, '#f57c62'); g.rect(x + 1, y, 9, 2, '#d1d3cf');
    g.rect(x + 2, y + 19, 7, 1, '#bbb9ba'); g.line(x + 2, y + 12, x + 8, y + 8, '#fff0d6');
    g.line(x + 2, y + 14, x + 8, y + 10, '#fff0d6');
  },
  room(reverse = false) {
    const g = new Grid(256, 168), rng = U.rng(79);
    for (let y = 0; y < 124; y++) g.rect(0, y, 256, 1, ['#6b5874', '#79617e', '#8b6e89', '#967990'][Math.floor(y / 31)]);
    for (let x = 0; x < 256; x += 16) g.rect(x, 0, 1, 124, '#a28597');
    for (let n = 0; n < 700; n++) { const x = Math.floor(rng() * 256), y = Math.floor(rng() * 123); if ((x + y) % 2 === 0) g.set(x, y, '#92798e'); }
    g.rect(0, 120, 256, 6, '#45384f'); g.rect(0, 120, 256, 2, '#c89b91');
    g.rect(0, 126, 256, 42, '#805c55');
    for (let y = 130; y < 168; y += 10) { g.line(0, y, 255, y, '#563e46'); g.line(0, y + 1, 255, y + 1, '#a77d65'); for (let x = y % 30; x < 256; x += 49) g.line(x, y, x + 5, y + 9, '#563e46'); }
    // Janela, céu e cortinas com pregas.
    const wx = reverse ? 12 : 171;
    g.rect(wx - 4, 12, 70, 83, '#45394f'); g.rect(wx - 2, 14, 66, 79, '#e2bd9e');
    g.rect(wx + 2, 18, 58, 70, '#79bce0'); g.rect(wx + 2, 54, 58, 34, '#acdce5');
    g.ellipse(wx + 43, 33, 10, 10, '#fff0b2'); g.ellipse(wx + 22, 46, 13, 4, '#eff1dc');
    g.ellipse(wx + 12, 48, 10, 4, '#eff1dc');
    g.poly([[wx + 2, 83], [wx + 14, 67], [wx + 28, 78], [wx + 40, 60], [wx + 60, 78], [wx + 60, 89], [wx + 2, 89]], '#598c7a');
    g.rect(wx + 29, 18, 3, 72, '#e2bd9e'); g.rect(wx + 2, 54, 58, 3, '#e2bd9e');
    g.rect(wx - 6, 91, 76, 5, '#e8c2a2');
    for (const x of [wx - 8, wx + 59]) { g.rect(x, 10, 12, 83, '#425567'); g.rect(x + 2, 11, 3, 81, '#68858e'); g.rect(x + 8, 11, 2, 81, '#34475b'); }
    g.poly([[wx + 5, 96], [wx + 56, 96], [wx + 30, 167], [wx - 80, 167]], '#ae8970');
    // Caixas, roupas e pôster são colocados antes do personagem.
    g.rect(reverse ? 207 : 15, 25, 30, 40, '#3a3049');
    const px = reverse ? 209 : 17;
    g.rect(px, 27, 26, 36, '#cca173'); g.ellipse(px + 13, 42, 10, 10, '#ebbc6c');
    for (let i = 0; i < 5; i++) g.ellipse(px + 7 + i % 3 * 5, 37 + Math.floor(i / 3) * 8, 2, 2, '#aa4e40');
    g.rect(px + 4, 56, 18, 2, '#8b534d');
    g.poly([[12, 145], [21, 137], [35, 140], [42, 153], [28, 158], [16, 152]], '#4f637c');
    g.line(20, 142, 31, 151, '#7e97aa');
    g.poly([[204, 149], [226, 144], [237, 150], [219, 159]], '#d2ac85');
    g.line(210, 150, 227, 149, '#b05e48');
    g.rect(49, 148, 18, 7, '#d4b389'); g.rect(50, 148, 16, 2, '#f0d4a5');
    g.ellipse(83, 159, 12, 4, '#332f43'); g.ellipse(81, 157, 9, 3, '#8e5e54');
    if (reverse) {
      g.rect(60, 106, 146, 9, '#3d3044'); g.rect(58, 101, 151, 7, '#d0a176'); g.rect(60, 108, 147, 3, '#89634f');
      g.rect(66, 115, 6, 48, '#433347'); g.rect(193, 115, 6, 48, '#433347');
      g.rect(113, 91, 27, 10, '#313341'); g.rect(119, 76, 15, 22, '#454555');
      g.rect(82, 32, 98, 61, '#292b3e'); g.rect(84, 34, 94, 55, '#666478');
      g.rect(88, 38, 86, 47, '#b4d7d8'); g.rect(89, 39, 84, 7, '#4d7c8d');
      g.rect(93, 50, 76, 29, '#eee0c2'); g.rect(93, 50, 76, 5, '#bf5a50');
      for (let y = 60; y < 76; y += 5) g.rect(98, y, 62 - (y % 3) * 9, 1, '#836767');
      g.poly([[97, 96], [157, 96], [167, 103], [91, 103]], '#555163');
      for (let x = 99; x < 158; x += 5) g.rect(x, 98, 3, 2, '#b7b0ab');
      this.can(g, 186, 80);
    } else {
      g.rect(202, 108, 54, 30, '#45354c'); g.rect(200, 106, 56, 15, '#b3aba1');
      g.poly([[225, 108], [256, 109], [256, 139], [231, 138], [218, 119]], '#4e6b7e');
      g.line(236, 110, 231, 129, '#87a2a7');
    }
    return g;
  },
  seated(back = false, arms = false, bite = false) {
    const g = new Grid(104, 136);
    g.ellipse(52, 126, 42, 7, '#332d40');
    g.rect(48, 99, 7, 25, '#323444'); g.line(51, 120, 19, 128, '#222836'); g.line(51, 120, 82, 128, '#222836');
    for (const x of [17, 49, 80]) g.ellipse(x, 129, 5, 4, '#242a3a');
    g.rect(23, 29, 62, 75, '#252d3f'); g.rect(27, 31, 54, 69, '#3c4d61');
    g.rect(29, 34, 3, 53, '#658190');
    this.oval(g, 53, 78, 36, 34, ['#ffbf61', '#eb913e', '#d87532', '#a64c2c']);
    g.ellipse(52, 100, 29, 10, '#28394d');
    g.rect(27, 104, 16, 13, '#d29b70'); g.rect(65, 104, 16, 13, '#d29b70');
    g.ellipse(33, 119, 14, 6, '#273043'); g.ellipse(76, 119, 14, 6, '#273043');
    g.rect(23, 120, 21, 2, '#a0a7ae'); g.rect(66, 120, 21, 2, '#a0a7ae');
    if (arms) {
      g.poly([[25, 63], [12, 46], [5, 18], [15, 15], [22, 39], [39, 50]], '#dc965f');
      g.poly([[77, 59], [89, 44], [91, 15], [101, 17], [99, 51], [87, 68]], '#efb77e');
      g.ellipse(10, 14, 7, 10, '#f2c18b'); g.ellipse(96, 12, 7, 10, '#f2c18b');
      for (let x = 5; x < 16; x += 3) g.line(x, 6, x, 14, '#b57551');
      for (let x = 91; x < 101; x += 3) g.line(x, 4, x, 12, '#b57551');
    } else {
      this.oval(g, 24, 65, 10, 19, ['#f7c592', '#e0a270', '#b5734e']);
      this.oval(g, 82, 67, 10, 19, ['#f7c592', '#e0a270', '#b5734e']);
    }
    this.head(g, 53, 29, back);
    if (back) {
      g.rect(26, 67, 56, 38, '#263043'); g.rect(30, 69, 48, 32, '#3e4a5e');
      g.rect(33, 72, 3, 25, '#5c6978'); g.line(41, 98, 71, 98, '#252d3e');
    } else {
      // A caixa aberta está apoiada na barriga, não na mesa.
      g.poly([[22, 76], [69, 74], [84, 92], [27, 96]], '#6b4039');
      g.poly([[23, 76], [70, 76], [79, 89], [29, 92]], '#f2d0a1');
      g.poly([[24, 75], [21, 57], [66, 55], [70, 75]], '#bf8359');
      g.poly([[26, 72], [25, 59], [63, 58], [66, 72]], '#e5b889');
      this.oval(g, 51, 83, 21, 7, ['#ffda7c', '#eaa545', '#bf6c33']);
      for (const [x, y] of [[39, 82], [51, 79], [63, 83], [49, 86]]) g.ellipse(x, y, 3, 2, '#b44b36');
      g.line(49, 83, 66, 87, '#fff0a6');
      const dy = bite ? -7 : 0;
      g.poly([[78, 74], [92, 63 + dy], [79, 49 + dy], [72, 57 + dy], [80, 64 + dy], [70, 67]], '#e7aa78');
      this.pizza(g, 63, 40 + dy); g.ellipse(81, 55 + dy, 6, 5, '#efb886');
    }
    return g;
  },
  rotate(g, angle) {
    const out = new Grid(170, 174), c = Math.cos(angle), s = Math.sin(angle);
    // Rotação inversa por pixel, ancorada na base da cadeira (sem pixels suavizados).
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
      const dx = x - 84, dy = y - 135;
      const col = g.get(Math.round(dx * c + dy * s + 52), Math.round(-dx * s + dy * c + 122));
      if (col) out.set(x, y, col);
    }
    return out.canvas();
  },
  exterior(night) {
    const g = new Grid(256, 168), rng = U.rng(345);
    const sky = night ? ['#171d39', '#252c4c', '#39425c'] : ['#79b9d1', '#b1d5d8', '#f2d6ad'];
    for (let y = 0; y < 105; y++) { const k = y / 35, a = Math.min(2, Math.floor(k)); g.rect(0, y, 256, 1, sky[a]); if (a < 2) for (let x = 0; x < 256; x++) if (U.dither(x, y, k % 1)) g.set(x, y, sky[a + 1]); }
    if (night) for (let i = 0; i < 58; i++) g.set(Math.floor(rng() * 256), Math.floor(rng() * 66), '#cbd5cc');
    g.ellipse(212, 30, night ? 12 : 17, night ? 12 : 17, night ? '#e2e5cc' : '#fff1bf');
    if (night) g.ellipse(217, 26, 11, 11, '#252c4c');
    for (let i = 0; i < 3; i++) { const x = 18 + i * 76; g.ellipse(x, 33 + i * 10, 24, 4, night ? '#46506a' : '#f0e5d4'); }
    g.poly([[0, 92], [0, 77], [29, 58], [62, 78], [80, 68], [100, 90], [197, 91], [226, 66], [256, 78], [256, 120], [0, 120]], night ? '#343c55' : '#8fa6a0');
    g.rect(0, 111, 256, 35, night ? '#303f4a' : '#708e6a');
    // Casinha brasileira: telhado de cerâmica, reboco, portinha azul.
    g.rect(49, 68, 159, 79, night ? '#574b5b' : '#d5a17c');
    g.rect(54, 75, 148, 67, night ? '#6a5867' : '#efc39a');
    g.rect(54, 136, 148, 7, night ? '#4b4256' : '#b57d63');
    g.poly([[36, 77], [69, 39], [183, 39], [219, 77]], night ? '#443b50' : '#80454a');
    g.poly([[40, 71], [70, 37], [181, 37], [214, 71]], night ? '#70505e' : '#bc6b50');
    for (let y = 42; y < 72; y += 6) { g.line(70 - (y - 38) * 0.86, y, 181 + (y - 38) * 0.86, y, night ? '#493d52' : '#854549'); for (let x = 71 - (y - 38) * 0.7; x < 181 + (y - 38) * 0.7; x += 10) g.line(x, y - 4, x - 3, y, night ? '#926374' : '#e69a69'); }
    g.rect(37, 72, 180, 4, night ? '#372f46' : '#643d42');
    g.rect(144, 84, 34, 60, '#383249'); g.rect(147, 87, 27, 54, night ? '#354255' : '#5a8590');
    g.rect(150, 90, 20, 29, night ? '#2c394e' : '#416471'); g.rect(150, 124, 20, 14, night ? '#2c394e' : '#416471');
    g.rect(167, 118, 3, 3, '#f6c37d');
    g.rect(70, 89, 53, 36, '#4e3c4b'); g.rect(73, 92, 47, 29, night ? '#efc47e' : '#48627b');
    for (let x = 74; x < 119; x += 7) g.rect(x, 93, 3, 27, night ? '#c99165' : '#7a8e9a');
    g.rect(95, 90, 3, 34, '#a7857b'); g.rect(69, 124, 56, 4, night ? '#806777' : '#f6d4aa');
    g.rect(185, 100, 9, 6, night ? '#362f47' : '#a87660');
    for (let i = 0; i < 60; i++) { const x = 56 + Math.floor(rng() * 144), y = 80 + Math.floor(rng() * 60); if (g.get(x, y) === (night ? '#6a5867' : '#efc39a')) g.set(x, y, night ? '#7d6472' : '#deb08c'); }
    g.rect(0, 145, 256, 23, night ? '#424657' : '#b1aca0');
    for (let y = 148; y < 168; y += 7) for (let x = (y % 2) * 7; x < 256; x += 14) { g.rect(x, y, 12, 1, night ? '#737083' : '#e3d1b8'); g.rect(x, y + 1, 1, 5, night ? '#303a50' : '#7d807d'); }
    for (const x of [22, 227]) { g.rect(x, 133, 15, 14, night ? '#654853' : '#b9795d'); for (let j = 0; j < 9; j++) g.ellipse(x + 7 + (j % 3 - 1) * 5, 125 + Math.floor(j / 3) * 4, 6, 6, night ? '#314852' : '#4f7860'); }
    return g;
  },
  bedroom() {
    const g = this.room(false);
    g.rect(29, 86, 172, 56, '#352d43'); g.rect(33, 89, 164, 10, '#806378');
    g.poly([[36, 100], [175, 100], [213, 148], [33, 148]], '#dcc3a5');
    g.poly([[33, 147], [213, 147], [213, 161], [33, 161]], '#74627e');
    g.rect(38, 160, 7, 8, '#342b3e'); g.rect(199, 160, 7, 8, '#342b3e');
    g.ellipse(72, 112, 33, 12, '#eee0c5'); g.ellipse(72, 114, 28, 9, '#b5b6bd');
    // Corpo deitado atravessado na cama, braços e pernas esparramados.
    g.poly([[96, 113], [92, 94], [80, 82], [85, 77], [102, 88], [112, 112]], '#e9b385');
    g.ellipse(83, 79, 6, 5, '#f8ce99');
    this.oval(g, 127, 127, 44, 22, ['#ffbf67', '#ed9342', '#cc6b36', '#a94c35']);
    g.poly([[111, 130], [90, 144], [67, 148], [69, 156], [96, 153], [123, 140]], '#dea173');
    g.ellipse(67, 152, 7, 5, '#efbd8c');
    g.ellipse(160, 134, 20, 17, '#34465c');
    g.poly([[166, 123], [188, 117], [202, 131], [195, 139], [182, 132], [166, 139]], '#dca173');
    g.poly([[165, 142], [183, 145], [188, 160], [178, 165], [172, 152], [158, 151]], '#edb582');
    g.ellipse(200, 133, 9, 5, '#e9b98c'); g.ellipse(181, 162, 9, 5, '#e9b98c');
    this.head(g, 80, 110, false, true);
    g.poly([[124, 147], [148, 148], [158, 162], [130, 160]], '#59788b'); g.line(132, 150, 143, 157, '#9eb3b5');
    // Mesa de cabeceira em primeiro plano.
    g.rect(1, 126, 47, 7, '#cc9d7c'); g.rect(4, 133, 40, 29, '#795960');
    g.rect(7, 138, 34, 14, '#a3776c'); g.rect(21, 143, 7, 2, '#e9c396');
    return g;
  },
  runner(frame) {
    const g = new Grid(76, 100), p = [-1, 0, 1, 0][frame];
    const leg = (x, dx) => { g.poly([[x, 69], [x + 12, 71], [x + 14 + dx, 88], [x + 3 + dx, 92], [x - 2, 80]], '#e1a172'); g.ellipse(x + 11 + dx, 91, 12, 6, '#28354c'); g.rect(x + 4 + dx, 94, 16, 2, '#a0b3bb'); };
    leg(22, p * 13); leg(42, -p * 13);
    this.oval(g, 38, 59, 27, 24, ['#ffc76b', '#ed963f', '#cd6d32', '#a34d32']);
    g.ellipse(38, 77, 22, 7, '#31435b');
    g.poly([[20, 48], [9, 61 - p * 6], [3, 54 - p * 6], [14, 42]], '#e3a97b');
    g.poly([[55, 48], [64, 58 + p * 6], [73, 51 + p * 6], [74, 59 + p * 6], [62, 68 + p * 6], [50, 57]], '#f2bd88');
    this.head(g, 39, 26);
    g.rect(36, 43, 8, 4, '#342431'); g.rect(38, 43, 4, 1, '#fff0cd');
    return g.canvas();
  },
  build() {
    if (this.built) return;
    this.front = this.room().canvas(); this.rear = this.room(true).canvas();
    this.sit = [this.seated(false, false, false).canvas(), this.seated(false, false, true).canvas()];
    this.back = this.seated(true).canvas(); this.plead = this.seated(true, true).canvas();
    const falling = this.seated(true, true);
    this.fall = Array.from({ length: 10 }, (_, i) => this.rotate(falling, -i / 9 * 1.35));
    this.day = this.exterior(false).canvas(); this.night = this.exterior(true).canvas();
    this.bed = this.bedroom().canvas(); this.run = [0, 1, 2, 3].map(i => this.runner(i));
    const fg = new Grid(256, 168);
    fg.poly([[0, 120], [68, 120], [104, 168], [0, 168]], '#4c3949');
    fg.poly([[0, 117], [68, 117], [101, 161], [0, 161]], '#ad7960');
    for (let i = 0; i < 6; i++) fg.line(0, 125 + i * 6, 62 + i * 5, 125 + i * 6, '#c79471');
    fg.poly([[0, 54], [49, 66], [57, 133], [0, 123]], '#222a3c');
    fg.poly([[2, 59], [43, 69], [48, 121], [1, 114]], '#455167');
    fg.poly([[48, 68], [57, 64], [64, 128], [53, 134]], '#777c8a');
    fg.poly([[52, 72], [55, 71], [60, 124], [56, 126]], '#9cd9de');
    for (let y = 80; y < 105; y += 4) fg.line(7, y, 30, y + 5, '#2c354b');
    fg.rect(22, 126, 6, 19, '#303446'); fg.poly([[12, 145], [40, 145], [47, 149], [10, 149]], '#252b3c');
    this.can(fg, 67, 122);
    fg.ellipse(28, 157, 22, 6, '#d4ccc0');
    for (const [x, y] of [[14, 151], [23, 153], [32, 151], [41, 156]]) { fg.ellipse(x, y, 6, 3, '#ae6835'); fg.ellipse(x, y - 1, 5, 2, '#f6bc61'); fg.set(x - 2, y - 2, '#ffe29a'); }
    this.foreground = fg.canvas();
    this.built = true;
  },
  text(s, x, y, color = '#ffedc7', o = {}) { Font.draw(s, x, y, color, o); },
  notification(x, y, full) {
    ctx.fillStyle = '#292d44'; ctx.fillRect(x, y, full ? 232 : 126, full ? 102 : 27);
    ctx.fillStyle = '#de795c'; ctx.fillRect(x, y, full ? 232 : 126, 13);
    this.text('!  EMPRESA', x + 7, y + 3);
    if (!full) this.text('1 NOVA MENSAGEM', x + 7, y + 17, '#e8d9bd');
    else {
      this.text('ACABOU O HOME OFFICE,', 128, y + 27, '#ffe4a1', { align: 'center' });
      this.text('ESTEJA AMANHÃ', 128, y + 44, '#fff1d9', { align: 'center' });
      this.text('NA EMPRESA', 128, y + 61, '#fff1d9', { align: 'center' });
      this.text('LIDA ÀS 16:59', x + 8, y + 87, '#9caabc');
    }
  },
  drawScene() {
    const t = this.t;
    if (this.scene === 0) {
      ctx.drawImage(this.front, 0, 16);
      ctx.drawImage(this.sit[Math.floor(t / 45) % 2], 80, 44 + (t % 140 < 70 ? 0 : 1));
      ctx.drawImage(this.foreground, 0, 16);
      if (t >= 390) this.notification(120, 29, false);
    } else if (this.scene === 1) {
      // Câmera de trás; os quadros de rotação acompanham Kinhu E a cadeira.
      ctx.drawImage(this.rear, 0, 16);
      if (t < 70) ctx.drawImage(this.back, 79, 61);
      else if (t < 112) ctx.drawImage(this.plead, 79, 61 - Math.floor((t % 12) / 6));
      else if (t < 210) ctx.drawImage(this.fall[Math.min(9, Math.floor((t - 112) / 7))], 47, 48 + Math.min(28, Math.floor((t - 112) / 3)));
      if (t >= 177 && t < 215) this.text('TUM!', 54, 157, '#ffcf82', { scale: 2, outline: true });
      if (t >= 210) {
        const k = U.clamp((t - 210) / 75, 0, 1), sw = Math.round(U.lerp(256, 98, k)), sh = Math.round(U.lerp(168, 65, k));
        ctx.drawImage(this.rear, Math.round(82 * k), Math.round(30 * k), sw, sh, 0, 16, 256, 168);
        if (t >= 285) this.notification(12, 44, true);
      }
    } else if (this.scene === 2) {
      ctx.drawImage(this.day, 0, 16);
      const darkness = t < 180 ? U.clamp(t / 180, 0, 1) : t < 300 ? 1 : U.clamp((450 - t) / 150, 0, 1);
      ctx.save(); ctx.globalAlpha = darkness; ctx.drawImage(this.night, 0, 16); ctx.restore();
      this.text(t < 150 ? 'DOMINGO, 18:30' : t < 320 ? 'DOMINGO, 23:58' : 'SEGUNDA, 07:42', 12, 28, '#fff0cf', { outline: true });
      if (t > 205 && t < 300) { ctx.fillStyle = '#3b354d'; ctx.fillRect(73, 108, 47, 29); ctx.fillStyle = '#887385'; ctx.fillRect(95, 108, 3, 29); }
    } else if (this.scene === 3) {
      ctx.drawImage(this.bed, 0, 16);
      // Relógio legível faz parte da cena, à frente da mesa de cabeceira.
      const shake = t < 340 && t % 75 < 20 ? (t % 4 < 2 ? -1 : 1) : 0;
      ctx.fillStyle = '#272c3e'; ctx.fillRect(2 + shake, 121, 48, 22);
      ctx.fillStyle = '#171e30'; ctx.fillRect(5 + shake, 124, 42, 15);
      this.text('07:42', 8 + shake, 128, t % 40 < 30 ? '#ffa27e' : '#a45d5d');
      if (t < 340) this.text('Z', 105 + Math.floor(t % 100 / 12), 91 - Math.floor(t % 100 / 7), '#fff0cd', { outline: true });
      else {
        // Desperta com um corte de reação grande, preservando o enquadramento.
        if (!this.awake) { const g = new Grid(58, 61); this.head(g, 29, 28); g.rect(24, 44, 10, 6, '#382735'); this.awake = g.canvas(); }
        ctx.drawImage(this.awake, 51, 98);
        this.text('ATRASADO!', 130, 39, '#ffe1a0', { align: 'center', scale: 2, outline: true });
      }
    } else {
      ctx.drawImage(this.day, 0, 16);
      if (t > 28) { ctx.fillStyle = '#282c3f'; ctx.fillRect(147, 103, 27, 54); ctx.fillStyle = '#416471'; ctx.fillRect(169, 104, 5, 53); }
      if (t > 48) {
        const x = Math.round(133 + (t - 48) * 0.78), bounce = Math.floor(t / 6) % 2 * 2;
        ctx.drawImage(this.run[Math.floor(t / 6) % 4], x, 84 - bounce);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#eed9b3' : '#acaa9c'; ctx.fillRect(x - 7 - i * 7, 169 - ((t + i * 7) % 15), 7 - i, 3); }
      }
      this.text('07:42', 12, 28, '#fff0cf', { outline: true });
    }
  },
  draw() {
    ctx.fillStyle = '#141d30'; ctx.fillRect(0, 0, W, H);
    if (!IntroArt.draw(this.scene, this.t)) { this.build(); this.drawScene(); }
    // Letterbox cobre qualquer parte da animação que ultrapasse o plano.
    ctx.fillStyle = '#141d30'; ctx.fillRect(0, 0, W, 16); ctx.fillRect(0, 184, W, 40);
    this.text(String(this.scene + 1).padStart(2, '0') + ' / 05', 9, 5, '#d9a56d');
    this.text(this.names[this.scene], 248, 5, '#bbb9c6', { align: 'right' });
    const captionChange = this.scene === 2 ? 320 : this.lengths[this.scene] / 2;
    const lines = this.captions[this.scene][this.t >= captionChange ? 1 : 0];
    lines.forEach((line, i) => this.text(line, 128, 190 + i * 11, i ? '#f3e4c9' : '#efbe85', { align: 'center' }));
    if (IntroArt.status === 'fallback') this.text('ARTE NÃO CARREGADA: MODO SIMPLES', 128, 174, '#fff0d6', { align: 'center', outline: true });
    const touch = document.body.classList.contains('touch');
    const pad = Input.cur.start || (navigator.getGamepads && Array.from(navigator.getGamepads()).some(Boolean));
    this.text(touch ? 'TOQUE/A: AVANÇAR   START/B: PULAR' : pad ? 'A: AVANÇAR   START/B: PULAR' : 'ENTER/Z: AVANÇAR   ESC/X: PULAR', 128, 216, '#959caf', { align: 'center' });
    ctx.fillStyle = '#e4ae72';
    ctx.fillRect(0, 181, Math.floor(256 * this.t / this.lengths[this.scene]), 1);
    const fade = this.t < 18 ? 1 - this.t / 18 : this.t > this.lengths[this.scene] - 18 ? (this.t - this.lengths[this.scene] + 18) / 18 : 0;
    if (fade > 0 && IntroArt.status !== 'loading') { ctx.fillStyle = 'rgba(20,29,48,' + fade + ')'; ctx.fillRect(0, 16, 256, 168); }
  },
};
