# Transformação Kinhurine

Três ilustrações produzidas com a ferramenta integrada ImageGen. Referência de personagem e estilo: `01-home-office.png`; os dois quadros anteriores à pose final foram derivados de `kinhurine-roar.png` para manter o enquadramento.

Sequência de 240 quadros a 60 Hz (4 segundos): carga até o quadro 59, garras emergindo do 60 ao 107, grito e pose final do 108 ao 239. Três lâminas metálicas em cada mão. As pontas permanecem no enquadramento do grito. O jogo e o tempo de invencibilidade ficam congelados, e a mesma fase é retomada sem recarga. Efeitos sintetizados de carga, metal e rugido acompanham os cortes.

Originais nesta pasta; PNGs de distribuição em `runtime/`, preparados por `tools/prepare-cutscenes.js`. Cena em `js/kinhurine.js` e integração na coleta de `claws` em `js/game.js`.

## Prompts finais

### Revisão aprovada — encaixe entre os nós dos dedos

A versão final aprovada pelo usuário redesenha os punhos para mostrar quatro nós e uma lâmina em cada um dos três intervalos: indicador/médio, médio/anelar e anelar/mindinho. O quadro intermediário agora usa metade do comprimento das garras, mantendo os mesmos pontos de saída e a expressão de grito da imagem aprovada. As versões `kinhurine-roar.png` e `kinhurine-emerge.png` e seus derivados de distribuição foram atualizados com essas artes. Esta revisão substitui as orientações anteriores.

Prompt da pose final aprovada (ImageGen):

Redraw BOTH HANDS in this illustration to fix the anatomy. The rest of the picture remains the same.
Both hands should be unmistakable FOUR-KNUCKLE fists with three Wolverine-style steel claws coming out BETWEEN the finger knuckles. Show the four folded fingers as FOUR distinct rounded segments, and insert ONE blade at EACH of the THREE seams between them: index/middle, middle/ring, ring/pinky. The pinky must visibly remain as the fourth segment beyond the third claw. The thumbs fold below/behind, not counted as knuckles.
You are allowed and REQUIRED to change the hands' shapes, knuckle contours, finger creases and slightly adjust fist angle to make this perfectly clear. Do not preserve the faulty hand drawing or previous claw insertion positions. The current three claw roots are wrong; replace the fists and claws completely. Four knuckles with three blades between = 4 visible finger segments, 3 occupied seams, no empty seam. The claws should visually part the finger-knuckle silhouettes instead of being pins in the flat back of the hands.
Keep the fists large in foreground on both sides of the same roaring chubby bald man with side hair tufts, beard and glasses. Arms stay bent, orange shirt, belly, energy background, same camera. Blades point up-right on image left, up-left on image right. Beautiful narrow steel blades, not extra fingers. Detailed 1990s anime pixel art, crisp outlines and color clusters. No text.

Prompt do quadro intermediário (ImageGen, referência: pose final aprovada):

Make ONE precise change to this approved pixel-art illustration: retract all SIX metal claws to EXACTLY HALF their current extended length.
This image's hand anatomy and claw placement are APPROVED and must be preserved exactly. Do not redraw, move, rotate or reshape either fist, any finger or any knuckle. Keep every claw's BASE anchored at its exact current point BETWEEN the knuckles, including the blade between ring and little finger in each hand. Keep the exact current direction, angle, spacing and thickness of each blade.
For each blade, move its pointed TIP to the midpoint between its current root and its current tip, leaving the root unchanged. There are exactly THREE half-length blades on each hand, six total. Reconstruct the newly exposed background where the outer half of each blade used to be. Render a sharp point and matching blue-silver metallic highlights on each shortened blade.
Preserve everything else: the open-mouth roaring facial expression, glasses, hair tufts, beard, large round torso, orange shirt, arms, FOUR distinct knuckles per fist, golden aura, blue sparks, camera, colors, crisp pixel art and full-bleed 3:2 composition. This is the half-extended animation frame of the same exact scene, not a redesign. No text or labels.

### Histórico da correção anterior

Correção de posicionamento: a revisão com ImageGen usa as seis marcações brancas fornecidas pelo usuário como guia. As três lâminas de cada mão partem do dorso do punho e seguem o eixo do antebraço: no lado esquerdo da imagem, para cima e à direita; no lado direito, para cima e à esquerda. As raízes permanecem iguais entre o quadro intermediário e o grito. Os PNGs `kinhurine-emerge.png` e `kinhurine-roar.png` foram substituídos pelas versões corrigidas. Os prompts de correção abaixo prevalecem sobre as orientações anteriores.

### Correção final — grito

Precise local correction of an existing pixel-art game cutscene.
IMAGE 1 is the EDIT TARGET: preserve this roaring character, face, hair tufts, body, pose, fists, background, colors, pixel-art style and full-bleed 3:2 framing.
IMAGE 2 is the user's ANNOTATED GEOMETRY GUIDE. Its six white strokes specify the CORRECT claw roots, positions and directions. The white strokes are instructions to you, NOT marks to include in the final art.
Replace ONLY the six incorrectly oriented steel blades in image 1. First erase the old blades and their old root dots, restoring skin/background underneath. Render exactly three metallic claws per fist in the positions and directions indicated by the white strokes in image 2.
Critical geometry: on the fist at IMAGE LEFT, each claw projects diagonally UP AND TO THE RIGHT (toward the center), continuing the direction of that forearm. The three roots sit across the VISIBLE BACK OF THE FIST in a diagonal descending-right row, as shown by the three white stroke lower endpoints, NOT along the upper-left silhouette. Their tips extend into the space above and right of that fist.
On the fist at IMAGE RIGHT, each claw projects diagonally UP AND TO THE LEFT (toward the center), continuing the direction of that forearm. Three roots sit across the visible BACK OF THE FIST following the user's stroke endpoints, NOT the upper-right silhouette. Tips extend above and left of this fist.
Follow the white guide trajectories closely, but replace white scribbles with beautiful narrow pointed steel blades with crisp dark outlines, blue-gray metallic shadow, sharp white specular highlights. Three separated long blades on each hand, six total. Claws emerge naturally from the back of clenched hands aligned with the metacarpals. No handles, wounds or blood. Do not point them outwards toward the frame edges as in the old target. Do not copy the closed eyes/closed mouth from the guide: KEEP the furious open-mouth ROAR and wide eyes of image 1. No visible guide lines, no gray border. Change nothing else.

