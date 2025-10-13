import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

/**
 * Simple PDF check to understand its structure
 */

async function checkPDF(pdfPath: string) {
  console.log('\n📄 PDF STRUCTURE CHECK');
  console.log('='.repeat(70));

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const numPages = pdfDoc.getPageCount();
  console.log(`\n📊 Total pages: ${numPages}`);
  console.log(`📏 File size: ${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB\n`);

  // Check first few pages
  console.log('🔍 Checking first 5 pages...\n');
  for (let i = 0; i < Math.min(5, numPages); i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    console.log(`Page ${i + 1}: ${Math.round(width)} x ${Math.round(height)} pts`);

    try {
      const text = (await page.getTextContent?.()) || { items: [] };
      console.log(`  Text items: ${(text as any).items?.length || 'N/A'}`);
    } catch {
      console.log(`  Text items: Cannot extract (likely scanned image)`);
    }
  }

  console.log('\n✅ Check complete');
}

async function main() {
  const pdfPath =
    process.argv[2] || 'C:\\Users\\vihaa\\Downloads\\MathCON Grade 5 - Combined Files.pdf';
  await checkPDF(pdfPath);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
