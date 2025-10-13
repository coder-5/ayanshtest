import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker, PSM, OEM } from 'tesseract.js';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * PRODUCTION-GRADE HIGH-QUALITY PDF OCR
 *
 * Technology Stack:
 * - pdfjs-dist: Mozilla's PDF.js (same as Firefox) for reliable PDF rendering
 * - canvas: Node canvas for rendering PDF pages to images
 * - Sharp: Image preprocessing (enhance contrast, denoise, sharpen)
 * - Tesseract.js: OCR with optimized settings
 *
 * This achieves the BEST possible OCR quality for scanned PDFs.
 */

interface ExtractionOptions {
  startPage?: number;
  endPage?: number;
  scale?: number; // Rendering scale (2 = 200%, 3 = 300%)
  preprocessImages?: boolean;
  saveImages?: boolean;
  outputDir?: string;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  scale: 3, // 3x scale = ~300 DPI quality
  preprocessImages: true,
  saveImages: false,
};

/**
 * Preprocess image buffer for optimal OCR
 */
async function preprocessImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      // Convert to grayscale
      .grayscale()
      // Enhance contrast
      .normalize()
      // Sharpen text edges
      .sharpen({ sigma: 1.5 })
      // Slight brightness boost
      .modulate({ brightness: 1.05 })
      // Denoise
      .median(2)
      // Output as PNG
      .png({ quality: 100, compressionLevel: 0 })
      .toBuffer();
  } catch (error: any) {
    console.warn(`  ⚠️  Preprocessing failed: ${error.message}`);
    return imageBuffer;
  }
}

/**
 * Render PDF page to PNG buffer
 */
async function renderPageToImage(page: any, scale: number): Promise<Buffer> {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toBuffer('image/png');
}

/**
 * Extract text from PDF with best-in-class OCR
 */
async function extractPDFBest(pdfPath: string, options: ExtractionOptions = {}): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('\n🚀 BEST-IN-CLASS PDF OCR EXTRACTION');
  console.log('='.repeat(70));
  console.log(`📄 PDF: ${path.basename(pdfPath)}`);
  console.log(`⚙️  Rendering Scale: ${opts.scale}x (~${opts.scale * 96} DPI)`);
  console.log(`⚙️  Image Preprocessing: ${opts.preprocessImages ? 'Enabled' : 'Disabled'}`);
  console.log(`⚙️  Save Images: ${opts.saveImages ? 'Yes' : 'No'}\n`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Create temp directory
  const tempDir = opts.outputDir || path.join(process.cwd(), 'temp-ocr-best');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
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

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}.,;:!?+-×÷=<>≤≥≠≈°∠△▲▼◀▶●○π√∑∫∞∈∉⊂⊃∪∩∅/\'"% \n',
      preserve_interword_spaces: '1',
    });

    console.log(`  ✅ Ready\n`);

    // Determine page range
    const start = opts.startPage || 1;
    const end = Math.min(opts.endPage || numPages, numPages);

    console.log(`🔍 Processing pages ${start} to ${end}...\n`);

    // Process each page
    for (let pageNum = start; pageNum <= end; pageNum++) {
      const startTime = Date.now();
      console.log(`📄 Page ${pageNum}/${end}:`);

      try {
        // Get page
        console.log(`  📖 Rendering page...`);
        const page = await pdfDoc.getPage(pageNum);

        // Render to image
        const imageBuffer = await renderPageToImage(page, opts.scale!);
        console.log(`  ✅ Rendered ${(imageBuffer.length / 1024).toFixed(1)} KB`);

        // Save original if requested
        if (opts.saveImages) {
          const origPath = path.join(tempDir, `page-${pageNum}-original.png`);
          fs.writeFileSync(origPath, imageBuffer);
        }

        // Preprocess
        let processedBuffer = imageBuffer;
        if (opts.preprocessImages) {
          console.log(`  🔧 Preprocessing...`);
          processedBuffer = await preprocessImageBuffer(imageBuffer);

          if (opts.saveImages) {
            const procPath = path.join(tempDir, `page-${pageNum}-processed.png`);
            fs.writeFileSync(procPath, processedBuffer);
          }
        }

        // OCR
        console.log(`  🔍 Running OCR...`);
        const {
          data: { text, confidence },
        } = await worker.recognize(processedBuffer);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const confidencePercent = Math.round(confidence);

        if (text.trim()) {
          allText += `\n\n--- Page ${pageNum} ---\n\n${text.trim()}`;
          console.log(
            `  ✅ Done in ${duration}s | ${text.length} chars | ${confidencePercent}% confidence`
          );
        } else {
          console.log(`  ℹ️  No text found`);
        }
      } catch (pageError: any) {
        console.error(`  ❌ Error: ${pageError.message}`);
      }

      console.log('');
    }

    console.log('\n✅ EXTRACTION COMPLETE!');
    console.log(`📊 Total characters extracted: ${allText.length}`);
    console.log(`📄 Pages processed: ${end - start + 1}\n`);
  } catch (error: any) {
    console.error(`\n❌ Extraction failed: ${error.message}`);
    throw error;
  } finally {
    // Cleanup
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore
      }
    }

    // Remove temp directory if not saving images
    if (!opts.saveImages && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
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
  const outputPath = process.argv[5] || 'extracted-text-best.txt';

  if (!pdfPath) {
    console.log('USAGE:');
    console.log(
      '  npx tsx scripts/extract-pdf-best.ts <PDF_PATH> [START_PAGE] [END_PAGE] [OUTPUT]'
    );
    console.log('\nEXAMPLES:');
    console.log('  npx tsx scripts/extract-pdf-best.ts "document.pdf"');
    console.log('  npx tsx scripts/extract-pdf-best.ts "document.pdf" 1 10');
    console.log('  npx tsx scripts/extract-pdf-best.ts "document.pdf" 20 30 "output.txt"');
    process.exit(1);
  }

  const text = await extractPDFBest(pdfPath, {
    startPage,
    endPage,
    scale: 3,
    preprocessImages: true,
    saveImages: false,
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

export { extractPDFBest, ExtractionOptions };