### Correção final — garras emergindo

Edit IMAGE 1 into the middle keyframe of this exact same pixel-art transformation. IMAGE 1 is the newly CORRECTED final roar pose and is authoritative for claw anatomy and layout. IMAGE 2 is only the previous middle keyframe's facial-expression reference; IGNORE its incorrect claw orientation completely.
Keep image 1's camera, body, fists, skin, clothes, hair tufts, background and composition unchanged. Make only these two changes:
1. Retract each of its six correctly positioned metal claws to approximately ONE QUARTER of its current length. Each root must remain at EXACTLY the same point on the visible back of the fist as image 1. Each short blade retains EXACTLY the same vector as the corresponding full blade in image 1: the three claws on IMAGE LEFT slope UP-RIGHT toward center; the three on IMAGE RIGHT slope UP-LEFT toward center. Three separate short pointed silver-blue metal blades per fist. Do not move roots to the opposite edge of the hand, do not change the fist pose, do not aim blades outward.
2. Kinhu's expression becomes eyes tightly closed and gritted teeth, as in image 2, anticipating the next roar frame.
Preserve precise detailed retro pixel art and rich gold/blue light. No blood, no words, no guides, no border. Landscape 3:2 full bleed. This is the exact same scene fractionally earlier, not a redraw.

## Prompts da primeira versão (histórico)

### kinhurine-roar

Create an original power-up transformation cutscene illustration for Kinhu's Adventure. The reference image establishes the EXACT Kinhu character and detailed 1990s anime PIXEL ART illustration style. Kinhu is a very chubby adult man, mostly bald with a short full brown beard, black rectangular glasses, orange T-shirt and navy shorts. At the climax of his KINHURINE power-up transformation, he ROARS furiously with his mouth wide open, brows fiercely lowered, looking intense and comically heroic. Two small wild dark hair tufts have sprung up at the sides of his otherwise bald head. Waist-up dramatic low-angle portrait, face large in upper center, both arms bent with TWO clenched fists prominently visible on either side of his chest. From the back of EACH clenched fist emerge EXACTLY THREE long slender shiny steel claws, six blades total, cleanly spaced and individually countable. Each blade emerges between the knuckle positions and extends beyond the fist in the direction of the fingers. Blades on left fist angle up-left; on right fist angle up-right; sharp silver metallic highlights, blue reflected shadow. These are retractable fantasy superhero metal claws extending from knuckles, NOT held weapons, not fingernails, no handles, no gloves, no skin wounds, no blood. Both fists anatomically readable, metal integrated cleanly with hands. Dynamic gold-orange energy aura with dark navy background, angular speed lines and sparse blue-white sparks. No room or house background: a stylized transformation-space power-up splash, all emphasis on face and both sets of 3 claws. Keep the same round large physique and orange shirt, do not make him muscular or thin. Premium hand-illustrated cel-shaded 1990s anime pixel art, crisp stepped dark outlines and colored pixel clusters, detailed expressive anatomy, matching reference quality, not tiny chibi sprites. Landscape 3:2 full bleed, no text, no logos, no border.

### kinhurine-charge

Edit this exact image into the FIRST frame of the SAME transformation. Preserve EXACT composition, camera, orange shirt, heavy round adult physique, fists positions, glasses, brown beard, and hand-illustrated pixel art. Kinhu is charging energy, both fists clenched, eyes tightly shut behind glasses, jaw clenched with gritted teeth instead of open roar. He is still BALD, without the wild hair tufts yet. There are NO CLAWS visible yet: remove ALL six metal blades completely, hands have normal unbroken skin with normal knuckles. Background is the same dark navy transformation space with a much dimmer thin golden aura just starting to build, fewer sparks, no bright eruption yet. Keep everything aligned to the original for a quick animation cut. Landscape 3:2, no words or border, same detailed 1990s anime pixel art.

### kinhurine-emerge

Edit this exact image into the MIDDLE keyframe of the SAME transformation. Preserve EXACT camera, composition, face identity, beard, orange shirt, very chubby adult build, fists positions and the rich sharp pixel art. The SIX steel claws are now only ONE QUARTER of their final length: EXACTLY THREE SHORT metal blades just beginning to protrude from EACH clenched fist's knuckles. Clearly separate the three short blades on each hand, no additional blades or held weapons, clean intact skin with no injury. His eyes squeeze shut and teeth are clenched as the metal emerges; only small wild hair tufts beginning at the sides of the bald head. Golden energy aura building, blue-white glints around the short emerging claws. Keep positioning aligned with the reference for an animation sequence; shorten the blades, do not move hands or body. Landscape 3:2, crisp detailed 1990s anime pixel illustration, no words, no border.

