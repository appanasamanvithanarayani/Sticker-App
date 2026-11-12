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

module.exports = { packs: [love, comedy, romance], INK };
