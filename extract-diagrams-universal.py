#!/usr/bin/env python3
"""
Universal Math Competition Diagram Extractor
For legally purchased PDFs - personal use only

Supports:
- MOEMS Division E
- Math Kangaroo
- Any math competition PDF with similar structure
"""

import fitz  # PyMuPDF
import os
import re
from pathlib import Path
from PIL import Image
import io

# ============================================================================
# CONFIGURATION
# ============================================================================

PDFS = {
    'MOEMS': {
        'dir': r'C:\Users\vihaa\ayanshtest\web-app\moems-pdfs',
        'pattern': r'MOEMS Division E Practice Packet (\d{4})-(\d{4})\.pdf',
        'output_prefix': 'moems',
        'questions_with_diagrams': ['2A', '2D', '3C', '4B', '4D', '5B', '5E']
    },
    'Kangaroo': {
        'files': [r'C:\Users\vihaa\Downloads\mathkangaroo.pdf'],
        'output_prefix': 'kangaroo',
        'auto_detect': True  # Auto-detect which pages have diagrams
    }
}

OUTPUT_DIR = r'C:\Users\vihaa\ayanshtest\web-app\public\images\questions'

# Cropping presets
CROP_PRESETS = {
    'MOEMS': {
        'top_percent': 0.25,     # Skip top 25% (question text)
        'bottom_percent': 0.60,  # Use middle 35% (diagram area)
        'left_percent': 0.05,
        'right_percent': 0.95
    },
    'Kangaroo': {
        'top_percent': 0.20,
        'bottom_percent': 0.70,
        'left_percent': 0.10,
        'right_percent': 0.90
    },
    'default': {
        'top_percent': 0.25,
        'bottom_percent': 0.65,
        'left_percent': 0.05,
        'right_percent': 0.95
    }
}

# ============================================================================
# SMART DIAGRAM DETECTION
# ============================================================================

def has_significant_images(page):
    """Check if page has embedded images (likely diagrams)"""
    image_list = page.get_images(full=True)
    return len(image_list) > 0

def estimate_diagram_region(page):
    """
    Analyze page to find likely diagram location
    Returns: (top, bottom, left, right) percentages
    """
    # Get all drawing/image regions
    drawings = page.get_drawings()
    images = page.get_images(full=True)

    if not images and not drawings:
        return None

    page_rect = page.rect
    page_height = page_rect.height
    page_width = page_rect.width

    # Find bounding box of all graphics
    min_y, max_y = page_height, 0
    min_x, max_x = page_width, 0

    for img in images:
        bbox = page.get_image_bbox(img)
        min_y = min(min_y, bbox.y0)
        max_y = max(max_y, bbox.y1)
        min_x = min(min_x, bbox.x0)
        max_x = max(max_x, bbox.x1)

    if max_y > min_y and max_x > min_x:
        # Add 10% padding
        padding_y = (max_y - min_y) * 0.1
        padding_x = (max_x - min_x) * 0.1

        top_percent = max(0, (min_y - padding_y) / page_height)
        bottom_percent = min(1, (max_y + padding_y) / page_height)
        left_percent = max(0, (min_x - padding_x) / page_width)
        right_percent = min(1, (max_x + padding_x) / page_width)

        return (top_percent, bottom_percent, left_percent, right_percent)

    return None

# ============================================================================
# IMPROVED CROPPING
# ============================================================================

def crop_diagram_smart(pdf_document, page_num, output_path, preset='default', auto_detect=False, zoom=3.0):
    """
    Extract and crop diagram with smart detection or preset
    """
    page = pdf_document[page_num]
    page_rect = page.rect
    page_width = page_rect.width
    page_height = page_rect.height

    # Determine crop area
    if auto_detect:
        detected = estimate_diagram_region(page)
        if detected:
            top_p, bottom_p, left_p, right_p = detected
            print(f"    Auto-detected diagram: top={top_p:.2f}, bottom={bottom_p:.2f}")
        else:
            # Fallback to preset
            crop_settings = CROP_PRESETS.get(preset, CROP_PRESETS['default'])
            top_p = crop_settings['top_percent']
            bottom_p = crop_settings['bottom_percent']
            left_p = crop_settings['left_percent']
            right_p = crop_settings['right_percent']
            print(f"    Using preset crop")
    else:
        crop_settings = CROP_PRESETS.get(preset, CROP_PRESETS['default'])
        top_p = crop_settings['top_percent']
        bottom_p = crop_settings['bottom_percent']
        left_p = crop_settings['left_percent']
        right_p = crop_settings['right_percent']

    # Define crop rectangle
    crop_rect = fitz.Rect(
        page_width * left_p,
        page_height * top_p,
        page_width * right_p,
        page_height * bottom_p
    )

    # Render at high resolution
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=crop_rect)

    # Save as PNG
    pix.save(output_path)

    # Get file size for feedback
    file_size = os.path.getsize(output_path)
    return file_size

