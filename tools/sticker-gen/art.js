// Original sticker artwork for the Love, Comedy and Romance packs.
// Every sticker is plain SVG on a 512x512 canvas; generate.js renders them.

const INK = '#3a1e2c';
const W = 512;

// Unit heart, roughly x -1..1, y -0.95..0.9.
const HEART_D =
  'M0 0.9 C -0.2 0.75 -1 0.25 -1 -0.3 C -1 -0.7 -0.65 -0.95 -0.35 -0.95 ' +
  'C -0.15 -0.95 0 -0.8 0 -0.65 C 0 -0.8 0.15 -0.95 0.35 -0.95 ' +
  'C 0.65 -0.95 1 -0.7 1 -0.3 C 1 0.25 0.2 0.75 0 0.9 Z';

const stroke = (w = 7) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function heart(cx, cy, s, fill, { sw = 7, rot = 0 } = {}) {
  return `<path d="${HEART_D}" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})"
    fill="${fill}" ${stroke(sw)} vector-effect="non-scaling-stroke"/>`;
}

function sparkle(x, y, r, fill = '#ffd166') {
  const k = r * 0.28;
  return `<path d="M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r}
    Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z" fill="${fill}" ${stroke(4)}/>`;
}

function drop(x, y, s, fill = '#7ad3ff', rot = 0) {
  return `<path d="M0 -22 C 8 -8 16 2 16 10 A 16 16 0 0 1 -16 10 C -16 2 -8 -8 0 -22 Z"
    transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" ${stroke(4)}
    vector-effect="non-scaling-stroke"/>`;
}

function bean(cx, cy, rx, ry, fill, rot = 0) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${stroke()}
    transform="rotate(${rot} ${cx} ${cy})"/>`;
}

// A limb drawn as an outlined, rounded stroke.
function limb(d, fill, w = 18) {
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 12}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
}

// ---- faces (local coordinates, eyes at x = +-28, mouth around y = 30) ----

function eye(kind, ex, body) {
  const m = ex < 0 ? -1 : 1; // side
  switch (kind) {
    case 'dot':
      return `<circle cx="${ex}" cy="0" r="9" fill="${INK}"/><circle cx="${ex + 3}" cy="-3" r="3" fill="#fff"/>`;
    case 'puppy':
      return `<circle cx="${ex}" cy="0" r="13" fill="${INK}"/><circle cx="${ex + 4}" cy="-4" r="5" fill="#fff"/>
        <circle cx="${ex - 4}" cy="5" r="2.5" fill="#fff"/>`;
    case 'happy':
      return `<path d="M${ex - 12} 5 Q${ex} -14 ${ex + 12} 5" fill="none" ${stroke(6)}/>`;
    case 'closed':
      return `<path d="M${ex - 12} -3 Q${ex} 11 ${ex + 12} -3" fill="none" ${stroke(6)}/>`;
    case 'heart':
      return heart(ex, 0, 15, '#e5383b', { sw: 4 });
    case 'shock':
      return `<circle cx="${ex}" cy="-2" r="16" fill="#fff" ${stroke(5)}/><circle cx="${ex}" cy="-2" r="6" fill="${INK}"/>`;
    case 'sleepy':
      return `<path d="M${ex - 13} 2 Q${ex} 8 ${ex + 13} 2" fill="none" ${stroke(6)}/>`;
    case 'side':
      return `<circle cx="${ex}" cy="0" r="14" fill="#fff" ${stroke(5)}/><circle cx="${ex + 7}" cy="3" r="6" fill="${INK}"/>
        <path d="M${ex - 14} 0 A 14 14 0 0 1 ${ex + 14} 0 Z" fill="${body}" ${stroke(5)}/>`;
    case 'laugh': // > <
      return `<path d="M${ex - 10 * m} -10 L${ex + 9 * m} 0 L${ex - 10 * m} 10" fill="none" ${stroke(6)}/>`;
    case 'x':
      return `<path d="M${ex - 9} -9 L${ex + 9} 9 M${ex + 9} -9 L${ex - 9} 9" ${stroke(6)}/>`;
    case 'none':
      return '';
    default:
      throw new Error(`unknown eye ${kind}`);
  }
}

function mouth(kind) {
  switch (kind) {
    case 'smile':
      return `<path d="M-16 26 Q0 42 16 26" fill="none" ${stroke(6)}/>`;
    case 'grin':
      return `<path d="M-20 22 Q0 54 20 22 Z" fill="${INK}" ${stroke(5)}/>
        <path d="M-10 38 Q0 30 10 38 Q0 46 -10 38 Z" fill="#ff7a8a"/>`;
    case 'laugh':
      return `<path d="M-30 16 Q0 72 30 16 Z" fill="${INK}" ${stroke(5)}/>
        <path d="M-15 44 Q0 32 15 44 Q0 56 -15 44 Z" fill="#ff7a8a"/>`;
    case 'o':
      return `<ellipse cx="0" cy="32" rx="9" ry="12" fill="${INK}"/>`;
    case 'bigo':
      return `<ellipse cx="0" cy="36" rx="16" ry="20" fill="${INK}"/><ellipse cx="0" cy="46" rx="9" ry="6" fill="#ff7a8a"/>`;
    case 'kiss':
      return `<path d="M-6 20 Q10 24 -2 31 Q10 38 -6 42" fill="none" ${stroke(6)}/>`;
    case 'tongue':
      return `<path d="M-6 38 L-6 46 A 8 8 0 0 0 10 46 L10 36 Z" fill="#ff7a8a" ${stroke(4)}/>
        <path d="M-20 28 Q0 44 20 28" fill="none" ${stroke(6)}/>`;
    case 'flat':
      return `<path d="M-14 32 L14 32" ${stroke(6)}/>`;
    case 'wavy':
      return `<path d="M-18 32 q6 -7 12 0 t12 0 t12 0" fill="none" ${stroke(5)}/>`;
    case 'smirk':
      return `<path d="M-12 32 Q6 36 18 22" fill="none" ${stroke(6)}/>`;
    case 'frown':
      return `<path d="M-13 36 Q0 24 13 36" fill="none" ${stroke(6)}/>`;
    case 'grimace':
      return `<rect x="-22" y="22" width="44" height="20" rx="8" fill="#fff" ${stroke(5)}/>
        <path d="M-22 32 H22 M-8 22 V42 M8 22 V42" ${stroke(3)}/>`;
    default:
      throw new Error(`unknown mouth ${kind}`);
  }
}

function face(cx, cy, s, { eyes = 'dot', mouth: m = 'smile', blush = true, body = '#fff', rot = 0, spread = 28 } = {}) {
  const [le, re] = Array.isArray(eyes) ? eyes : [eyes, eyes];
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
    ${blush ? `<ellipse cx="${-spread - 20}" cy="22" rx="13" ry="8" fill="#ff5c8a" opacity="0.55"/>
               <ellipse cx="${spread + 20}" cy="22" rx="13" ry="8" fill="#ff5c8a" opacity="0.55"/>` : ''}
    ${eye(le, -spread, body)}${eye(re, spread, body)}${mouth(m)}
  </g>`;
}

