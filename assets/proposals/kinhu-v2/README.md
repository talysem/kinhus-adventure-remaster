# Kinhu — visual aprovado e integrado

Conforme a revisão do usuário, a proposta parte do sprite original e conserva a barba, os óculos, o cabelo e a paleta. Remove boca/sorriso, aumenta a curva da barriga e transforma a calça em bermuda, com joelhos visíveis e os mesmos tênis.

Abra `preview.html` para comparar original e proposta, alternar poses, virar a direção e pausar a animação. A cena usa o cenário real em 256×224; o detalhe amplia cada pixel dez vezes. `comparacao.png` mostra o original na linha superior e a proposta na inferior, em repouso/corrida/pulo.

O visual foi aprovado e integrado ao gerador principal em `js/sprites.js`: 13 poses de 20×24 pixels, nas duas direções, cabeça do HUD, poderes e camisetas. As dimensões/âncora do sprite e a colisão do personagem permanecem iguais. `sprite.js` é apenas um alias histórico do gerador atual; não é carregado pelo jogo. `original.png` conserva o atlas anterior para comparação.

Para regenerar o atlas integrado e os PNGs: `node tools/preview-kinhu.js`. O gerador verifica dimensões, compara cabelo/óculos com o atlas histórico e renderiza ambas as versões no cenário real com a âncora atual do personagem. A prévia HTML continua disponível para comparar as poses.
