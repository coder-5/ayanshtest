# MathCON Extraction & Upload Flowchart - Gap Analysis

**Date:** October 12, 2025
**Current Status:** 45 questions in DB | Expected: ~900 questions | **Gap: 855 questions (95%)**

---

## Complete Extraction & Upload Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ START: MathCON PDF (151 pages)                                  │
│ Expected: ~900 questions                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: PDF Rendering                                           │
│ Tool: poppler + pdf2image                                       │
│ Input: MathCON Grade 5 - Combined Files.pdf                     │
│ Output: 151 PNG images (one per page)                           │
│ Status: ✅ COMPLETE                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: OCR Text Extraction                                     │
│ Tool: Tesseract OCR v5.4.0                                      │
│ Input: 151 PNG images                                           │
│ Output: mathcon-all-pages-OCR.txt (129KB, 129,523 chars)       │
│ Status: ✅ COMPLETE                                             │
│ Quality: 70-80% accurate (math symbols corrupted)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Question Format Detection                               │
│ Analyze OCR text for question patterns                          │
│ Status: ✅ COMPLETE                                             │
│                                                                  │
│ Patterns Found:                                                 │
│ ├─ "Problem X" format: Pages 3-7 (10 questions)                │
│ ├─ Numbered "1." format: Pages 8-21 (24 questions)             │
│ ├─ [Topic, Points] format: 387 markers found                   │
│ └─ "Question #X" format: Pages 78-151 (156 questions)          │
│                                                                  │
│ Total Markers: ~236 unique question markers                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Question Parsing                                        │
│ Tool: scripts/parse-ocr-questions.ts                            │
│ Input: mathcon-all-pages-OCR.txt                                │
│ Output: mathcon-all-questions.json                              │
│ Status: ⚠️ PARTIAL (only 2 formats parsed)                     │
│                                                                  │
│ Parsed:                                                         │
│ ├─ "Question #X" format: 156 questions ✅                      │
│ ├─ Numbered "X." format: 24 questions ✅                       │
│ ├─ "Problem X" format: 0 questions ❌ NOT PARSED               │
│ └─ Weekly tests (pages 25-77): 0 questions ❌ NOT PARSED       │
│                                                                  │
│ Total Parsed: 180 questions                                     │
│ ⚠️ GAP: ~720 questions NOT parsed (pages 25-77)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Question Validation                                     │
│ Tool: scripts/validate-questions.ts                             │
│ Input: mathcon-all-questions.json (180 questions)               │
│ Status: ✅ COMPLETE                                             │
│                                                                  │
│ Results:                                                        │
│ ├─ Valid structure: 180 questions                              │
│ ├─ Errors: 18 (duplicate letters, missing text)                │
│ ├─ Warnings: 148 (mostly missing answers - expected)           │
│ └─ Average quality: 97.5/100                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Database Import                                         │
│ Tool: scripts/import.ts                                         │
│ Input: mathcon-all-questions.json (180 questions)               │
│ Status: ⚠️ PARTIAL SUCCESS                                     │
│                                                                  │
│ Results:                                                        │
│ ├─ Created: 12 new questions                                   │
│ ├─ Updated: 159 existing questions                             │
│ ├─ Errors: 9 (duplicate option letters)                        │
│ └─ Skipped: 0                                                  │
│                                                                  │
│ Total Imported: 171/180 questions (95%)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ FINAL: Database Status                                          │
│ PostgreSQL: ayansh_math_prep                                    │
│ Table: questions (WHERE examName = 'MathCON')                   │
│ Status: ✅ OPERATIONAL                                          │
│                                                                  │
│ Count by Year:                                                  │
│ ├─ 2019: 10 questions (manual entry)                           │
│ ├─ 2022: 6 questions (manual entry)                            │
│ └─ 2023: 29 questions (OCR import)                             │
│                                                                  │
│ Total: 45 questions                                             │
│ ⚠️ HUGE GAP: 855 questions missing (95% of expected 900)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## GAP ANALYSIS: Where Are The Missing 855 Questions?

### Gap Breakdown:

```
Expected:    900 questions
In Database:  45 questions
Missing:     855 questions (95%)
```

### **CRITICAL GAP #1: Weekly Tests NOT Parsed (Pages 25-77)**

**Location:** Pages 25-77 (53 pages)
**Content:** MathCON 2023 Weekly Practice Tests (Weeks 1-14+)
**Format:** Multiple questions per page, [Topic, Points] headers
**Status:** ❌ **NOT PARSED** by current parser
**Impact:** **~600-700 questions missing**