function sunglasses(cx, cy, s) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M-62 -12 H62" ${stroke(7)}/>
    <path d="M-56 -14 H-8 L-12 10 Q-14 22 -30 22 Q-50 22 -54 8 Z" fill="${INK}" ${stroke(5)}/>
    <path d="M56 -14 H8 L12 10 Q14 22 30 22 Q50 22 54 8 Z" fill="${INK}" ${stroke(5)}/>
    <path d="M-44 -6 L-34 -6" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 -6 L30 -6" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// Crescent from two overlapping circles: outer (cx,cy,R), cut-out (cx2,cy2,r).
function crescent(cx, cy, R, cx2, cy2, r, fill) {
  const dx = cx2 - cx, dy = cy2 - cy, d = Math.hypot(dx, dy);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const px = cx + (a * dx) / d, py = cy + (a * dy) / d;
  const p1 = [px + (h * dy) / d, py - (h * dx) / d];
  const p2 = [px - (h * dy) / d, py + (h * dx) / d];
  const f = (n) => n.toFixed(1);
  return `<path d="M${f(p1[0])} ${f(p1[1])} A ${R} ${R} 0 1 0 ${f(p2[0])} ${f(p2[1])}
    A ${r} ${r} 0 0 1 ${f(p1[0])} ${f(p1[1])} Z" fill="${fill}" ${stroke()}/>`;
}

function textCap(str, y, fill, size = 84) {
  return `<text class="cap" x="${W / 2}" y="${y}" font-size="${size}" fill="${fill}">${str}</text>`;
}

// ---------------------------------------------------------------- packs

const RED = '#ff4d6d', PINK = '#ff8fab', BLUSH = '#ffb3c6';
const SUN = '#ffd23f', LILAC = '#bdb2ff', ROSE = '#ffafcc';

const love = {
  identifier: 'love',
  name: 'Love Bites',
  version: '1', // bump after changing any sticker so WhatsApp refreshes the pack
  accent: '#ff3d68',
  trayFrom: 0,
  stickers: [
    {
      file: '01_love_you', text: 'LOVE YOU', emojis: ['❤️', '😍'],
      alt: 'A smiling red heart with rosy cheeks says love you',
      art: () => `${heart(92, 96, 30, PINK)}${heart(430, 120, 22, BLUSH, { rot: 15 })}${heart(424, 316, 18, PINK, { rot: -10 })}
        ${heart(256, 220, 150, RED)}${face(256, 210, 1.6, { eyes: 'happy', mouth: 'grin' })}`,
    },
    {
      file: '02_hugs', text: 'HUGS', emojis: ['🤗', '❤️'],
      alt: 'A big heart hugs a little pink heart',
      art: () => `${heart(338, 250, 88, BLUSH, { rot: 10 })}${face(338, 236, 0.95, { eyes: 'happy', mouth: 'smile' })}
        ${heart(206, 222, 128, RED, { rot: -8 })}${face(200, 206, 1.25, { eyes: 'closed', mouth: 'smile' })}
        ${limb('M278 270 Q340 340 392 262', RED)}`,
    },
    {
      file: '03_crushing', text: 'CRUSHING', emojis: ['😍', '💘'],
      alt: 'A pink heart with heart-shaped eyes is crushing',
      art: () => `${sparkle(96, 120, 26)}${sparkle(418, 92, 20)}${sparkle(430, 300, 16, '#fff')}
        ${heart(256, 220, 150, PINK)}${face(256, 210, 1.6, { eyes: 'heart', mouth: 'grin' })}`,
    },
    {
      file: '04_miss_you', text: 'MISS YOU', emojis: ['🥺', '💔'],
      alt: 'A sad little heart with puppy eyes and a tear says miss you',
      art: () => `${heart(256, 220, 140, PINK)}${face(256, 210, 1.55, { eyes: 'puppy', mouth: 'wavy' })}
        ${drop(186, 262, 1.1, '#7ad3ff')}`,
    },
    {
      file: '05_xoxo', text: 'XOXO', emojis: ['😘', '💋'],
      alt: 'A heart blows a kiss with a tiny heart',
      art: () => `${heart(256, 220, 145, RED)}${face(240, 210, 1.55, { eyes: 'closed', mouth: 'kiss' })}
        ${heart(386, 236, 26, BLUSH, { rot: 20 })}${heart(424, 176, 18, PINK, { rot: 30 })}`,
    },
    {
      file: '06_aww', text: 'AWW', emojis: ['🥰', '☺️'],
      alt: 'A blushing pale pink heart covers its cheeks and says aww',
      art: () => `${heart(256, 220, 150, BLUSH)}
        ${face(256, 206, 1.6, { eyes: 'happy', mouth: 'o' })}
        <ellipse cx="160" cy="250" rx="34" ry="22" fill="#ff5c8a" opacity="0.6"/>
        <ellipse cx="352" cy="250" rx="34" ry="22" fill="#ff5c8a" opacity="0.6"/>
        <circle cx="150" cy="268" r="22" fill="${BLUSH}" ${stroke()}/><circle cx="362" cy="268" r="22" fill="${BLUSH}" ${stroke()}/>
        ${sparkle(98, 100, 22)}${sparkle(420, 96, 22)}`,
    },
    {
      file: '07_ouch', text: 'OUCH!', emojis: ['💔', '🤕'],
      alt: 'A cracked heart with a bandage and dizzy eyes says ouch',
      art: () => `${heart(256, 220, 150, RED)}
        <path d="M256 92 L236 150 L272 196 L240 250 L262 300" fill="none" ${stroke(7)}/>
        <g transform="rotate(-28 330 150)"><rect x="276" y="128" width="110" height="44" rx="14" fill="#ffe0b3" ${stroke(6)}/>
          <rect x="312" y="132" width="38" height="36" fill="#ffd08a"/>
          <circle cx="322" cy="142" r="3" fill="${INK}"/><circle cx="340" cy="158" r="3" fill="${INK}"/></g>
        ${face(256, 226, 1.4, { eyes: 'x', mouth: 'wavy', blush: false })}`,
    },
    {
      file: '08_youre_mine', text: 'YOU’RE MINE', emojis: ['😉', '👑'],
      alt: 'A winking heart wearing a gold crown says you are mine',
      art: () => `${heart(256, 236, 140, RED)}${face(256, 230, 1.5, { eyes: ['dot', 'happy'], mouth: 'smirk' })}
        <path d="M196 116 L206 56 L236 90 L256 44 L276 90 L306 56 L316 116 Z" fill="#ffd166" ${stroke(7)}/>
        <circle cx="256" cy="98" r="9" fill="${PINK}" ${stroke(4)}/>`,
    },
  ],
};

