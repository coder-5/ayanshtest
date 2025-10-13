#!/usr/bin/env python3
"""
Complete MOEMS Question Extractor with OCR
Extracts questions, options, AND diagrams from MOEMS PDFs

Requirements:
    pip install pymupdf pytesseract pillow
    Install Tesseract: https://github.com/tesseract-ocr/tesseract
"""

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
import json
import os
from pathlib import Path

# Set Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ============================================================================
# CONFIGURATION
# ============================================================================

MOEMS_PDF_DIR = r"C:\Users\vihaa\ayanshtest\moems-pdfs"
OUTPUT_DIR = r"C:\Users\vihaa\ayanshtest"
IMAGE_DIR = r"C:\Users\vihaa\ayanshtest\web-app\public\images\questions"

# MOEMS structure: 5 questions per contest, 5 contests per year
# Each question is on a separate page
# Page 0 = Contest 1, Question A
# Page 1 = Contest 1, Question B
# ... etc

# ============================================================================
# OCR TEXT EXTRACTION
# ============================================================================

def extract_text_from_page(page):
    """
    Extract text from PDF page using OCR
    Returns raw OCR text
    """
    # Render page as high-resolution image
    zoom = 3.0  # High quality for better OCR
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)

    # Convert to PIL Image
    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))

    # Use Tesseract OCR
    try:
        text = pytesseract.image_to_string(img, lang='eng')
        return text
    except Exception as e:
        print(f"    OCR Error: {e}")
        return ""

# ============================================================================
# TEXT PARSING
# ============================================================================

