// Checks app/src/main/assets against WhatsApp's sticker pack rules.
// Usage: node validate.js   (exits non-zero on any problem)

const fs = require('fs');
const path = require('path');

const ASSETS = path.resolve(__dirname, '..', '..', 'app', 'src', 'main', 'assets');
const errors = [];
const fail = (msg) => errors.push(msg);

// Reads width/height from a PNG or a WebP (VP8, VP8L or VP8X) header.
function imageInfo(buf) {
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return {
        type: 'webp', animated: (buf[20] & 0x02) !== 0,
        width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3),
      };
    }
    if (chunk === 'VP8 ') return { type: 'webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { type: 'webp', width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return { type: 'unknown' };
}

const contents = JSON.parse(fs.readFileSync(path.join(ASSETS, 'contents.json'), 'utf8'));
const ids = new Set();

for (const pack of contents.sticker_packs) {
  const id = pack.identifier;
  if (!/^[\w\-.,' ]+$/.test(id)) fail(`${id}: identifier has characters WhatsApp does not allow`);
  if (ids.has(id)) fail(`${id}: duplicate identifier`);
  ids.add(id);
  for (const key of ['name', 'publisher']) {
    if (!pack[key] || pack[key].length > 128) fail(`${id}: ${key} must be 1-128 characters`);
  }
  const n = pack.stickers.length;
  if (n < 3 || n > 30) fail(`${id}: has ${n} stickers, WhatsApp needs 3-30`);

  const trayPath = path.join(ASSETS, id, pack.tray_image_file);
  if (!fs.existsSync(trayPath)) {
    fail(`${id}: tray image ${pack.tray_image_file} is missing`);
  } else {
    const buf = fs.readFileSync(trayPath);
    const info = imageInfo(buf);
    if (info.type !== 'png') fail(`${id}: tray image must be a PNG`);
    if (info.width !== 96 || info.height !== 96) fail(`${id}: tray image is ${info.width}x${info.height}, must be 96x96`);
    if (buf.length > 50 * 1024) fail(`${id}: tray image is ${buf.length} bytes, max 50 KB`);
  }

  const files = new Set();
  for (const s of pack.stickers) {
    const where = `${id}/${s.image_file}`;
    if (files.has(s.image_file)) fail(`${where}: listed twice`);
    files.add(s.image_file);
    if (!s.emojis || s.emojis.length < 1 || s.emojis.length > 3) fail(`${where}: needs 1-3 emojis`);
    if (s.accessibility_text && s.accessibility_text.length > 125) fail(`${where}: accessibility text over 125 characters`);
    const p = path.join(ASSETS, id, s.image_file);
    if (!fs.existsSync(p)) { fail(`${where}: file is missing`); continue; }
    const buf = fs.readFileSync(p);
    const info = imageInfo(buf);
    if (info.type !== 'webp') fail(`${where}: must be WebP`);
    if (info.width !== 512 || info.height !== 512) fail(`${where}: is ${info.width}x${info.height}, must be 512x512`);
    if (info.animated !== !!pack.animated_sticker_pack && info.animated !== undefined) fail(`${where}: animation does not match the pack`);
    const max = pack.animated_sticker_pack ? 500 * 1024 : 100 * 1024;
    if (buf.length > max) fail(`${where}: is ${buf.length} bytes, max ${max}`);
  }
  console.log(`${id}: ${n} stickers checked`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('All sticker packs meet WhatsApp\'s requirements.');