**Why Not Parsed:**

```
Current parser looks for:
  - "Question #X" format ✅
  - Numbered "X." format ✅

Weekly tests use:
  - Multiple questions per page ❌
  - No clear "Question #" markers ❌
  - Format: [Topic, Points] then question text ❌
  - Questions flow continuously ❌
```

**Example from Page 25:**

```
MathCON 2023 - Week 1 Grade 5 Weekly Practice Test

[Algebra, 3 Points]
Four parcels, three of which weigh 3, 5, and 7 pounds respectively...
A) 5 lb B) 7 lb C) 9 lb D) 11 lb

[Geometry, 3 Points]
In the figure shown, triangle ABC is equilateral...
A) 30° B) 45° C) 60° D) 90°

[Number Theory, 5 Points]
What is the smallest positive integer divisible by...
A) 60 B) 120 C) 180 D) 240

... (continues with 10-16 questions per page)
```

**Estimated Questions:**

- 14 weeks × ~40 questions/week = **~560 questions**
- Plus additional practice pages = **~600-700 questions**

---

### **GAP #2: Question Bank Duplicates (Pages 78-151)**

**Location:** Pages 78-151 (74 pages)
**Content:** Question Bank with answers
**Format:** "Question #X" format
**Status:** ✅ Parsed (156 questions)
**Impact:** None - already parsed

**But Wait - Are there MORE questions?**

Let me check if parser is skipping questions due to duplicate numbers:

```bash
# Parser found 156 questions from pages 78-151
# But there are 74 pages
# 156 / 74 = 2.1 questions per page (seems low)

# Expected: 3-5 questions per page × 74 pages = 220-370 questions
# Parsed: 156 questions
# Possible gap: 64-214 questions if multiple questions share same number
```

**Parser Issue:** May be skipping questions with duplicate question numbers across different sections/weeks.

---

### **GAP #3: Parser Skipped Incomplete Questions (56 questions)**

**Location:** Throughout all pages
**Status:** Skipped during parsing
**Reason:** "Skipped (incomplete): 56"
**Impact:** **56 questions missing**

**Why Skipped:**

- Less than 3 options found
- Question text too short
- Options not properly parsed (OCR errors)
- Text split across lines incorrectly

---

## CRITICAL GAPS SUMMARY

| Gap       | Location                   | Estimated Missing | Reason                                     | Fix Required                           |
| --------- | -------------------------- | ----------------- | ------------------------------------------ | -------------------------------------- |
| **#1**    | Pages 25-77 (Weekly Tests) | **~600-700**      | Parser doesn't handle weekly test format   | Build new parser for continuous format |
| **#2**    | Pages 78-151 (duplicates?) | **~64-214**       | May be skipping duplicate question numbers | Fix parser to handle duplicate numbers |
| **#3**    | All pages (incomplete)     | **56**            | OCR errors, incomplete parsing             | Improve parser robustness              |
| **#4**    | Import failures            | **9**             | Duplicate option letters                   | Manual cleanup                         |
| **TOTAL** |                            | **~730-980**      |                                            |                                        |

---

## ROOT CAUSE: Parser Only Handles 2 of 4 Formats

### Formats in PDF:

1. ✅ **"Question #X" format** (pages 78-151) - **PARSED** (156 questions)
2. ✅ **Numbered "X." format** (pages 8-21) - **PARSED** (24 questions)
3. ❌ **Weekly Test format** (pages 25-77) - **NOT PARSED** (~600-700 questions)
4. ❌ **Problem X format** (pages 3-7) - **NOT PARSED** (10 questions already in DB manually)

**Current parser coverage:** 2/4 formats = **50% coverage**
**Question coverage:** 180/900 = **20% coverage**

---

## SOLUTION: Build Comprehensive Parser for Weekly Tests

### **What Weekly Test Parser Needs:**

```typescript
// Current parser looks for clear markers:
if (line.match(/^Question\s+#\d+/)) { ... }  // Works for 156 questions
if (line.match(/^\d+\.$/)) { ... }           // Works for 24 questions

// Weekly test parser needs to:
// 1. Detect [Topic, Points] as question start marker
// 2. Extract question text until next [Topic, Points] or end of options
// 3. Parse options in middle of flowing text (A) text B) text C) text)
// 4. Handle 10-16 questions per page without numbering
// 5. Track question count across multiple pages/weeks
// 6. Handle page breaks mid-question
```

