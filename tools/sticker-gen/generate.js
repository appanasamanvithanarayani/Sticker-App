// Renders the sticker art in art.js into WhatsApp-ready files:
//   app/src/main/assets/<pack>/NN_name.webp  512x512 WebP, under 100 KB
//   app/src/main/assets/<pack>/tray.png      96x96 PNG, under 50 KB
//   app/src/main/assets/contents.json        the pack catalogue the app reads
//   docs/preview.png                         a contact sheet for the README
//
// Usage (from this folder):  npm install && npm run generate

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { packs, INK } = require('./art');

const ROOT = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'app', 'src', 'main', 'assets');
const DOCS = path.join(ROOT, 'docs');
const FONT = path.join(__dirname, 'node_modules', '@fontsource', 'fredoka', 'files', 'fredoka-latin-700-normal.woff2');

const STICKER_MAX = 100 * 1024;
const TRAY_MAX = 50 * 1024;

const page_html = `<!doctype html><html><head><style>
@font-face { font-family: Fredoka; font-weight: 700; src: url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format('woff2'); }
html, body { margin: 0; background: transparent; }
#stage { width: 512px; height: 512px; }
text.cap, text.mark { font-family: Fredoka; font-weight: 700; text-anchor: middle;
  stroke: ${INK}; stroke-width: 12px; stroke-linejoin: round; paint-order: stroke; letter-spacing: 1px; }
text.mark { stroke-width: 9px; }
text.bubble { font-family: Fredoka; font-weight: 700; text-anchor: middle; }
</style></head><body><div id="stage"></div><canvas id="c"></canvas></body></html>`;

// White die-cut border and a soft drop shadow around everything, like a printed sticker.
const FILTER = `<filter id="sticker" x="-5%" y="-5%" width="110%" height="110%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="grown"/>
  <feGaussianBlur in="grown" stdDeviation="1.5" result="soft"/>
  <feComponentTransfer in="soft" result="edge"><feFuncA type="linear" slope="3" intercept="-0.5"/></feComponentTransfer>
  <feFlood flood-color="#ffffff"/><feComposite in2="edge" operator="in" result="white"/>
  <feGaussianBlur in="edge" stdDeviation="4" result="blur"/>
  <feOffset in="blur" dy="5" result="off"/>
  <feFlood flood-color="#000" flood-opacity="0.22"/><feComposite in2="off" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

// Dialogue stickers: a speech bubble on top, the character underneath.
function dialogueSvg(sticker, accent) {
  const lines = sticker.bubble;
  const lineH = 52;
  const top = 26;
  const h = lines.length * lineH + 44;
  const text = lines
    .map((l, i) => `<tspan x="256" y="${top + 54 + i * lineH}">${l}</tspan>`)
    .join('');
  // Fit the character into the space between the bubble's tail and the bottom margin.
  const start = top + h + 20, end = 496;
  const scale = Math.min(0.7, (end - start) / 330);
  const cy = (start + end) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>${FILTER}</defs><g filter="url(#sticker)">
      <g transform="translate(256 ${cy}) scale(${scale}) translate(-256 -240)">${sticker.art()}</g>
      <path d="M44 ${top} H468 Q484 ${top} 484 ${top + 16} V${top + h - 16} Q484 ${top + h} 468 ${top + h}
        H300 L270 ${top + h + 34} L262 ${top + h} H44 Q28 ${top + h} 28 ${top + h - 16} V${top + 16} Q28 ${top} 44 ${top} Z"
        fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <text class="bubble" font-size="44" fill="${INK}">${text}</text>
    </g></svg>`;
}

function svgFor(sticker, accent, withText) {
  if (sticker.bubble && withText) return dialogueSvg(sticker, accent);
  // With a caption the art is drawn smaller and higher so the text fits underneath.
  const art = withText
    ? `<g transform="translate(256 206) scale(0.84) translate(-256 -226)">${sticker.art()}</g>
       <text class="cap" x="256" y="470" font-size="80" fill="${accent}">${sticker.text}</text>`
    : `<g transform="translate(256 256) scale(0.95) translate(-256 -226)">${sticker.art()}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>${FILTER}</defs><g filter="url(#sticker)">${art}</g></svg>`;
}

