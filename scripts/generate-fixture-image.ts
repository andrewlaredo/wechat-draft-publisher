import fs from 'fs';
import path from 'path';

const dir = path.resolve('tests/fixtures/images');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1x1 base64 png
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
fs.writeFileSync(path.join(dir, 'cover.png'), Buffer.from(pngBase64, 'base64'));
console.log('Sample cover.png created');
