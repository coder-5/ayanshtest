# 📊 Universal Extractor & Importer System Status

**Last Updated:** October 12, 2025
**Status:** ✅ Production Ready with MathCON Support Added

---

## 🎯 Universal Extractor (`scripts/extract.ts`)

### **Supported Exam Types:**

| Exam Type        | Display Name     | Years                | Problems/Exam | Output File                   | Status     |
| ---------------- | ---------------- | -------------------- | ------------- | ----------------------------- | ---------- |
| **AMC8**         | AMC 8            | 26 years (1999-2025) | 25            | `amc8-questions.json`         | ✅ Active  |
| **MOEMS**        | MOEMS Division E | 18 years (2006-2023) | 5             | `moems-questions.json`        | ✅ Active  |
| **MATHKANGAROO** | Math Kangaroo    | 10 years (2015-2024) | 24            | `mathkangaroo-questions.json` | ✅ Active  |
| **MATHCON**      | MathCON          | 1 year (2024)        | 30            | `mathcon-questions.json`      | ✅ **NEW** |

### **Features:**

- ✅ Universal LaTeX cleaning (converts to Unicode)
- ✅ Automatic diagram detection & download
- ✅ Solution extraction (text + video links)
- ✅ Correct answer detection from multiple patterns
- ✅ Difficulty classification (EASY/MEDIUM/HARD)
- ✅ Progress saving (resume after interruption)
- ✅ Rate limiting (1000ms between requests)
- ✅ Retry logic (3 attempts per problem)
- ✅ PDF extraction with OCR support
- ✅ Word document extraction (.docx, .doc)
- ✅ Image OCR extraction (.png, .jpg, etc.)

### **Usage:**

```bash
# Web scraping (AMC8, MOEMS, Math Kangaroo)
npx tsx scripts/extract.ts AMC8
npx tsx scripts/extract.ts MOEMS
npx tsx scripts/extract.ts MATHKANGAROO

# PDF extraction (for MathCON or other PDFs)
# Option 1: Extract raw text
npx tsx -e "
import { extractFromPDF } from './scripts/extract.ts';
const text = await extractFromPDF('./mathcon-grade5.pdf');
console.log(text);
"

# Option 2: Extract with OCR (for scanned PDFs)
npx tsx -e "
import { extractFromPDFWithOCR } from './scripts/extract.ts';
const text = await extractFromPDFWithOCR('./mathcon-grade5.pdf');
console.log(text);
"
```

---

## 📥 Universal Importer (`scripts/import.ts`)

### **Purpose:**

Imports extracted questions from JSON files into the PostgreSQL database.

### **Features:**

- ✅ Validates question format
- ✅ Creates questions with options
- ✅ Links solutions (text + video)
- ✅ Handles duplicate detection
- ✅ Batch processing
- ✅ Progress reporting
- ✅ Error handling with rollback

### **Usage:**

```bash
# Import any extracted questions
npx tsx scripts/import.ts amc8-questions.json
npx tsx scripts/import.ts moems-questions.json
npx tsx scripts/import.ts mathkangaroo-questions.json
npx tsx scripts/import.ts mathcon-questions.json

# Import manually created questions
npx tsx scripts/import.ts mathcon-template.json
```

### **JSON Format:**

```json
[
  {
    "examName": "MathCON",
    "examYear": 2024,
    "questionNumber": "1",
    "questionText": "What is 5 + 3?",
    "options": [
      { "letter": "A", "text": "6", "isCorrect": false },
      { "letter": "B", "text": "7", "isCorrect": false },
      { "letter": "C", "text": "8", "isCorrect": true },
      { "letter": "D", "text": "9", "isCorrect": false },
      { "letter": "E", "text": "10", "isCorrect": false }
    ],
    "solution": "5 + 3 = 8",
    "videoLinks": ["https://youtube.com/..."],
    "topic": "Arithmetic",
    "difficulty": "EASY",
    "hasImage": false,
    "imageUrl": null
  }
]
```

---

## 🔧 Current Infrastructure

### **Files:**

- `scripts/extract.ts` (1,021 lines) - Universal extractor
- `scripts/import.ts` (7.6 KB) - Universal importer
- `mathcon-template.json` - Template for manual entry
- `MATHCON_UPLOAD_GUIDE.md` - Step-by-step guide

### **Helper Functions:**

- `cleanLaTeX()` - LaTeX to Unicode conversion
- `extractOptions()` - Multi-method option extraction
- `extractQuestionText()` - Question text parsing
- `detectDiagrams()` - Diagram URL detection
- `downloadDiagram()` - Image downloading
- `extractSolution()` - Solution extraction
- `extractFromPDF()` - PDF text extraction
- `extractFromPDFWithOCR()` - OCR-enhanced PDF extraction
- `extractFromWord()` - Word document extraction
- `extractFromImage()` - OCR image extraction
- `extractFromFile()` - Auto-detect file type

