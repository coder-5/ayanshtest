import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker, PSM, OEM } from 'tesseract.js';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * ULTIMATE OCR - MULTIPLE STRATEGIES
 *
 * Tries multiple preprocessing strategies to maximize OCR success:
 * 1. Original image (no preprocessing)
 * 2. Grayscale + normalize
 * 3. Adaptive threshold (for poor quality scans)
 * 4. Inverted (white text on black)
 * 5. High contrast boost
 */

interface ExtractionOptions {
  startPage?: number;
  endPage?: number;
  scale?: number;
  saveDebugImages?: boolean;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  scale: 4, // 4x = highest quality
  saveDebugImages: true,
};

/**
 * Multiple preprocessing strategies
 */
async function createPreprocessingVariants(
  imageBuffer: Buffer,
  pageNum: number,
  outputDir: string
): Promise<Array<{ name: string; buffer: Buffer; path: string }>> {
  const variants: Array<{ name: string; buffer: Buffer; path: string }> = [];

  // Original
  const originalPath = path.join(outputDir, `page-${pageNum}-original.png`);
  fs.writeFileSync(originalPath, imageBuffer);
  variants.push({ name: 'original', buffer: imageBuffer, path: originalPath });

  try {
    // Strategy 1: Grayscale + Normalize + Sharpen
    const strategy1 = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 2 })
      .png()
      .toBuffer();
    const path1 = path.join(outputDir, `page-${pageNum}-strategy1-normalized.png`);
    fs.writeFileSync(path1, strategy1);
    variants.push({ name: 'normalized', buffer: strategy1, path: path1 });

    // Strategy 2: High Contrast
    const strategy2 = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .linear(1.5, -(128 * 0.5)) // Increase contrast
      .sharpen()
      .png()
      .toBuffer();
    const path2 = path.join(outputDir, `page-${pageNum}-strategy2-highcontrast.png`);
    fs.writeFileSync(path2, strategy2);
    variants.push({ name: 'highcontrast', buffer: strategy2, path: path2 });

    // Strategy 3: Adaptive Threshold
    const strategy3 = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .threshold(128, { greyscale: false })
      .png()
      .toBuffer();
    const path3 = path.join(outputDir, `page-${pageNum}-strategy3-threshold.png`);
    fs.writeFileSync(path3, strategy3);
    variants.push({ name: 'threshold', buffer: strategy3, path: path3 });

    // Strategy 4: Inverted (for dark backgrounds)
    const strategy4 = await sharp(imageBuffer).grayscale().normalize().negate().png().toBuffer();
    const path4 = path.join(outputDir, `page-${pageNum}-strategy4-inverted.png`);
    fs.writeFileSync(path4, strategy4);
    variants.push({ name: 'inverted', buffer: strategy4, path: path4 });

    // Strategy 5: Extreme denoise + sharpen
    const strategy5 = await sharp(imageBuffer)
      .grayscale()
      .median(3)
      .normalize()
      .sharpen({ sigma: 3 })
      .modulate({ brightness: 1.2 })
      .png()
      .toBuffer();
    const path5 = path.join(outputDir, `page-${pageNum}-strategy5-denoised.png`);
    fs.writeFileSync(path5, strategy5);
    variants.push({ name: 'denoised', buffer: strategy5, path: path5 });
  } catch (error: any) {
    console.warn(`  ⚠️  Some preprocessing variants failed: ${error.message}`);
  }

  return variants;
}

/**
 * Try OCR with multiple PSM modes
 */
async function tryMultiplePSMModes(
  worker: any,
  imageBuffer: Buffer
): Promise<{ text: string; confidence: number; psm: number } | null> {
  const psmModes = [
    PSM.AUTO,
    PSM.SINGLE_BLOCK,
    PSM.SINGLE_COLUMN,
    PSM.AUTO_OSD, // Automatic with orientation detection
  ];

  let bestResult: { text: string; confidence: number; psm: number } | null = null;

  for (const psm of psmModes) {
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: psm,
      });

      const {
        data: { text, confidence },
      } = await worker.recognize(imageBuffer);

      if (text.trim().length > 0 && (!bestResult || confidence > bestResult.confidence)) {
        bestResult = { text, confidence, psm };
      }
    } catch (error) {
      // Skip failed PSM modes
    }
  }

  return bestResult;
}

/**
 * Ultimate extraction with all strategies
 */