async function render(page, svg) {
  await page.evaluate((markup) => {
    document.getElementById('stage').innerHTML = markup;
    // Shrink each caption until it fits inside the 16 px safe margin (plus border).
    for (const t of document.querySelectorAll('text.cap')) {
      let size = parseFloat(t.getAttribute('font-size'));
      while (t.getBBox().width > 440 && size > 30) {
        size -= 2;
        t.setAttribute('font-size', size);
      }
      t.style.strokeWidth = Math.max(6, size * 0.13) + 'px';
    }
    for (const t of document.querySelectorAll('text.bubble')) {
      let size = parseFloat(t.getAttribute('font-size'));
      while (t.getBBox().width > 420 && size > 24) {
        size -= 1;
        t.setAttribute('font-size', size);
      }
    }
  }, svg);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.locator('#stage').screenshot({ omitBackground: true });
  return png;
}

// Re-encode a PNG in the page: WebP at decreasing quality until it fits, or a resized PNG.
async function encode(page, png, { type, size, maxBytes }) {
  const b64 = await page.evaluate(
    async ({ src, type, size, maxBytes }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + src;
      await img.decode();
      const c = document.getElementById('c');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      let q = 0.92, url;
      do {
        url = c.toDataURL(type, q);
        q -= 0.06;
      } while (type === 'image/webp' && (url.length * 3) / 4 > maxBytes && q > 0.3);
      return url.split(',')[1];
    },
    { src: png.toString('base64'), type, size, maxBytes },
  );
  const buf = Buffer.from(b64, 'base64');
  if (buf.length > maxBytes) throw new Error(`encoded file is ${buf.length} bytes, over ${maxBytes}`);
  return buf;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 });
  await page.setContent(page_html);
  await page.evaluate(() => document.fonts.load('700 40px Fredoka'));

  const contents = {
    android_play_store_link: '',
    ios_app_store_link: '',
    sticker_packs: [],
  };
  const sheet = [];

  for (const pack of packs) {
    const dir = path.join(ASSETS, pack.identifier);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    const trayPng = await render(page, svgFor(pack.stickers[pack.trayFrom], pack.accent, false));
    fs.writeFileSync(path.join(dir, 'tray.png'), await encode(page, trayPng, { type: 'image/png', size: 96, maxBytes: TRAY_MAX }));

    const entries = [];
    for (const s of pack.stickers) {
      const png = await render(page, svgFor(s, pack.accent, true));
      const webp = await encode(page, png, { type: 'image/webp', size: 512, maxBytes: STICKER_MAX });
      const file = `${s.file}.webp`;
      fs.writeFileSync(path.join(dir, file), webp);
      entries.push({ image_file: file, emojis: s.emojis, accessibility_text: s.alt });
      sheet.push({ pack: pack.name, file, b64: png.toString('base64') });
      console.log(`${pack.identifier}/${file}  ${(webp.length / 1024).toFixed(1)} KB`);
    }

    contents.sticker_packs.push({
      identifier: pack.identifier,
      name: pack.name,
      publisher: 'Filmy Feels',
      tray_image_file: 'tray.png',
      image_data_version: pack.version,
      avoid_cache: false,
      publisher_email: '',
      publisher_website: '',
      privacy_policy_website: '',
      license_agreement_website: '',
      animated_sticker_pack: false,
      stickers: entries,
    });
  }

  fs.writeFileSync(path.join(ASSETS, 'contents.json'), JSON.stringify(contents, null, 2) + '\n');

  // Contact sheet: one row per pack on a soft background.
  fs.mkdirSync(DOCS, { recursive: true });
  const cell = 150;
  const perRow = Math.max(...packs.map((p) => p.stickers.length));
  const rows = packs.map((p) => sheet.filter((s) => s.pack === p.name));
  await page.setViewportSize({ width: cell * perRow + 40, height: rows.length * (cell + 44) + 20 });
  await page.setContent(`<body style="margin:0;padding:10px 20px;background:#fff4f7;font:600 20px sans-serif;color:${INK}">
    ${rows.map((r) => `<div style="margin:6px 0 2px">${r[0].pack}</div><div style="display:flex">
      ${r.map((s) => `<img width="${cell}" height="${cell}" src="data:image/png;base64,${s.b64}">`).join('')}</div>`).join('')}
    </body>`);
  await page.screenshot({ path: path.join(DOCS, 'preview.png'), fullPage: true });

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
