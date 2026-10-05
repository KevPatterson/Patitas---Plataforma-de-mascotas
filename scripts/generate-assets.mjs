import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const publicDir = path.resolve('public');

// Favicon mark SVG (same as Logo mark, 120x120 centered, no background)
const markSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
  <ellipse cx="24" cy="48" rx="9" ry="12" transform="rotate(-22 24 48)" fill="#FFC857"/>
  <ellipse cx="45" cy="28" rx="9" ry="13" transform="rotate(-8 45 28)" fill="#FFC857"/>
  <ellipse cx="75" cy="28" rx="9" ry="13" transform="rotate(8 75 28)" fill="#FFC857"/>
  <ellipse cx="96" cy="48" rx="9" ry="12" transform="rotate(22 96 48)" fill="#FFC857"/>
  <defs><mask id="m"><rect width="120" height="120" fill="white"/><circle cx="60" cy="75" r="8" fill="black"/></mask></defs>
  <path d="M60 110 C60 110 33 91 33 74 C33 62 44 54 60 54 C76 54 87 62 87 74 C87 91 60 110 60 110Z" fill="#FF6B35" mask="url(#m)"/>
</svg>`;

const faviconSquareSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}">
  <rect width="128" height="128" rx="32" fill="#0B3B3C"/>
  <ellipse cx="48" cy="38" rx="10" ry="14" transform="rotate(-8 48 38)" fill="#FFC857"/>
  <ellipse cx="80" cy="38" rx="10" ry="14" transform="rotate(8 80 38)" fill="#FFC857"/>
  <defs><mask id="f"><rect width="128" height="128" fill="white"/><circle cx="64" cy="78" r="9" fill="black"/></mask></defs>
  <path d="M64 116 C64 116 34 95 34 76 C34 63 46 54 64 54 C82 54 94 63 94 76 C94 95 64 116 64 116Z" fill="#FF6B35" mask="url(#f)"/>
</svg>`;

async function pngFromSvg(svg, size, outPath) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log('wrote', outPath);
}

async function icoFromPng(pngPath, icoPath) {
  // sharp can't write ico; we create a simple ico with 32x32 png inside - easiest: copy png as ico (browsers accept) or generate bmp ico structure
  // Simple approach: generate 32x32 png and rename? Instead craft ico file header
  const pngBuf = await fs.readFile(pngPath);
  // For compatibility, just write png buf as ico with minimal header for single 32x32 image
  // ICO header 6 bytes + directory 16 bytes + png data
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type ico
  header.writeUInt16LE(1, 4); // count
  header[6] = 32; // width
  header[7] = 32; // height
  header[8] = 0; // colors
  header[9] = 0; // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(pngBuf.length, 14); // size
  header.writeUInt32LE(22, 18); // offset
  await fs.writeFile(icoPath, Buffer.concat([header, pngBuf]));
  console.log('wrote', icoPath);
}

async function ogImage() {
  const w = 1200, h = 630;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0B3B3C"/>
  <!-- decorative espuma circle -->
  <circle cx="1050" cy="120" r="180" fill="#CFEFE6" opacity="0.08"/>
  <circle cx="120" cy="560" r="220" fill="#FF6B35" opacity="0.07"/>
  <g transform="translate(540, 145)">
    <!-- logo large centered approx 220x220 -->
    <g transform="scale(1.85)">
      <ellipse cx="24" cy="48" rx="9" ry="12" transform="rotate(-22 24 48)" fill="#FFC857"/>
      <ellipse cx="45" cy="28" rx="9" ry="13" transform="rotate(-8 45 28)" fill="#FFC857"/>
      <ellipse cx="75" cy="28" rx="9" ry="13" transform="rotate(8 75 28)" fill="#FFC857"/>
      <ellipse cx="96" cy="48" rx="9" ry="12" transform="rotate(22 96 48)" fill="#FFC857"/>
      <defs><mask id="ogm"><rect width="120" height="120" fill="white"/><circle cx="60" cy="75" r="8" fill="black"/></mask></defs>
      <path d="M60 110 C60 110 33 91 33 74 C33 62 44 54 60 54 C76 54 87 62 87 74 C87 91 60 110 60 110Z" fill="#FF6B35" mask="url(#ogm)"/>
    </g>
    <text x="60" y="155" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="42" font-weight="800" fill="#F5FBF9" letter-spacing="-0.02em">patitas</text>
  </g>
  <text x="600" y="420" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="52" font-weight="800" fill="#FFC857">Que ninguna patita</text>
  <text x="600" y="480" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="52" font-weight="800" fill="#FFC857">se quede sin casa.</text>
  <text x="600" y="530" text-anchor="middle" font-family="Figtree, sans-serif" font-size="18" font-weight="400" fill="#CFEFE6" opacity="0.9">Plataforma comunitaria · Cuba</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('wrote og-image.png');
}

await pngFromSvg(faviconSquareSvg(512), 512, path.join(publicDir, 'icon-512.png'));
await pngFromSvg(faviconSquareSvg(192), 192, path.join(publicDir, 'icon-192.png'));
await pngFromSvg(faviconSquareSvg(180), 180, path.join(publicDir, 'apple-touch-icon.png'));
// favicon 32 for ico
const tmpFavicon32 = path.join(publicDir, '_favicon-32.png');
await pngFromSvg(faviconSquareSvg(32), 32, tmpFavicon32);
await icoFromPng(tmpFavicon32, path.join(publicDir, 'favicon.ico'));
await fs.unlink(tmpFavicon32).catch(()=>{});
await ogImage();

// also ensure favicon.svg already exists (written manually)
console.log('done');