const comedy = {
  identifier: 'comedy',
  name: 'LOL Beans',
  version: '1', // bump after changing any sticker so WhatsApp refreshes the pack
  accent: '#ffb703',
  trayFrom: 0,
  stickers: [
    {
      file: '01_lol', text: 'LOL', emojis: ['😂', '🤣'],
      alt: 'A yellow bean laughs so hard it cries',
      art: () => `${bean(256, 220, 150, 140, SUN, -8)}${face(256, 196, 1.9, { eyes: 'laugh', mouth: 'laugh', rot: -8 })}
        ${drop(86, 170, 1.4, '#7ad3ff', -50)}${drop(426, 150, 1.4, '#7ad3ff', 50)}${drop(70, 240, 1, '#7ad3ff', -70)}`,
    },
    {
      file: '02_rofl', text: 'ROFL', emojis: ['🤣', '😆'],
      alt: 'A yellow bean rolls on the floor laughing',
      art: () => `<path d="M60 330 H452" ${stroke(7)}/>
        <path d="M70 160 q14 -14 28 0 M60 200 q14 -14 28 0 M424 150 q14 -14 28 0" fill="none" ${stroke(5)}/>
        ${bean(256, 236, 170, 100, SUN, 0)}${face(256, 224, 1.55, { eyes: 'laugh', mouth: 'laugh', rot: 90 })}
        ${drop(196, 98, 1.2, '#7ad3ff', -20)}${drop(316, 92, 1.2, '#7ad3ff', 20)}`,
    },
    {
      file: '03_oops', text: 'OOPS!', emojis: ['😬', '😅'],
      alt: 'A yellow bean grimaces with a sweat drop and says oops',
      art: () => `${bean(256, 220, 150, 140, SUN)}${face(256, 200, 1.8, { eyes: 'dot', mouth: 'grimace', blush: false })}
        ${drop(380, 140, 1.5, '#7ad3ff', 10)}`,
    },
    {
      file: '04_cool_story', text: 'COOL STORY', emojis: ['😎', '🙄'],
      alt: 'A yellow bean in sunglasses smirks and says cool story',
      art: () => `${bean(256, 220, 150, 140, SUN)}${sunglasses(256, 184, 1.7)}
        ${face(256, 200, 1.8, { eyes: 'none', mouth: 'smirk', blush: false })}
        ${sparkle(416, 96, 24, '#fff')}`,
    },
    {
      file: '05_what', text: 'WHAT?!', emojis: ['😳', '😲'],
      alt: 'A shocked yellow bean with wide eyes says what',
      art: () => `${bean(256, 224, 156, 132, SUN)}${face(256, 196, 1.8, { eyes: 'shock', mouth: 'bigo', blush: false })}
        <text class="mark" x="80" y="150" font-size="96" fill="#fff" transform="rotate(-18 80 150)">?</text>
        <text class="mark" x="432" y="140" font-size="96" fill="#fff" transform="rotate(16 432 140)">!</text>`,
    },
    {
      file: '06_jk', text: 'JK', emojis: ['😜', '😝'],
      alt: 'A yellow bean winks and sticks out its tongue',
      art: () => `${bean(256, 220, 150, 140, SUN, 6)}${face(256, 200, 1.8, { eyes: ['dot', 'happy'], mouth: 'tongue', rot: 6 })}
        ${sparkle(92, 110, 22, '#fff')}`,
    },
    {
      file: '07_bored', text: 'BORED', emojis: ['😴', '🥱'],
      alt: 'A sleepy pale yellow bean is bored',
      art: () => `${bean(256, 236, 150, 124, '#ffe58a')}${face(256, 220, 1.8, { eyes: 'sleepy', mouth: 'flat', blush: false })}
        <text class="mark" x="390" y="120" font-size="56" fill="#fff">z</text>
        <text class="mark" x="428" y="76" font-size="72" fill="#fff">Z</text>`,
    },
    {
      file: '08_sus', text: 'SUS', emojis: ['🤨', '👀'],
      alt: 'A yellow bean gives a suspicious side eye',
      art: () => `${bean(256, 220, 150, 140, SUN)}${face(256, 196, 1.8, { eyes: 'side', mouth: 'flat', blush: false, body: SUN })}
        <path d="M182 128 L230 140 M282 140 L330 124" ${stroke(7)}/>`,
    },
  ],
};

function couple(lx, rx, y, opts = {}) {
  const { lFace = {}, rFace = {}, lean = 0 } = opts;
  return `${bean(lx, y, 88, 100, ROSE, -lean)}${bean(rx, y, 88, 100, LILAC, lean)}
    ${face(lx + (lFace.dx || 0), y - 10, 1.05, { eyes: 'happy', mouth: 'smile', ...lFace })}
    ${face(rx + (rFace.dx || 0), y - 10, 1.05, { eyes: 'happy', mouth: 'smile', ...rFace })}`;
}