# ============================================================================
# PDF PROCESSING
# ============================================================================

def process_moems_pdf(pdf_path, year):
    """Process MOEMS PDF and extract diagrams"""
    print(f"\nProcessing MOEMS {year}: {os.path.basename(pdf_path)}")

    pdf_doc = fitz.open(pdf_path)
    total_pages = pdf_doc.page_count
    print(f"  Pages: {total_pages} (contests 1-{total_pages // 5})")

    diagrams_extracted = []
    questions_to_extract = PDFS['MOEMS']['questions_with_diagrams']

    for q_num in questions_to_extract:
        contest = int(q_num[0])
        letter = q_num[1]
        letter_pos = ord(letter) - ord('A')
        page_num = (contest - 1) * 5 + letter_pos

        if page_num >= total_pages:
            print(f"  SKIP: {q_num} (page {page_num}) - not in PDF")
            continue

        # Check if page has images
        if not has_significant_images(pdf_doc[page_num]):
            print(f"  SKIP: {q_num} (page {page_num}) - no images detected")
            continue

        output_filename = f"{PDFS['MOEMS']['output_prefix']}-{year}-{q_num}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        print(f"  Extracting {q_num} (page {page_num})...", end=" ")

        try:
            file_size = crop_diagram_smart(
                pdf_doc,
                page_num,
                output_path,
                preset='MOEMS',
                auto_detect=True
            )
            print(f"SUCCESS ({file_size // 1024}KB)")
            diagrams_extracted.append({
                'question': q_num,
                'filename': output_filename,
                'path': f"/images/questions/{output_filename}",
                'year': year
            })
        except Exception as e:
            print(f"ERROR: {e}")

    pdf_doc.close()
    return diagrams_extracted

def process_all_moems():
    """Process all MOEMS PDFs"""
    moems_dir = PDFS['MOEMS']['dir']
    pattern = re.compile(PDFS['MOEMS']['pattern'])

    all_diagrams = []

    for pdf_file in Path(moems_dir).glob("*.pdf"):
        match = pattern.match(pdf_file.name)
        if match:
            year_start, year_end = match.groups()
            year = year_end  # Use ending year as exam year

            diagrams = process_moems_pdf(str(pdf_file), year)
            all_diagrams.extend(diagrams)

    return all_diagrams

# ============================================================================
# SQL GENERATION
# ============================================================================

def generate_sql(diagrams, output_file='update-diagrams.sql'):
    """Generate SQL to update database"""
    if not diagrams:
        return None

    with open(output_file, 'w') as f:
        f.write("-- Auto-generated SQL to update diagrams\n")
        f.write("-- Run with: PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -f update-diagrams.sql\n\n")

        for item in diagrams:
            exam_name = 'MOEMS Division E' if 'moems' in item['filename'] else 'Math Kangaroo'

            f.write(f"-- Update {item['question']} ({item['year']})\n")
            f.write(f"UPDATE questions SET\n")
            f.write(f"  \"hasImage\" = true,\n")
            f.write(f"  \"imageUrl\" = '{item['path']}'\n")
            f.write(f"WHERE \"examName\" = '{exam_name}'\n")
            f.write(f"  AND \"examYear\" = '{item['year']}'\n")
            f.write(f"  AND \"questionNumber\" = '{item['question']}';\n\n")

    print(f"\nSQL saved to: {output_file}")
    return output_file

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("Universal Math Competition Diagram Extractor")
    print("For legally purchased PDFs - Personal use only")
    print("=" * 70)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Process MOEMS
    print("\n[1/2] Processing MOEMS PDFs...")
    print("-" * 70)
    moems_diagrams = process_all_moems()

    # Summary
    print("\n" + "=" * 70)
    print(f"COMPLETE: Extracted {len(moems_diagrams)} diagrams")
    print("=" * 70)

    # Generate SQL
    if moems_diagrams:
        generate_sql(moems_diagrams)

        print("\nNext steps:")
        print("1. Review extracted diagrams in: web-app/public/images/questions/")
        print("2. Run: PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -f update-diagrams.sql")
        print("3. Clear localStorage and test in practice mode")

if __name__ == "__main__":
    main()
