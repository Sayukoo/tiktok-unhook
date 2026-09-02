import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const publicDir = path.resolve('public');
const sizes = [16, 32, 48, 128, 256];

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);
  console.log('Generowanie ikon PNG z nowego wektora SVG...');

  for (const size of sizes) {
    const dest = path.join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`Wygenerowano: ${dest}`);
  }

  await sharp(svgBuffer)
    .resize(128, 128)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));
}

generate().catch(console.error);