const romance = {
  identifier: 'romance',
  name: 'Sweet Nothings',
  version: '1', // bump after changing any sticker so WhatsApp refreshes the pack
  accent: '#9d4edd',
  trayFrom: 0,
  stickers: [
    {
      file: '01_together', text: 'TOGETHER', emojis: ['💑', '🥰'],
      alt: 'A pink bean and a lilac bean hold hands under a heart',
      art: () => `${heart(256, 90, 40, RED)}${couple(166, 346, 250)}
        ${limb('M236 290 Q256 310 276 290', ROSE, 16)}`,
    },
    {
      file: '02_mwah', text: 'MWAH', emojis: ['😘', '💏'],
      alt: 'Two beans share a kiss with a little heart above',
      art: () => `${heart(256, 96, 34, RED)}${sparkle(150, 110, 18)}${sparkle(366, 110, 18)}
        ${couple(178, 334, 254, { lean: 8, lFace: { eyes: 'closed', mouth: 'kiss', dx: 26 }, rFace: { eyes: 'closed', mouth: 'kiss', dx: -26 } })}`,
    },
    {
      file: '03_for_you', text: 'FOR YOU', emojis: ['🌹', '💐'],
      alt: 'A shy lilac bean offers a red rose',
      art: () => `${bean(186, 250, 100, 112, LILAC)}${face(176, 236, 1.2, { eyes: 'closed', mouth: 'smile' })}
        <path d="M268 280 Q320 220 352 140" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
        <path d="M268 280 Q320 220 352 140" fill="none" stroke="#52b788" stroke-width="8" stroke-linecap="round"/>
        <path d="M318 214 Q360 206 372 236 Q330 244 318 214 Z" fill="#52b788" ${stroke(5)}/>
        <circle cx="356" cy="122" r="50" fill="#e5383b" ${stroke()}/>
        <path d="M356 122 m-6 -4 a 8 8 0 1 1 10 10 a 18 18 0 1 1 -24 -22 a 30 30 0 1 1 40 34" fill="none" ${stroke(5)}/>
        ${limb('M262 270 Q276 290 290 268', LILAC, 16)}${sparkle(440, 70, 18)}`,
    },
    {
      file: '04_good_night', text: 'GOOD NIGHT', emojis: ['🌙', '😴'],
      alt: 'A sleeping crescent moon among twinkling stars says good night',
      art: () => `${sparkle(366, 110, 24)}${sparkle(420, 240, 18, '#fff')}${sparkle(330, 320, 14)}
        ${heart(430, 150, 20, PINK, { rot: 14 })}
        ${crescent(236, 220, 150, 316, 180, 128, '#ffe8a3')}
        ${face(150, 230, 0.85, { eyes: 'closed', mouth: 'smile', spread: 24 })}`,
    },
    {
      file: '05_date', text: 'DATE?', emojis: ['☕', '💕'],
      alt: 'Two smiling coffee cups clink together with heart-shaped steam',
      art: () => `${[[176, -12, ROSE], [336, 12, LILAC]].map(([x, r, c]) => `<g transform="rotate(${r} ${x} 260)">
          <path d="M${x + 58} 220 q40 0 40 34 q0 34 -46 34" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
          <path d="M${x + 58} 220 q40 0 40 34 q0 34 -46 34" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
          <path d="M${x - 72} 180 H${x + 72} L${x + 58} 330 Q${x} 346 ${x - 58} 330 Z" fill="${c}" ${stroke()}/>
          ${face(x, 250, 1, { eyes: 'happy', mouth: 'smile' })}</g>`).join('')}
        ${heart(214, 110, 26, PINK, { rot: -12 })}${heart(300, 82, 32, RED, { rot: 10 })}`,
    },
    {
      file: '06_forever', text: 'FOREVER', emojis: ['💍', '💖'],
      alt: 'An open ring box shows a sparkling diamond ring',
      art: () => `<path d="M136 150 L376 150 L360 70 L152 70 Z" fill="#c9184a" ${stroke()}/>
        <path d="M160 140 L352 140 L342 84 L170 84 Z" fill="#ff8fab" ${stroke(5)}/>
        <rect x="120" y="200" width="272" height="140" rx="24" fill="#c9184a" ${stroke()}/>
        <rect x="150" y="200" width="212" height="36" rx="14" fill="#590d22" ${stroke(5)}/>
        <circle cx="256" cy="208" r="44" fill="none" stroke="${INK}" stroke-width="22"/>
        <circle cx="256" cy="208" r="44" fill="none" stroke="#ffd166" stroke-width="10"/>
        <path d="M226 162 L240 140 H272 L286 162 L256 186 Z" fill="#bde0fe" ${stroke(5)}/>
        ${sparkle(110, 120, 22, '#fff')}${sparkle(410, 120, 26)}${sparkle(420, 300, 16, '#fff')}`,
    },
    {
      file: '07_thinking_of_you', text: 'THINKING OF YOU', emojis: ['💭', '💗'],
      alt: 'A dreamy pink bean thinks about a heart',
      art: () => `${bean(176, 270, 100, 108, ROSE)}${face(176, 258, 1.2, { eyes: 'closed', mouth: 'smile' })}
        <circle cx="270" cy="170" r="12" fill="#fff" ${stroke(5)}/><circle cx="298" cy="138" r="18" fill="#fff" ${stroke(5)}/>
        <ellipse cx="370" cy="96" rx="80" ry="62" fill="#fff" ${stroke()}/>
        ${heart(370, 98, 36, RED)}`,
    },
    {
      file: '08_always', text: 'ALWAYS', emojis: ['🎈', '❤️'],
      alt: 'A lilac bean holds a heart-shaped balloon',
      art: () => `<path d="M284 238 Q296 206 326 178" fill="none" ${stroke(4)}/>
        ${heart(336, 116, 70, RED, { rot: 10 })}<path d="M318 112 q8 -24 30 -26" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
        ${bean(176, 280, 98, 104, LILAC)}${face(176, 268, 1.2, { eyes: 'happy', mouth: 'grin' })}
        ${limb('M256 278 Q280 266 284 242', LILAC, 16)}`,
    },
  ],
};


// ---- props for the dialogue pack ----

function clock(x, y, r) {
  return `<circle cx="${x - r * 0.7}" cy="${y - r * 0.85}" r="${r * 0.32}" fill="#ffd166" ${stroke(5)}/>
    <circle cx="${x + r * 0.7}" cy="${y - r * 0.85}" r="${r * 0.32}" fill="#ffd166" ${stroke(5)}/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${stroke()}/>
    <path d="M${x} ${y} V${y - r * 0.6} M${x} ${y} L${x + r * 0.45} ${y + r * 0.2}" ${stroke(6)}/>`;
}

function pizza(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-40 -46 Q0 -62 40 -46 L0 56 Z" fill="#ffd166" ${stroke(6)}/>
    <path d="M-40 -46 Q0 -62 40 -46 L36 -34 Q0 -48 -36 -34 Z" fill="#e09f3e" ${stroke(5)}/>
    <circle cx="-8" cy="-16" r="8" fill="#e5383b"/><circle cx="12" cy="4" r="7" fill="#e5383b"/><circle cx="-2" cy="24" r="6" fill="#e5383b"/>
  </g>`;
}

function phone(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="-34" y="-60" width="68" height="120" rx="12" fill="#3a3a5a" ${stroke(6)}/>
    <rect x="-26" y="-48" width="52" height="92" rx="5" fill="#cde7ff"/>
    <rect x="-20" y="-38" width="36" height="12" rx="6" fill="#fff"/>
    <path d="M2 -10 l6 6 l10 -12 M10 -10 l6 6 l10 -12" fill="none" stroke="#2b8cff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function cup(x, y, s, fill, steam = true) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${steam ? `<path d="M-14 -66 q-10 -14 0 -28 M14 -66 q-10 -14 0 -28" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` : ''}
    <path d="M40 -30 q32 0 32 24 q0 24 -38 24" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
    <path d="M40 -30 q32 0 32 24 q0 24 -38 24" fill="none" stroke="${fill}" stroke-width="8" stroke-linecap="round"/>
    <path d="M-48 -50 H48 L38 44 Q0 56 -38 44 Z" fill="${fill}" ${stroke(6)}/>
    <path d="M-44 -38 H44" stroke="#8d5524" stroke-width="10"/>
  </g>`;
}

function note(x, y, s, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="-34" y="-20" width="68" height="40" rx="6" fill="#95d5b2" ${stroke(5)}/>
    <circle cx="0" cy="0" r="10" fill="#d8f3dc" ${stroke(4)}/>
    <path d="M-34 -6 q-24 -24 -40 -6 q16 -2 40 14 M34 -6 q24 -24 40 -6 q-16 -2 -40 14" fill="#fff" ${stroke(4)}/>
  </g>`;
}

function flower(x, y, s) {
  const petals = [0, 72, 144, 216, 288].map((a) =>
    `<ellipse cx="0" cy="-16" rx="10" ry="15" fill="#ffafcc" ${stroke(4)} transform="rotate(${a})"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 V70" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M0 0 V70" stroke="#52b788" stroke-width="6" stroke-linecap="round"/>
    ${petals}<circle cx="0" cy="0" r="10" fill="#ffd166" ${stroke(4)}/></g>`;
}

function bowl(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-56 -20 Q-30 -64 0 -50 Q30 -64 56 -20 Z" fill="#ffd166" ${stroke(6)}/>
    <circle cx="-18" cy="-36" r="5" fill="#e09f3e"/><circle cx="14" cy="-40" r="5" fill="#e09f3e"/><circle cx="2" cy="-28" r="4" fill="#52b788"/>
    <path d="M-66 -20 H66 Q60 40 0 40 Q-60 40 -66 -20 Z" fill="#c9184a" ${stroke(6)}/>
  </g>`;
}

