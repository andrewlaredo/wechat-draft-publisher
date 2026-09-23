import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function syncIcons() {
  const rootDir = process.cwd();
  const src = path.join(rootDir, 'public', 'icon.png');
  const buildDir = path.join(rootDir, 'build');
  const winDir = path.join(buildDir, 'windows');

  if (!fs.existsSync(src)) {
    console.error('Source icon not found at:', src);
    process.exit(1);
  }

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(winDir)) fs.mkdirSync(winDir, { recursive: true });

  // 1. Copy to build/appicon.png (Master icon for Wails)
  const appIconDest = path.join(buildDir, 'appicon.png');
  fs.copyFileSync(src, appIconDest);
  console.log(`[Icon Sync] Copied ${src} -> ${appIconDest}`);

  // 2. Generate multi-resolution Windows ICO (16, 32, 48, 64, 128, 256)
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp(src)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // Build standard ICO container
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0); // Width
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1); // Height
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Image offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
  const icoDest = path.join(winDir, 'icon.ico');
  fs.writeFileSync(icoDest, icoBuffer);
  console.log(`[Icon Sync] Generated Windows ICO -> ${icoDest} (${icoBuffer.length} bytes)`);
}

syncIcons().catch((err) => {
  console.error('[Icon Sync Error]', err);
  process.exit(1);
});
