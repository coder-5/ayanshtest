#!/usr/bin/env python3
"""
Extract images from PDF using pdf2image (poppler-based)
This should work better than pdfjs-dist for rendering
"""
import sys
import os
from pathlib import Path

try:
    from pdf2image import convert_from_path
    from PIL import Image
    import pytesseract

    # Configure Tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except ImportError as e:
    print(f"[ERROR] Missing dependencies: {e}")
    print("\nInstall with:")
    print("   pip install pdf2image Pillow pytesseract")
    print("\nAlso need poppler:")
    print("   Download from: https://github.com/oschwartz10612/poppler-windows/releases/")
    print("   Extract and add to PATH")
    sys.exit(1)

def extract_with_ocr(pdf_path, start_page=1, end_page=None, output_file="extracted-ocr.txt"):
    """Extract text using pdf2image + Tesseract OCR"""
    print(f"\nExtracting from: {Path(pdf_path).name}")
    print("="*70)
    print(f"Method: pdf2image (poppler) + Tesseract OCR")
    print(f"Pages: {start_page} to {end_page or 'end'}\n")

    try:
        # Convert PDF pages to images
        print("Converting PDF to images...")
        poppler_path = r'C:\Users\vihaa\poppler\poppler-24.08.0\Library\bin'
        images = convert_from_path(
            pdf_path,
            first_page=start_page,
            last_page=end_page,
            dpi=200,  # Good balance of quality and speed
            fmt='png',
            poppler_path=poppler_path
        )
        print(f"[OK] Converted {len(images)} pages to images\n")

        all_text = []
        for i, image in enumerate(images, start=start_page):
            print(f"[Page {i}] Running OCR...")

            # Run Tesseract OCR
            text = pytesseract.image_to_string(image, config='--psm 6')

            char_count = len(text.strip())
            if char_count > 0:
                print(f"  [OK] Extracted {char_count} characters")
                all_text.append(f"\n\n--- Page {i} ---\n\n{text}")
            else:
                print(f"  [BLANK] No text found")

        # Save results
        result = ''.join(all_text)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)

        print(f"\n[SUCCESS] Saved to: {output_file}")
        print(f"[STATS] Total characters: {len(result)}")

        if result:
            print(f"\n[PREVIEW] First 500 characters:")
            print("-"*70)
            print(result[:500])
            print("-"*70)
        else:
            print("\n[WARNING] No text extracted - all pages are blank or images")

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("USAGE: python extract-with-pdf2image.py <PDF> [START] [END] [OUTPUT]")
        print("\nExample:")
        print('  python extract-with-pdf2image.py "document.pdf" 1 10 output.txt')
        sys.exit(1)

    pdf_path = sys.argv[1]
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    end = int(sys.argv[3]) if len(sys.argv) > 3 else None
    output = sys.argv[4] if len(sys.argv) > 4 else "extracted-ocr.txt"

    if not os.path.exists(pdf_path):
        print(f"[ERROR] File not found: {pdf_path}")
        sys.exit(1)

    extract_with_ocr(pdf_path, start, end, output)