const SUNNY = (extra = '', faceOpts = {}, beanFill = SUN) =>
  `${bean(256, 236, 150, 140, beanFill)}${face(256, 214, 1.8, faceOpts)}${extra}`;

// Original lines in English, Hinglish and Telugu (written in English letters).
// None of them are quotes from films.
const dialogues = {
  identifier: 'dialogues',
  name: 'Filmy Dialogues',
  version: '1',
  accent: '#f77f00',
  trayFrom: 8,
  stickers: [
    {
      file: '01_late', bubble: ['Main late nahi hoon...', 'time hi jaldi aa gaya!'], emojis: ['⏰', '😅'],
      alt: 'A bean holding a clock says I am not late, time came early',
      art: () => SUNNY(clock(410, 150, 62), { eyes: 'dot', mouth: 'grimace', blush: false }),
    },
    {
      file: '02_diet', bubble: ['Diet starts tomorrow.', 'Every tomorrow.'], emojis: ['🍕', '😋'],
      alt: 'A bean happily holds pizza and says diet starts tomorrow',
      art: () => SUNNY(pizza(410, 220, 1.4, 20), { eyes: 'happy', mouth: 'tongue' }),
    },
    {
      file: '03_busy', bubble: ['Nenu busy...', 'kaani nee kosam', 'always free!'], emojis: ['😉', '❤️'],
      alt: 'A winking heart says I am busy but always free for you',
      art: () => `${heart(256, 230, 150, RED)}${face(256, 220, 1.6, { eyes: ['dot', 'happy'], mouth: 'smirk' })}`,
    },
    {
      file: '04_seen', bubble: ['Seen karke reply nahi?', 'Ab drama hoga!'], emojis: ['📱', '😤'],
      alt: 'A shocked bean stares at a phone that shows a seen message',
      art: () => SUNNY(phone(410, 210, 1.3, 12), { eyes: 'shock', mouth: 'bigo', blush: false }),
    },
    {
      file: '05_meeting', bubble: ['In a meeting...', 'with my bed.'], emojis: ['😴', '🛏️'],
      alt: 'A sleepy bean tucked under a blanket says it is in a meeting with its bed',
      art: () => `<rect x="70" y="150" width="160" height="70" rx="30" fill="#fff" ${stroke()}/>
        ${bean(220, 220, 130, 110, '#ffe58a', -12)}${face(206, 200, 1.6, { eyes: 'sleepy', mouth: 'smile', rot: -12 })}
        <path d="M60 260 Q256 220 470 270 L470 360 Q256 380 60 360 Z" fill="${LILAC}" ${stroke()}/>
        <text class="mark" x="420" y="150" font-size="70" fill="#fff">Z</text>`,
    },
    {
      file: '06_chai', bubble: ['Ek cup chai...', 'aur sab problems solved.'], emojis: ['☕', '😌'],
      alt: 'A calm bean with a cup of chai says all problems are solved',
      art: () => SUNNY(cup(410, 260, 1.2, '#fff'), { eyes: 'closed', mouth: 'smile' }),
    },
    {
      file: '07_cute', bubble: ['Babu, nuvvu', 'chala cute!'], emojis: ['🥰', '😍'],
      alt: 'A blushing heart with heart eyes says you are very cute',
      art: () => `${sparkle(90, 110, 24)}${sparkle(420, 96, 20)}${heart(256, 230, 150, PINK)}
        ${face(256, 220, 1.6, { eyes: 'heart', mouth: 'grin' })}`,
    },
    {
      file: '08_salary', bubble: ['Salary aayi...', 'aur gayi.'], emojis: ['💸', '😭'],
      alt: 'A crying bean watches its money fly away',
      art: () => SUNNY(`${note(410, 110, 1.1, -14)}${note(100, 150, 0.9, 12)}
        ${drop(178, 268, 1.2)}${drop(334, 268, 1.2)}`, { eyes: 'closed', mouth: 'frown', blush: false }),
    },
    {
      file: '09_mass', bubble: ['Mood:', 'full mass!'], emojis: ['😎', '🔥'],
      alt: 'A cool bean in sunglasses says the mood is full mass',
      art: () => `${bean(256, 236, 150, 140, SUN)}${sunglasses(256, 200, 1.7)}${face(256, 214, 1.8, { eyes: 'none', mouth: 'smirk', blush: false })}
        ${sparkle(90, 110, 26, '#fff')}${sparkle(424, 104, 22)}`,
    },
    {
      file: '10_enti', bubble: ['Enti ra idi?!'], emojis: ['😳', '❓'],
      alt: 'A shocked bean asks what is this',
      art: () => SUNNY(`<text class="mark" x="80" y="150" font-size="96" fill="#fff" transform="rotate(-18 80 150)">?</text>
        <text class="mark" x="432" y="140" font-size="96" fill="#fff" transform="rotate(16 432 140)">?</text>`,
        { eyes: 'shock', mouth: 'o', blush: false }),
    },
    {
      file: '11_sorry', bubble: ['Sorry bol diya na...', 'ab smile karo!'], emojis: ['🙏', '😊'],
      alt: 'A shy lilac bean offers a flower and says sorry, now smile',
      art: () => `${bean(226, 240, 140, 136, LILAC)}${face(216, 218, 1.7, { eyes: 'puppy', mouth: 'smile' })}
        ${flower(412, 200, 1.5)}${limb('M340 270 Q380 280 400 260', LILAC, 18)}`,
    },
    {
      file: '12_aakali', bubble: ['Aakali vestondi...', 'biryani please!'], emojis: ['🍛', '😋'],
      alt: 'A hungry bean holds a bowl of biryani',
      art: () => SUNNY(bowl(256, 400, 1.3), { eyes: 'happy', mouth: 'tongue' }),
    },
  ],
};

// ---- props for the movie pack ----

