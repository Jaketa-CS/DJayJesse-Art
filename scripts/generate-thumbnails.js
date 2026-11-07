import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = path.resolve('public/comic-pages');
const TARGET_DIR = path.resolve('public/comic-thumbs');
const THUMB_WIDTH = 400;
const THUMB_HEIGHT = 225; // 16:9 ratio matching 2560x1440
const WEBP_QUALITY = 80;

async function generateThumbnails() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((file) => file.toLowerCase().endsWith('.png'));

  console.log(
    `Processing ${files.length} comic pages into 2x WebP thumbnails (${THUMB_WIDTH}x${THUMB_HEIGHT})...`
  );
  const startTime = Date.now();

  let generatedCount = 0;
  let skippedCount = 0;

  // Process in batches of 16 to avoid file descriptor saturation while maximizing CPU cores
  const BATCH_SIZE = 16;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (file) => {
        const inputPath = path.join(SOURCE_DIR, file);
        const outputFilename = file.replace(/\.png$/i, '.webp');
        const outputPath = path.join(TARGET_DIR, outputFilename);

        const inputStat = fs.statSync(inputPath);
        if (fs.existsSync(outputPath)) {
          const outputStat = fs.statSync(outputPath);
          if (outputStat.mtimeMs >= inputStat.mtimeMs && outputStat.size > 0) {
            skippedCount++;
            return;
          }
        }

        await sharp(inputPath)
          .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover' })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outputPath);

        generatedCount++;
      })
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `Done! Generated: ${generatedCount}, Up-to-date: ${skippedCount}, Total: ${files.length} in ${duration}s.`
  );
}

generateThumbnails().catch((err) => {
  console.error('Failed to generate thumbnails:', err);
  process.exit(1);
});
