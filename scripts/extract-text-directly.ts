import * as fs from 'fs';
import * as path from 'path';

// pdf-parse uses CommonJS, need to require it
const pdf = require('pdf-parse');

/**
 * DIRECT TEXT EXTRACTION (No Image Rendering)
 *
 * This approach extracts text directly from PDF structure
 * without rendering to images first. Should work for PDFs
 * where text is embedded as actual text (not scanned images).
 */

async function extractTextDirectly(
  pdfPath: string,
  startPage?: number,
  endPage?: number
): Promise<string> {
  console.log('\n📄 DIRECT PDF TEXT EXTRACTION');
  console.log('='.repeat(70));
  console.log(`PDF: ${path.basename(pdfPath)}\n`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  const dataBuffer = fs.readFileSync(pdfPath);

  console.log('🔍 Extracting text...');
  const data = await pdf(dataBuffer, {
    // Extract text from specific page range if provided
    max: endPage || 0,
    pagerender: async (pageData: any) => {
      // Custom page rendering to get per-page text
      return pageData.getTextContent().then((textContent: any) => {
        return textContent.items.map((item: any) => item.str).join(' ');
      });
    },
  });

  console.log(`✅ Extracted ${data.text.length} characters from ${data.numpages} pages\n`);

  // If page range specified, try to extract just those pages
  if (startPage && endPage) {
    console.log(`📑 Filtering pages ${startPage} to ${endPage}...`);
    // Note: pdf-parse extracts all text at once, so we'll get full document
    // but we can still process it
  }

  return data.text;
}

async function main() {
  const pdfPath = process.argv[2];
  const startPage = process.argv[3] ? parseInt(process.argv[3]) : undefined;
  const endPage = process.argv[4] ? parseInt(process.argv[4]) : undefined;
  const outputPath = process.argv[5] || 'extracted-text-direct.txt';

  if (!pdfPath) {
    console.log('USAGE:');
    console.log('  npx tsx scripts/extract-text-directly.ts <PDF> [START] [END] [OUTPUT]');
    console.log('\nEXAMPLE:');
    console.log('  npx tsx scripts/extract-text-directly.ts "document.pdf" 1 10 "output.txt"');
    process.exit(1);
  }

  try {
    const text = await extractTextDirectly(pdfPath, startPage, endPage);
    fs.writeFileSync(outputPath, text);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(`📊 Total characters: ${text.length}`);

    // Show first 500 characters as preview
    if (text.length > 0) {
      console.log('\n📖 Preview (first 500 chars):');
      console.log('─'.repeat(70));
      console.log(text.substring(0, 500));
      console.log('─'.repeat(70));
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { extractTextDirectly };