function popcorn(x, y, s, withFace = false) {
  const kernels = [[-36, -54], [-12, -64], [14, -62], [38, -52], [-24, -40], [2, -44], [26, -38]]
    .map(([kx, ky]) => `<circle cx="${kx}" cy="${ky}" r="17" fill="#fff8e1" ${stroke(5)}/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${kernels}
    <path d="M-56 -36 H56 L42 70 H-42 Z" fill="#fff" ${stroke(6)}/>
    <path d="M-34 -36 L-26 70 M0 -36 V70 M34 -36 L26 70" stroke="#e5383b" stroke-width="12"/>
    <path d="M-56 -36 H56 L42 70 H-42 Z" fill="none" ${stroke(6)}/>
    ${withFace ? face(0, 8, 0.9, { eyes: 'happy', mouth: 'tongue' }) : ''}
  </g>`;
}

function clapper(x, y, s, rot = 0, { board = '#2b2d42', lines = true } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="-60" y="-24" width="120" height="80" rx="8" fill="${board}" ${stroke(6)}/>
    <g transform="rotate(-16 -60 -24)">
      <rect x="-60" y="-50" width="120" height="26" rx="4" fill="#fff" ${stroke(6)}/>
      <path d="M-40 -50 l-14 26 M-10 -50 l-14 26 M20 -50 l-14 26 M50 -50 l-14 26" stroke="#2b2d42" stroke-width="12"/>
      <rect x="-60" y="-50" width="120" height="26" rx="4" fill="none" ${stroke(6)}/>
    </g>
    ${lines ? `<path d="M-44 4 H44 M-44 26 H20" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>` : ''}
  </g>`;
}

function ticket(x, y, s, rot = 0, fill = '#ffd166', lines = true) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-60 -32 H60 V-12 A12 12 0 0 0 60 12 V32 H-60 V12 A12 12 0 0 0 -60 -12 Z" fill="${fill}" ${stroke(6)}/>
    <path d="M-30 -32 V32" stroke="${INK}" stroke-width="4" stroke-dasharray="6 6"/>
    ${lines ? `<path d="M-10 -8 H40 M-10 10 H26" ${stroke(5)}/>` : ''}
  </g>`;
}

function tv(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-24 -66 L0 -46 L24 -66" fill="none" ${stroke(6)}/>
    <rect x="-70" y="-46" width="140" height="100" rx="16" fill="#8d99ae" ${stroke(6)}/>
    <rect x="-56" y="-34" width="112" height="76" rx="8" fill="#cde7ff" ${stroke(5)}/>
    <path d="M-14 -16 L18 4 L-14 24 Z" fill="#e5383b" ${stroke(4)}/>
    <path d="M-40 54 L-48 70 M40 54 L48 70" ${stroke(6)}/>
  </g>`;
}

function tissues(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-10 -34 Q-30 -70 4 -76 Q-4 -56 22 -50 Q10 -40 10 -34 Z" fill="#fff" ${stroke(5)}/>
    <rect x="-56" y="-34" width="112" height="70" rx="10" fill="#a2d2ff" ${stroke(6)}/>
    <rect x="-26" y="-34" width="52" height="12" rx="6" fill="#5c7cfa" ${stroke(4)}/>
    ${heart(0, 8, 14, PINK, { sw: 4 })}
  </g>`;
}

function trophy(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-60 -80 Q-96 -80 -88 -46 Q-80 -14 -40 -10 M60 -80 Q96 -80 88 -46 Q80 -14 40 -10" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
    <path d="M-60 -80 Q-96 -80 -88 -46 Q-80 -14 -40 -10 M60 -80 Q96 -80 88 -46 Q80 -14 40 -10" fill="none" stroke="#ffd166" stroke-width="8" stroke-linecap="round"/>
    <path d="M-64 -96 H64 Q64 10 0 24 Q-64 10 -64 -96 Z" fill="#ffd166" ${stroke(7)}/>
    <rect x="-14" y="22" width="28" height="34" fill="#f4a261" ${stroke(6)}/>
    <rect x="-52" y="56" width="104" height="30" rx="8" fill="#8d5524" ${stroke(6)}/>
    ${face(0, -50, 1.1, { eyes: 'happy', mouth: 'grin' })}
  </g>`;
}

function mustache(x, y, s) {
  return `<path d="M0 0 C-14 -14 -40 -14 -54 4 C-40 0 -26 8 -12 10 Q0 6 0 0 Q0 6 12 10 C26 8 40 0 54 4 C40 -14 14 -14 0 0 Z"
    transform="translate(${x} ${y}) scale(${s})" fill="#6b3f2a" stroke="${INK}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
}

const movies = {
  identifier: 'movies',
  name: 'Movie Mania',
  version: '1',
  accent: '#e63946',
  trayFrom: 1,
  stickers: [
    {
      file: '01_fdfs', bubble: ['First Day', 'First Show!'], emojis: ['🎟️', '🤩'],
      alt: 'An excited bean waves two movie tickets for the first day first show',
      art: () => SUNNY(`${ticket(96, 150, 0.95, -24)}${ticket(420, 140, 0.95, 20, '#ffafcc')}`, { eyes: 'happy', mouth: 'laugh' }),
    },
    {
      file: '02_interval', bubble: ['Interval...', 'popcorn time!'], emojis: ['🍿', '😋'],
      alt: 'A happy popcorn bucket says it is interval, popcorn time',
      art: () => `${popcorn(256, 250, 2.3, true)}${sparkle(80, 120, 22)}${sparkle(440, 110, 20, '#fff')}`,
    },
    {
      file: '03_hero_entry', text: 'HERO ENTRY!', emojis: ['😎', '🔥'],
      alt: 'A bean in sunglasses stands in a spotlight for its hero entry',
      art: () => `<path d="M206 20 H306 L430 380 H82 Z" fill="#fff3b0" opacity="0.9"/>
        ${bean(256, 250, 140, 130, SUN)}${sunglasses(256, 218, 1.6)}${face(256, 230, 1.7, { eyes: 'none', mouth: 'smirk', blush: false })}
        ${sparkle(70, 160, 26)}${sparkle(442, 170, 26)}${sparkle(110, 320, 16, '#fff')}${sparkle(404, 330, 16, '#fff')}`,
    },
    {
      file: '04_villain', text: 'MWAHAHA!', emojis: ['😈', '😂'],
      alt: 'A lilac bean with a curly mustache laughs like a movie villain',
      art: () => `${bean(256, 236, 150, 140, LILAC)}
        ${face(256, 214, 1.8, { eyes: 'dot', mouth: 'laugh', blush: false })}
        <path d="M176 166 L236 192 M336 166 L276 192" ${stroke(10)}/>
        ${mustache(256, 238, 1.7)}`,
    },
    {
      file: '05_twist', bubble: ['Climax lo', 'twist enti?!'], emojis: ['🎬', '😱'],
      alt: 'A shocked bean holds a clapperboard after a climax twist',
      art: () => SUNNY(clapper(410, 200, 1.1, 14), { eyes: 'shock', mouth: 'bigo', blush: false }),
    },
    {
      file: '06_blockbuster', text: 'BLOCKBUSTER!', emojis: ['🏆', '🎉'],
      alt: 'A smiling gold trophy celebrates a blockbuster',
      art: () => `${trophy(256, 250, 1.6)}${sparkle(80, 110, 26)}${sparkle(436, 100, 24)}${sparkle(440, 300, 16, '#fff')}`,
    },
    {
      file: '07_housefull', text: 'HOUSEFULL!', emojis: ['🎫', '🥳'],
      alt: 'A cheerful movie ticket celebrates a housefull show',
      art: () => `${ticket(256, 230, 3, -8, '#ffd166', false)}${face(296, 226, 1.5, { eyes: 'happy', mouth: 'grin', rot: -8 })}
        ${sparkle(76, 90, 22)}${sparkle(440, 100, 22, '#fff')}`,
    },
    {
      file: '08_ott', bubble: ['Waiting for', 'OTT release...'], emojis: ['📺', '😴'],
      alt: 'A sleepy bean waits in front of a TV for the streaming release',
      art: () => SUNNY(tv(410, 230, 1.05), { eyes: 'sleepy', mouth: 'flat', blush: false }, '#ffe58a'),
    },
    {
      file: '09_emotional', bubble: ['Emotional scene...', 'tissue please!'], emojis: ['😭', '🤧'],
      alt: 'A crying bean reaches for a box of tissues during an emotional scene',
      art: () => SUNNY(`${tissues(414, 300, 1.1)}${drop(176, 268, 1.3)}${drop(336, 268, 1.3)}`, { eyes: 'closed', mouth: 'wavy' }),
    },
    {
      file: '10_cut', text: 'CUT! RETAKE!', emojis: ['🎬', '🙄'],
      alt: 'A grumpy clapperboard calls cut and retake',
      art: () => `${clapper(256, 220, 2.6, -6, { board: '#9aa5c4', lines: false })}${face(256, 262, 1.4, { eyes: 'side', mouth: 'flat', blush: false, body: '#9aa5c4', rot: -6 })}`,
    },
    {
      file: '11_paisa_vasool', text: 'PAISA VASOOL!', emojis: ['💰', '😁'],
      alt: 'A delighted bean says the movie was worth every penny',
      art: () => SUNNY(`${note(90, 130, 0.9, -14)}${note(424, 120, 0.9, 16)}${sparkle(256, 60, 22)}`, { eyes: 'happy', mouth: 'grin' }),
    },
    {
      file: '12_no_spoilers', bubble: ['No spoilers,', 'please!'], emojis: ['🙉', '🤐'],
      alt: 'A bean covers its ears and squeezes its eyes shut to avoid spoilers',
      art: () => `${bean(256, 236, 150, 140, SUN)}${face(256, 214, 1.8, { eyes: 'laugh', mouth: 'wavy', blush: false })}
        <circle cx="104" cy="214" r="34" fill="${SUN}" ${stroke()}/><circle cx="408" cy="214" r="34" fill="${SUN}" ${stroke()}/>`,
    },
  ],
};

// ---- original "Mass Hero" characters ----

const SKIN = '#c68642', SKIN2 = '#e0a77a', HAIR = '#2b1d14', SHIRT = '#d62828', KURTI = '#9d4edd';

// A puff of dust kicked up by a slow-motion entry.
function dust(x, y) {
  return `<g fill="#e9d8a6" ${stroke(5)}>
    <circle cx="${x - 34}" cy="${y + 6}" r="22"/><circle cx="${x + 34}" cy="${y + 6}" r="22"/><circle cx="${x}" cy="${y - 12}" r="30"/>
  </g><path d="M${x - 56} ${y + 10} q56 26 112 0" fill="#e9d8a6"/>`;
}

function hand(x, y, r = 16, fill = SKIN) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${stroke(6)}/>`;
}

// Hero: spiky hair, short stubble, red shirt. Local coordinates, head centred on (0, 0).
function hero(x, y, s, { eyes = 'dot', mouth = 'smirk', glasses = false, brows = 'calm', arms = 'down', blush = false } = {}) {
  const armsSvg = {
    down: `${limb('M-62 112 Q-92 160 -84 196', SHIRT)}${hand(-84, 200)}${limb('M62 112 Q92 160 84 196', SHIRT)}${hand(84, 200)}`,
    punch: `${limb('M-62 112 Q-92 160 -84 196', SHIRT)}${hand(-84, 200)}${limb('M62 112 Q120 104 162 84', SHIRT)}
      <path d="M214 30 l10 30 l30 -6 l-20 24 l22 20 l-30 0 l-6 30 l-16 -26 l-26 14 l6 -30 l-28 -12 l30 -8 l-6 -30 l24 18 Z" fill="#ffd166" ${stroke(5)}/>
      ${hand(176, 80, 26)}`,
    crossed: `${limb('M-62 116 Q-10 176 54 136', SHIRT)}${hand(58, 134)}${limb('M62 116 Q10 166 -54 146', SHIRT)}${hand(-58, 146)}`,
    plate: `${limb('M-62 112 Q-96 150 -70 168', SHIRT)}${limb('M62 112 Q96 150 70 168', SHIRT)}
      <ellipse cx="0" cy="172" rx="96" ry="24" fill="#fff" ${stroke(6)}/>
      <path d="M-50 166 Q-30 130 0 140 Q30 128 52 166 Z" fill="#ffd166" ${stroke(5)}/>
      <circle cx="-14" cy="150" r="5" fill="#e09f3e"/><circle cx="18" cy="148" r="5" fill="#52b788"/>
      ${hand(-76, 172)}${hand(76, 172)}`,
    heart: `${limb('M-62 112 Q-70 160 -30 160', SHIRT)}${limb('M62 112 Q70 160 30 160', SHIRT)}
      ${heart(0, 150, 42, RED)}${hand(-34, 160)}${hand(34, 160)}`,
    thumb: `${limb('M-62 112 Q-92 160 -84 196', SHIRT)}${hand(-84, 200)}${limb('M62 112 Q118 100 118 50', SHIRT)}
      <rect x="110" y="0" width="16" height="34" rx="8" fill="${SKIN}" ${stroke(5)}/>${hand(118, 46, 22)}`,
    scared: `${limb('M-62 112 Q-110 90 -100 40', SHIRT)}${hand(-100, 34)}${limb('M62 112 Q110 90 100 40', SHIRT)}${hand(100, 34)}`,
  }[arms];
  const browsSvg = {
    calm: `<path d="M-52 -36 Q-34 -46 -14 -36 M52 -36 Q34 -46 14 -36" fill="none" ${stroke(9)}/>`,
    angry: `<path d="M-54 -46 L-14 -30 M54 -46 L14 -30" ${stroke(10)}/>`,
    worried: `<path d="M-52 -30 L-16 -44 M52 -30 L16 -44" ${stroke(9)}/>`,
  }[brows];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 90 Q-84 200 -60 214 H60 Q84 200 70 90 Q0 70 -70 90 Z" fill="${SHIRT}" ${stroke()}/>
    <path d="M-26 84 L0 124 L26 84" fill="#fff" ${stroke(5)}/>
    <circle cx="0" cy="0" r="90" fill="${SKIN}" ${stroke()}/>
    <path d="M-86 16 Q-80 92 0 92 Q80 92 86 16 Q70 44 50 40 Q30 76 0 74 Q-30 76 -50 40 Q-70 44 -86 16 Z" fill="${HAIR}" opacity="0.85"/>
    <path d="M-92 -6 Q-104 -84 -44 -98 L-40 -132 L-8 -104 L22 -138 L40 -100 L74 -116 L70 -84 Q104 -60 92 -6 Q82 -54 44 -60 Q0 -76 -44 -60 Q-82 -54 -92 -6 Z" fill="${HAIR}" ${stroke(6)}/>
    ${face(0, 2, 1.25, { eyes: glasses ? 'none' : eyes, mouth, blush })}
    ${glasses ? sunglasses(0, -4, 1.25) : browsSvg}
    ${armsSvg}
  </g>`;
}