def clean_text(text):
    """Clean OCR artifacts and normalize text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Fix common OCR mistakes
    text = text.replace('|', 'I')  # Vertical bar often mistaken for I
    text = text.replace('0O', '00')  # O vs 0
    return text.strip()

def parse_question_text(ocr_text):
    """
    Extract question text from OCR output
    Assumes question is everything before (A) or before a diagram
    """
    # Try to find where options start
    option_match = re.search(r'\([A-E]\)', ocr_text)

    if option_match:
        question_text = ocr_text[:option_match.start()].strip()
    else:
        # If no options found, take first 70% of text as question
        lines = ocr_text.split('\n')
        cutoff = int(len(lines) * 0.7)
        question_text = ' '.join(lines[:cutoff]).strip()

    return clean_text(question_text)

def parse_options(ocr_text):
    """
    Extract options (A) through (E) from OCR text
    Returns empty list if no options found (free-form answer question)
    """
    options = []

    for letter in ['A', 'B', 'C', 'D', 'E']:
        # Pattern: (A) text until next option or end
        next_letter = chr(ord(letter) + 1)
        pattern = rf'\({letter}\)\s*(.+?)(?=\({next_letter}\)|$)'

        match = re.search(pattern, ocr_text, re.DOTALL | re.IGNORECASE)

        if match:
            option_text = match.group(1).strip()
            # Clean up: remove newlines within option
            option_text = ' '.join(option_text.split())
            option_text = clean_text(option_text)

            # Only add if text is reasonable length
            if 1 < len(option_text) < 200:
                options.append({
                    'letter': letter,
                    'text': option_text,
                    'isCorrect': False  # Will need to determine correct answer separately
                })

    # Return empty list if no valid options (free-form answer question)
    return options

# ============================================================================
# DIAGRAM EXTRACTION
# ============================================================================

def extract_diagram_from_page(page, output_path):
    """
    Extract diagram from PDF page
    Uses middle portion of page (skip question text at top, answer space at bottom)
    """
    page_rect = page.rect
    page_width = page_rect.width
    page_height = page_rect.height

    # MOEMS layout: Question text top 20%, Diagram middle 40%, Answer space bottom 40%
    crop_rect = fitz.Rect(
        page_width * 0.05,      # left (5% margin)
        page_height * 0.20,     # top (skip question)
        page_width * 0.95,      # right (5% margin)
        page_height * 0.65      # bottom (keep diagram only)
    )

    # Render cropped area at high resolution
    zoom = 3.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=crop_rect)

    # Save as PNG
    pix.save(output_path)

    # Check if diagram has actual content (not just white space)
    file_size = os.path.getsize(output_path)
    return file_size > 5000  # At least 5KB to be considered a real diagram

# ============================================================================
# MAIN PROCESSING
# ============================================================================

def process_moems_pdf(pdf_path, exam_year):
    """
    Process MOEMS PDF and extract all questions
    """
    print(f"\n{'='*70}")
    print(f"Processing: {os.path.basename(pdf_path)}")
    print(f"Exam Year: {exam_year}")
    print(f"{'='*70}")

    pdf = fitz.open(pdf_path)
    questions = []

    total_pages = pdf.page_count
    contests = total_pages // 5

    print(f"Total pages: {total_pages} (Contests 1-{contests})")

    for page_num in range(total_pages):
        # Calculate contest number and question letter
        contest_num = (page_num // 5) + 1
        question_letter = chr(65 + (page_num % 5))  # A=0, B=1, etc.
        question_id = f"{contest_num}{question_letter}"

        print(f"\n  [{question_id}] Page {page_num + 1}/{total_pages}")

        page = pdf[page_num]

        # Extract text via OCR
        print(f"    - Running OCR...")
        ocr_text = extract_text_from_page(page)

        if not ocr_text:
            print(f"    ❌ No text extracted")
            continue

        # Parse question and options
        question_text = parse_question_text(ocr_text)
        options = parse_options(ocr_text)

        print(f"    - Question: {len(question_text)} chars")
        if options:
            print(f"    - Options: {len(options)}/5 found (Multiple choice)")
        else:
            print(f"    - Options: None (Free-form answer)")

        # Extract diagram
        diagram_filename = f"moems-{exam_year}-{question_id}.png"
        diagram_path = os.path.join(IMAGE_DIR, diagram_filename)

        os.makedirs(IMAGE_DIR, exist_ok=True)

        print(f"    - Extracting diagram...")
        has_diagram = extract_diagram_from_page(page, diagram_path)

        if not has_diagram:
            # Remove empty diagram file
            if os.path.exists(diagram_path):
                os.remove(diagram_path)

        # Build question object
        question = {
            'examName': 'MOEMS Division E',
            'examYear': int(exam_year),
            'questionNumber': question_id,
            'questionText': question_text,
            'options': options,
            'hasImage': has_diagram,
            'imageUrl': f'/images/questions/{diagram_filename}' if has_diagram else None,
            'topic': 'General Math',
            'difficulty': 'EASY' if question_letter == 'A' else ('MEDIUM' if question_letter in ['B', 'C'] else 'HARD')
        }

        questions.append(question)

        # Show status
        if options:
            status = "[OK]" if len(options) == 5 else "[WARN]"
        else:
            status = "[OK]"  # Free-form questions are valid without options
        diagram_status = "[IMG]" if has_diagram else "     "
        print(f"    {status} {diagram_status} Extracted")

    pdf.close()

    return questions

def find_moems_pdfs():
    """Find all MOEMS PDFs and extract year"""
    pdfs = []

    for pdf_file in Path(MOEMS_PDF_DIR).glob("*.pdf"):
        # Extract year from filename (e.g., "2006-2007" -> use 2007)
        match = re.search(r'(\d{4})-(\d{4})', pdf_file.name)
        if match:
            year = match.group(2)  # Use ending year
            pdfs.append({
                'path': str(pdf_file),
                'name': pdf_file.name,
                'year': year
            })

    return sorted(pdfs, key=lambda x: x['year'])

def main():
    print("="*70)
    print("MOEMS Complete Question Extractor with OCR")
    print("Extracts: Questions, Options, Diagrams")
    print("="*70)

    # Check if Tesseract is installed
    try:
        pytesseract.get_tesseract_version()
    except Exception:
        print("\n❌ ERROR: Tesseract OCR not installed!")
        print("Please install from: https://github.com/tesseract-ocr/tesseract")
        print("\nWindows: Download installer from GitHub releases")
        print("Mac: brew install tesseract")
        print("Linux: sudo apt-get install tesseract-ocr")
        return

    # Find all MOEMS PDFs
    pdfs = find_moems_pdfs()

    if not pdfs:
        print(f"\n❌ No MOEMS PDFs found in: {MOEMS_PDF_DIR}")
        return

    print(f"\nFound {len(pdfs)} MOEMS PDF(s):")
    for pdf in pdfs:
        print(f"  - {pdf['name']} (Year: {pdf['year']})")

    # Process all PDFs
    all_questions = []

    for pdf_info in pdfs:
        questions = process_moems_pdf(pdf_info['path'], pdf_info['year'])
        all_questions.extend(questions)

    # Save to JSON
    output_file = os.path.join(OUTPUT_DIR, 'moems-questions-ocr.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    # Summary
    print("\n" + "="*70)
    print("EXTRACTION COMPLETE!")
    print("="*70)
    print(f"Total questions: {len(all_questions)}")

    with_options = sum(1 for q in all_questions if q['options'])
    complete_options = sum(1 for q in all_questions if len(q['options']) == 5)
    free_form = len(all_questions) - with_options

    print(f"Multiple choice (with options): {with_options}")
    print(f"  - Complete (5 options): {complete_options}")
    print(f"  - Incomplete: {with_options - complete_options}")
    print(f"Free-form answer: {free_form}")
    print(f"With diagrams: {sum(1 for q in all_questions if q['hasImage'])}/{len(all_questions)}")
    print(f"\nSaved to: {output_file}")

    # Show sample
    if all_questions:
        print("\nSample question:")
        sample = all_questions[0]
        print(f"  Year: {sample['examYear']}")
        print(f"  Question: {sample['questionNumber']}")
        print(f"  Text: {sample['questionText'][:100]}...")
        print(f"  Options: {len(sample['options'])}")
        print(f"  Diagram: {sample['hasImage']}")

    print("\nNext steps:")
    print("1. Review extracted questions in: moems-questions-ocr.json")
    print("2. Check diagrams in: web-app/public/images/questions/")
    print("3. Upload to database using your upload script")

if __name__ == "__main__":
    main()