async function extractPDFUltimate(
  pdfPath: string,
  options: ExtractionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('\n🔥 ULTIMATE OCR - ALL STRATEGIES');
  console.log('='.repeat(70));
  console.log(`📄 PDF: ${path.basename(pdfPath)}`);
  console.log(`⚙️  Scale: ${opts.scale}x (~${opts.scale * 96} DPI)`);
  console.log(`⚙️  Strategies: 6 preprocessing variants × 4 PSM modes = 24 attempts/page`);
  console.log(`⚙️  Debug Images: ${opts.saveDebugImages ? 'Enabled' : 'Disabled'}\n`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  const outputDir = path.join(process.cwd(), 'ocr-debug-images');
  if (opts.saveDebugImages && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let pdfDoc: any;
  let worker: any;
  let allText = '';

  try {
    // Load PDF
    console.log('📚 Loading PDF...');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    console.log(`  ✅ Loaded ${numPages} pages\n`);

    // Initialize Tesseract
    console.log('🔧 Initializing Tesseract OCR...');
    worker = await createWorker('eng', OEM.LSTM_ONLY);

    // Set base parameters (PSM will be changed dynamically)
    await worker.setParameters({
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}.,;:!?+-×÷=<>≤≥≠≈°∠△▲▼◀▶●○π√∑∫∞∈∉⊂⊃∪∩∅/\'"% \n\t',
      preserve_interword_spaces: '1',
    });

    console.log(`  ✅ Ready\n`);

    // Process pages
    const start = opts.startPage || 1;
    const end = Math.min(opts.endPage || numPages, numPages);

    console.log(`🔍 Processing pages ${start} to ${end}...\n`);

    for (let pageNum = start; pageNum <= end; pageNum++) {
      const pageStartTime = Date.now();
      console.log(`📄 Page ${pageNum}/${end}:`);

      try {
        // Render page
        console.log(`  📖 Rendering at ${opts.scale}x scale...`);
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: opts.scale! });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageBuffer = canvas.toBuffer('image/png');
        console.log(
          `  ✅ Rendered ${(imageBuffer.length / 1024).toFixed(1)} KB (${Math.round(viewport.width)}×${Math.round(viewport.height)}px)`
        );

        // Create preprocessing variants
        console.log(`  🔧 Creating ${opts.saveDebugImages ? '6' : '5'} preprocessing variants...`);
        const variants = await createPreprocessingVariants(imageBuffer, pageNum, outputDir);
        console.log(`  ✅ Created ${variants.length} variants`);

        // Try each variant with multiple PSM modes
        let bestResult: { text: string; confidence: number; variant: string; psm: number } | null =
          null;

        console.log(`  🔍 Testing variants...`);
        for (const variant of variants) {
          process.stdout.write(`    - ${variant.name}: `);

          const result = await tryMultiplePSMModes(worker, variant.buffer);

          if (result && result.text.trim().length > 0) {
            process.stdout.write(
              `✅ ${result.text.length} chars (${Math.round(result.confidence)}% conf, PSM ${result.psm})\n`
            );

            if (
              !bestResult ||
              result.text.length > bestResult.text.length ||
              result.confidence > bestResult.confidence
            ) {
              bestResult = {
                text: result.text,
                confidence: result.confidence,
                variant: variant.name,
                psm: result.psm,
              };
            }
          } else {
            process.stdout.write(`❌ no text\n`);
          }
        }

        // Add best result
        if (bestResult && bestResult.text.trim()) {
          allText += `\n\n--- Page ${pageNum} (${bestResult.variant}, PSM ${bestResult.psm}, ${Math.round(bestResult.confidence)}%) ---\n\n${bestResult.text.trim()}`;
          const duration = ((Date.now() - pageStartTime) / 1000).toFixed(1);
          console.log(
            `  ✅ BEST: "${bestResult.variant}" with ${bestResult.text.length} chars (${duration}s)`
          );
        } else {
          console.log(`  ❌ No text extracted from any variant`);
        }
      } catch (pageError: any) {
        console.error(`  ❌ Error: ${pageError.message}`);
      }

      console.log('');
    }

    console.log('\n✅ ULTIMATE OCR COMPLETE!');
    console.log(`📊 Total characters: ${allText.length}`);
    console.log(`📄 Pages processed: ${end - start + 1}\n`);

    if (opts.saveDebugImages) {
      console.log(`🖼️  Debug images saved to: ${outputDir}`);
    }
  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    throw error;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore
      }
    }
  }

  return allText;
}

/**
 * CLI
 */
async function main() {
  const pdfPath = process.argv[2];
  const startPage = process.argv[3] ? parseInt(process.argv[3]) : undefined;
  const endPage = process.argv[4] ? parseInt(process.argv[4]) : undefined;
  const outputPath = process.argv[5] || 'extracted-ultimate.txt';

  if (!pdfPath) {
    console.log('USAGE:');
    console.log('  npx tsx scripts/extract-pdf-ultimate.ts <PDF> [START] [END] [OUTPUT]');
    console.log('\nEXAMPLE:');
    console.log('  npx tsx scripts/extract-pdf-ultimate.ts "document.pdf" 1 10 "output.txt"');
    process.exit(1);
  }

  const text = await extractPDFUltimate(pdfPath, {
    startPage,
    endPage,
    scale: 4,
    saveDebugImages: true,
  });

  fs.writeFileSync(outputPath, text);
  console.log(`💾 Saved to: ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { extractPDFUltimate };
