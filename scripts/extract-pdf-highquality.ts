import { fromPath } from 'pdf2pic';
import { createWorker, PSM, OEM } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * HIGH-QUALITY PDF OCR EXTRACTION
 *
 * This script uses:
 * 1. pdf2pic to convert PDF pages to high-resolution images (300 DPI)
 * 2. Sharp for image preprocessing (denoise, enhance contrast, sharpen)
 * 3. Tesseract.js with optimized settings for printed text
 *
 * Perfect for scanned documents like MathCON PDFs.
 */

interface ExtractionOptions {
  startPage?: number;
  endPage?: number;
  dpi?: number;
  preprocessImages?: boolean;
  saveImages?: boolean;
  outputDir?: string;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  dpi: 300,
  preprocessImages: true,
  saveImages: false,
};

/**
 * Preprocess image for optimal OCR
 */
async function preprocessImage(imagePath: string): Promise<string> {
  try {
    const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '-processed.png');

    await sharp(imagePath)
      // Convert to grayscale
      .grayscale()
      // Enhance contrast
      .normalize()
      // Sharpen text
      .sharpen({ sigma: 1.5 })
      // Increase brightness
      .modulate({ brightness: 1.05 })
      // Remove noise
      .median(2)
      // Threshold to make text crisp (adjust if needed)
      .threshold(180)
      // Save as PNG
      .png({ quality: 100, compressionLevel: 0 })
      .toFile(outputPath);

    return outputPath;
  } catch (error: any) {
    console.warn(`  ⚠️  Preprocessing failed: ${error.message}`);
    return imagePath; // Return original if preprocessing fails
  }
}

/**
 * Extract text from a single PDF page
 */
async function extractPageText(imagePath: string, worker: any, pageNum: number): Promise<string> {
  try {
    const startTime = Date.now();

    const {
      data: { text, confidence },
    } = await worker.recognize(imagePath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const confidencePercent = Math.round(confidence);

    console.log(`  ✅ Done in ${duration}s (confidence: ${confidencePercent}%)`);

    return text;
  } catch (error: any) {
    console.error(`  ❌ OCR failed: ${error.message}`);
    return '';
  }
}

/**
 * Extract text from PDF with high-quality OCR
 */
async function extractPDFHighQuality(
  pdfPath: string,
  options: ExtractionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('\n🚀 HIGH-QUALITY PDF OCR EXTRACTION');
  console.log('='.repeat(70));
  console.log(`📄 PDF: ${pdfPath}`);
  console.log(`⚙️  DPI: ${opts.dpi}`);
  console.log(`⚙️  Image Preprocessing: ${opts.preprocessImages ? 'Enabled' : 'Disabled'}`);
  console.log(`⚙️  Save Images: ${opts.saveImages ? 'Yes' : 'No'}\n`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Create temp directory for images
  const tempDir = opts.outputDir || path.join(process.cwd(), 'temp-ocr-images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let worker: any;
  let allText = '';

  try {
    // Initialize PDF to image converter
    const converter = fromPath(pdfPath, {
      density: opts.dpi || 300,
      saveFilename: 'page',
      savePath: tempDir,
      format: 'png',
      width: 2480, // ~300 DPI for 8.27" width
      height: 3508, // ~300 DPI for 11.69" height
    });

    // Get PDF info to determine page count
    console.log('📚 Analyzing PDF...');
    // For page count, we'll convert the first page to check
    const testConversion = await converter(1, { responseType: 'base64' });
    console.log(`  ℹ️  PDF loaded successfully\n`);

    // Initialize Tesseract with optimal settings
    console.log('🔧 Initializing Tesseract OCR...');
    worker = await createWorker('eng', OEM.LSTM_ONLY);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}.,;:!?+-×÷=<>≤≥°∠△▲π√∑∫/\'"% ',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
    });

    console.log('  ✅ Tesseract ready\n');

    // Determine page range
    const start = opts.startPage || 1;
    const end = opts.endPage || 151; // Default to all pages

    console.log(`🔍 Processing pages ${start} to ${end}...\n`);

    // Process each page
    for (let pageNum = start; pageNum <= end; pageNum++) {
      console.log(`📄 Page ${pageNum}/${end}:`);

      try {
        // Convert PDF page to image
        console.log(`  🖼️  Converting to image...`);
        const conversion = await converter(pageNum, { responseType: 'base64' });

        if (!conversion || !conversion.base64) {
          console.log(`  ⚠️  Failed to convert page ${pageNum}`);
          continue;
        }

        // Save image temporarily
        const imagePath = path.join(tempDir, `page-${pageNum}.png`);
        const imageBuffer = Buffer.from(conversion.base64, 'base64');
        fs.writeFileSync(imagePath, imageBuffer);

        // Preprocess image if enabled
        let processedPath = imagePath;
        if (opts.preprocessImages) {
          console.log(`  🔧 Preprocessing image...`);
          processedPath = await preprocessImage(imagePath);
        }

        // Run OCR
        console.log(`  🔍 Running OCR...`);
        const pageText = await extractPageText(processedPath, worker, pageNum);

        // Add to full text
        if (pageText.trim()) {
          allText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
          console.log(`  📝 Extracted ${pageText.length} characters`);
        } else {
          console.log(`  ℹ️  No text found on this page`);
        }

        // Clean up temp images unless saveImages is true
        if (!opts.saveImages) {
          try {
            fs.unlinkSync(imagePath);
            if (processedPath !== imagePath) {
              fs.unlinkSync(processedPath);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } catch (pageError: any) {
        console.error(`  ❌ Error processing page ${pageNum}: ${pageError.message}`);
      }

      console.log(''); // Blank line between pages
    }

    console.log('\n✅ EXTRACTION COMPLETE!');
    console.log(`📊 Total characters extracted: ${allText.length}`);
    console.log(`📄 Total pages processed: ${end - start + 1}\n`);
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
        // Ignore cleanup errors
      }
    }
  }

  return allText;
}

/**
 * CLI Usage
 */
async function main() {
  const pdfPath = process.argv[2];
  const startPage = process.argv[3] ? parseInt(process.argv[3]) : undefined;
  const endPage = process.argv[4] ? parseInt(process.argv[4]) : undefined;
  const outputPath = process.argv[5] || 'extracted-text.txt';

  if (!pdfPath) {
    console.log('USAGE:');
    console.log(
      '  npx tsx scripts/extract-pdf-highquality.ts <PDF_PATH> [START_PAGE] [END_PAGE] [OUTPUT_PATH]'
    );
    console.log('\nEXAMPLES:');
    console.log('  # Extract all pages');
    console.log('  npx tsx scripts/extract-pdf-highquality.ts "./document.pdf"');
    console.log('\n  # Extract pages 1-10');
    console.log('  npx tsx scripts/extract-pdf-highquality.ts "./document.pdf" 1 10');
    console.log('\n  # Extract specific range with custom output');
    console.log(
      '  npx tsx scripts/extract-pdf-highquality.ts "./document.pdf" 20 30 "./output.txt"'
    );
    process.exit(1);
  }

  const text = await extractPDFHighQuality(pdfPath, {
    startPage,
    endPage,
    dpi: 300,
    preprocessImages: true,
    saveImages: false,
  });

  fs.writeFileSync(outputPath, text);
  console.log(`💾 Saved extracted text to: ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { extractPDFHighQuality, ExtractionOptions };