// Heroine: long dark hair with a jasmine string, purple kurti, red bindi.
function heroine(x, y, s, { eyes = 'happy', mouth = 'smile', arms = 'down', blush = true, brows = null } = {}) {
  const armsSvg = {
    down: `${limb('M-58 112 Q-86 160 -78 194', KURTI)}${hand(-78, 198, 15, SKIN2)}${limb('M58 112 Q86 160 78 194', KURTI)}${hand(78, 198, 15, SKIN2)}`,
    crossed: `${limb('M-58 116 Q-10 172 50 136', KURTI)}${hand(54, 134, 15, SKIN2)}${limb('M58 116 Q10 162 -50 146', KURTI)}${hand(-54, 146, 15, SKIN2)}`,
    cheeks: `${limb('M-58 112 Q-110 90 -74 40', KURTI)}${hand(-70, 34, 18, SKIN2)}${limb('M58 112 Q110 90 74 40', KURTI)}${hand(70, 34, 18, SKIN2)}`,
    phone: `${limb('M-58 116 Q-10 172 50 136', KURTI)}${hand(54, 134, 15, SKIN2)}${limb('M58 112 Q120 120 118 70', KURTI)}
      ${phone(122, 40, 0.8, 10)}${hand(116, 74, 15, SKIN2)}`,
  }[arms];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-96 -10 Q-110 120 -76 150 L76 150 Q110 120 96 -10 Z" fill="${HAIR}" ${stroke(6)}/>
    <path d="M-64 92 Q-80 200 -58 214 H58 Q80 200 64 92 Q0 74 -64 92 Z" fill="${KURTI}" ${stroke()}/>
    <path d="M-30 88 Q0 120 30 88" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="86" fill="${SKIN2}" ${stroke()}/>
    <path d="M-90 4 Q-96 -90 0 -96 Q96 -90 90 4 Q70 -50 20 -52 Q0 -30 -10 -52 Q-70 -50 -90 4 Z" fill="${HAIR}" ${stroke(6)}/>
    ${[[70, -62], [84, -42], [92, -20]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="10" fill="#fff" ${stroke(4)}/>`).join('')}
    <circle cx="0" cy="-34" r="6" fill="#e5383b"/>
    ${face(0, 6, 1.2, { eyes, mouth, blush })}
    ${brows === 'angry' ? `<path d="M-50 -24 L-14 -12 M50 -24 L14 -12" ${stroke(7)}/>` : ''}
    ${armsSvg}
  </g>`;
}

const HERO_AT = (opts, extra = '') => `${extra}${hero(256, 190, 0.95, opts)}`;
const HEROINE_AT = (opts, extra = '') => `${extra}${heroine(256, 190, 0.95, opts)}`;

// Original "mass" and romcom lines, mostly Telugu written in English letters.
const massHero = {
  identifier: 'mass_hero',
  name: 'Mass Hero',
  version: '1',
  accent: '#d62828',
  trayFrom: 0,
  stickers: [
    {
      file: '01_mass_entry', text: 'MASS ENTRY!', emojis: ['😎', '🔥'],
      alt: 'A hero in sunglasses makes a slow-motion entry with sparkles and dust',
      art: () => HERO_AT({ glasses: true, mouth: 'smirk' }, `${sparkle(70, 90, 28)}${sparkle(440, 100, 26)}
        ${dust(96, 380)}${dust(416, 380)}`),
    },
    {
      file: '02_storm', bubble: ['Nenu vasthe...', 'storm vasthundi!'], emojis: ['🌪️', '😤'],
      alt: 'A confident hero says when I arrive, a storm arrives',
      art: () => HERO_AT({ eyes: 'dot', brows: 'angry', mouth: 'smirk', arms: 'crossed' }),
    },
    {
      file: '03_full_charge', bubble: ['Nuvvu smile chesthe', 'naa heart full charge!'], emojis: ['🥰', '🔋'],
      alt: 'A blushing hero holds a heart and says your smile fully charges my heart',
      art: () => HERO_AT({ eyes: 'happy', mouth: 'grin', arms: 'heart', blush: true }),
    },
    {
      file: '04_coffee', bubble: ['Hero aithe enti?', 'first coffee techko!'], emojis: ['☕', '😏'],
      alt: 'The heroine folds her arms and says so what if you are a hero, bring coffee first',
      art: () => HEROINE_AT({ eyes: 'side', mouth: 'smirk', arms: 'crossed', blush: false }),
    },
    {
      file: '05_lunch', bubble: ['Fight ki ready...', 'kaani lunch tarvatha!'], emojis: ['🍛', '😋'],
      alt: 'The hero holds a plate of food and says ready to fight, but after lunch',
      art: () => HERO_AT({ eyes: 'happy', mouth: 'tongue', arms: 'plate' }),
    },
    {
      file: '06_boss', text: 'BOSS IS BACK!', emojis: ['👑', '😎'],
      alt: 'The hero in sunglasses gives a thumbs up, the boss is back',
      art: () => HERO_AT({ glasses: true, mouth: 'grin', arms: 'thumb' },
        `<path d="M206 46 L216 6 L240 30 L256 0 L272 30 L296 6 L306 46 Z" fill="#ffd166" ${stroke(6)}/>`),
    },
    {
      file: '07_jodi', bubble: ['Mana jodi', 'superhit!'], emojis: ['💑', '❤️'],
      alt: 'The hero and heroine stand together under a heart',
      art: () => `${heroine(346, 210, 0.78, { eyes: 'happy', mouth: 'grin' })}${hero(170, 210, 0.78, { eyes: 'happy', mouth: 'grin', blush: true })}
        ${heart(258, 60, 36, RED)}${sparkle(190, 40, 16)}${sparkle(330, 36, 16)}`,
    },
    {
      file: '08_amma', bubble: ['Villains ki bayapadanu...', 'kaani amma ki bayam!'], emojis: ['😰', '🙏'],
      alt: 'The hero raises his hands in fear and says not scared of villains but scared of mom',
      art: () => HERO_AT({ eyes: 'shock', brows: 'worried', mouth: 'grimace', arms: 'scared' }, drop(380, 120, 1.4, '#7ad3ff', 10)),
    },
    {
      file: '09_siggu', bubble: ['Ayyo...', 'siggu ga undi!'], emojis: ['☺️', '🙈'],
      alt: 'The blushing heroine holds her cheeks and says I feel shy',
      art: () => HEROINE_AT({ eyes: 'closed', mouth: 'smile', arms: 'cheeks' }, `${heart(90, 110, 22, PINK)}${heart(424, 96, 18, BLUSH)}`),
    },
    {
      file: '10_dhishum', text: 'DHISHUM!', emojis: ['👊', '💥'],
      alt: 'The hero throws a punch with a big impact star',
      art: () => `${hero(220, 190, 0.95, { eyes: 'dot', brows: 'angry', mouth: 'grimace', arms: 'punch' })}`,
    },
    {
      file: '11_attitude', bubble: ['Attitude naa', 'birth certificate lo undi!'], emojis: ['😎', '💯'],
      alt: 'The hero in sunglasses says attitude is written on my birth certificate',
      art: () => HERO_AT({ glasses: true, mouth: 'smirk', arms: 'crossed' }, sparkle(430, 90, 24)),
    },
    {
      file: '12_reply', bubble: ['Reply ivvaledu ga...', 'ippudu cheptha!'], emojis: ['😤', '📱'],
      alt: 'The angry heroine holds a phone and says you did not reply, now you will see',
      art: () => HEROINE_AT({ eyes: 'dot', mouth: 'frown', arms: 'phone', blush: false, brows: 'angry' }),
    },
  ],
};

module.exports = { packs: [love, comedy, romance, dialogues, movies, massHero], INK };
