#!/usr/bin/env python3
"""
Alternative PDF extraction using Python libraries
"""
import sys
import os
from pathlib import Path

try:
    import PyPDF2
    from PIL import Image
    import pytesseract
except ImportError:
    print("[ERROR] Missing dependencies. Install with:")
    print("   pip install PyPDF2 Pillow pytesseract")
    sys.exit(1)

def extract_text_pypdf2(pdf_path, start_page=1, end_page=None):
    """Extract text directly from PDF if possible"""
    print(f"\nExtracting text from: {Path(pdf_path).name}")
    print("="*70)

    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        num_pages = len(reader.pages)
        print(f"Total pages: {num_pages}\n")

        end = end_page or num_pages
        end = min(end, num_pages)

        all_text = []
        for i in range(start_page - 1, end):
            page = reader.pages[i]
            text = page.extract_text()

            if text.strip():
                print(f"[OK] Page {i+1}: {len(text)} characters")
                all_text.append(f"\n\n--- Page {i+1} ---\n\n{text}")
            else:
                print(f"[BLANK] Page {i+1}: No text (likely scanned image)")

        return ''.join(all_text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("USAGE: python extract-with-python.py <PDF> [START] [END] [OUTPUT]")
        print("NOTE: Extracts text directly from PDF (no OCR, only works if PDF has text layer)")
        sys.exit(1)

    pdf_path = sys.argv[1]
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    end = int(sys.argv[3]) if len(sys.argv) > 3 else None
    output = sys.argv[4] if len(sys.argv) > 4 else "extracted-python.txt"

    text = extract_text_pypdf2(pdf_path, start, end)

    with open(output, 'w', encoding='utf-8') as f:
        f.write(text)

    print(f"\nSaved to: {output}")
    print(f"Total characters: {len(text)}")

    if text:
        print("\nPreview (first 500 chars):")
        print("-"*70)
        print(text[:500])
        print("-"*70)
    else:
        print("\n[WARNING] No text extracted - PDF is likely scanned images")
        print("[INFO] Need OCR to extract text from scanned images")