### **Implementation Plan:**

```typescript
function parseWeeklyTests(content: string, startPage: number, endPage: number) {
  // 1. Split by [Topic, Points] markers
  const topicPattern = /\[([^,]+),\s*(\d+)\s*Points?\]/g;

  // 2. For each section between markers:
  //    - Extract question text until options start
  //    - Parse inline options A) B) C) D)
  //    - Clean OCR artifacts
  //    - Assign sequential question numbers

  // 3. Handle multi-page questions:
  //    - Detect page break markers "--- Page X ---"
  //    - Continue parsing across page boundary

  // 4. Validate:
  //    - At least 2 options
  //    - Topic is valid
  //    - Points are 3, 5, or 7

  return questions;
}
```

---

## REVISED EXTRACTION WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Parse Question Bank (DONE) ✅                          │
│ Pages: 78-151 | Format: "Question #X"                          │
│ Result: 156 questions parsed                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Parse Sample Contest (DONE) ✅                         │
│ Pages: 8-21 | Format: Numbered "1."                            │
│ Result: 24 questions parsed                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Parse Weekly Tests (TODO) ❌ CRITICAL GAP             │
│ Pages: 25-77 | Format: [Topic, Points] continuous              │
│ Estimated: ~600-700 questions                                   │
│ Action Needed: Build new parser function                        │
│ Effort: 4-6 hours                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 4: Fix Duplicate Handling (TODO) ⚠️                      │
│ Issue: Questions with duplicate numbers may be skipped         │
│ Action: Update parser to handle duplicate question numbers     │
│ Estimated recovery: ~64-214 questions                           │
│ Effort: 1-2 hours                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 5: Import All Questions (TODO) ⏳                        │
│ Expected: 800-900 questions                                     │
│ All with isCorrect: false (user adds answers later)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## BOTTOM LINE: The Real Gap

### Current Status:

- ✅ Extracted: 180 questions (20% of expected)
- ✅ Imported: 171 questions (19% of expected)
- ✅ In Database: 45 questions (5% of expected - includes 16 manual)

### The Missing 95%:

- **~600-700 questions** on pages 25-77 (Weekly Tests) - **NOT PARSED**
- **~64-214 questions** possible duplicates in Question Bank - **MAY BE SKIPPED**
- **56 questions** incomplete parsing - **SKIPPED**
- **9 questions** failed import - **NEED FIXING**

### Why Only 5% Imported:

1. ❌ **Parser doesn't handle weekly test format** (biggest gap)
2. ❌ **Parser may skip duplicate question numbers**
3. ❌ **Parser rejects incomplete OCR text**
4. ❌ **Import fails on duplicate option letters**

---

## NEXT ACTIONS TO CLOSE GAP

### Priority 1: Build Weekly Test Parser (Closes 70-80% of gap)

```bash
# Create: scripts/parse-weekly-tests.ts
# Parse: Pages 25-77 (53 pages)
# Expected: ~600-700 questions
# Effort: 4-6 hours
# Impact: Get from 45 → 645-745 questions
```

### Priority 2: Fix Duplicate Number Handling (Closes 7-24% of gap)

```bash
# Update: scripts/parse-ocr-questions.ts
# Add: Unique ID generation for duplicate question numbers
# Expected: +64-214 questions
# Effort: 1-2 hours
# Impact: Get from 645-745 → 709-959 questions
```

### Priority 3: Improve OCR Error Handling (Closes 6% of gap)

```bash
# Update: scripts/parse-ocr-questions.ts
# Add: Better option parsing, text cleanup
# Expected: +56 questions
# Effort: 2-3 hours
# Impact: Get from 709-959 → 765-1015 questions
```

### Priority 4: Fix Import Failures (Closes 1% of gap)

```bash
# Manual: Fix 9 questions with duplicate option letters
# Effort: 15-30 minutes
# Impact: Get from 765-1015 → 774-1024 questions
```

---

## SUMMARY

**Current:** 45 questions (5% of expected 900)
**Real Capacity:** 800-900 questions in PDF
**Gap:** ~730-980 questions (81-109% more to extract)
**Root Cause:** Parser only handles 2 of 4 question formats
**Critical Missing:** Pages 25-77 (Weekly Tests) = ~600-700 questions

**To close gap:** Build weekly test parser (Priority 1) - this alone gets you to 70-80% of expected total.