---

## 📈 Database Status

### **Current Question Count:**

```bash
# Check total questions
PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -c "SELECT COUNT(*) FROM questions WHERE \"deletedAt\" IS NULL;"
# Result: 642 active questions (updated October 12, 2025)

# Check by exam
PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -c "
SELECT \"examName\", COUNT(*) as count
FROM questions
WHERE \"deletedAt\" IS NULL
GROUP BY \"examName\"
ORDER BY count DESC;
"

# MathCON Status:
# - 16 questions imported (10 from 2019, 6 from 2022)
# - Years available: 2019, 2022
# - Topics: Algebra, Geometry, Number Theory, Patterns & Sequences, Counting & Probability
```

---

## 🚀 MathCON Integration Summary

### **What Was Done:**

1. ✅ Added MathCON to `EXAM_CONFIGS` in `scripts/extract.ts`
2. ✅ Configured difficulty mapping (Q1-10: EASY, Q11-20: MEDIUM, Q21+: HARD)
3. ✅ Set output file: `mathcon-questions.json`
4. ✅ Created template: `mathcon-template.json`
5. ✅ Updated guide: `MATHCON_UPLOAD_GUIDE.md`
6. ✅ Removed temporary scripts (kept universal system only)
7. ✅ **Extracted and imported 16 MathCON questions from PDF (October 12, 2025)**
   - 10 questions from 2019 Finals
   - 6 questions from 2022 Finals
   - All questions validated with correct answers

### **MathCON Workflow:**

**Option 1: Manual Entry (Recommended for Quality)**

```bash
# Open web interface
http://localhost:3000/library/add

# Fill in each question manually from PDF
# - Ensures accuracy
# - Best for small batches
```

**Option 2: JSON Bulk Import**

```bash
# 1. Edit template
code mathcon-template.json

# 2. Add questions from PDF (copy-paste carefully)

# 3. Import to database
npx tsx scripts/import.ts mathcon-template.json

# 4. Verify
PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -c "
SELECT COUNT(*) FROM questions WHERE \"examName\" = 'MathCON';
"
```

**Option 3: PDF Extraction + Manual Cleanup**

```bash
# 1. Extract text (already done)
# File: mathcon-grade5.pdf extracted 15,366 chars

# 2. Parse questions (found 44 potential)
# Issue: Options not properly formatted in scanned PDF

# 3. Manual review needed for question parsing
# Recommended: Use Option 1 or 2 above
```

---

## 📊 System Capabilities

### **Extraction Methods:**

| Source Type         | Method        | Quality              | Speed              |
| ------------------- | ------------- | -------------------- | ------------------ |
| **Web (AoPS Wiki)** | HTML scraping | ⭐⭐⭐⭐⭐ Excellent | 🐌 Slow (1s delay) |
| **PDF (text)**      | pdf-parse     | ⭐⭐⭐⭐ Good        | 🚀 Fast            |
| **PDF (scanned)**   | Tesseract OCR | ⭐⭐⭐ Fair          | 🐢 Moderate        |
| **Word (.docx)**    | mammoth       | ⭐⭐⭐⭐⭐ Excellent | 🚀 Fast            |
| **Image**           | Tesseract OCR | ⭐⭐⭐ Fair          | 🐢 Moderate        |

### **Import Validation:**

- ✅ Question text (1-5000 chars)
- ✅ Exam name & year
- ✅ Options (5 required: A-E)
- ✅ Exactly one correct answer
- ✅ Difficulty (EASY, MEDIUM, HARD, EXPERT)
- ✅ Topic validation
- ✅ Duplicate detection (examName + examYear + questionNumber)

---

## 🎯 Recommended Next Steps for MathCON

1. **Decide on approach:**
   - Small batch (1-10 questions): Use web interface
   - Large batch (20+ questions): Use JSON template

2. **Quality vs Speed:**
   - **High quality needed**: Manual entry via web interface
   - **Speed priority**: JSON bulk upload (but verify accuracy)

3. **Progress tracking:**
   ```bash
   # Check how many MathCON questions added
   PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -c "
   SELECT COUNT(*) as mathcon_questions
   FROM questions
   WHERE \"examName\" = 'MathCON' AND \"deletedAt\" IS NULL;
   "
   ```

---

## 📞 Support

- **Web Interface:** http://localhost:3000/library/add
- **Template:** `mathcon-template.json`
- **Guide:** `MATHCON_UPLOAD_GUIDE.md`
- **Database Check:** Use psql commands above

**System is ready for MathCON question upload!** 🎉
