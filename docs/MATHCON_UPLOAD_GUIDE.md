# 📚 MathCON Question Upload Guide

## Quick Summary

The MathCON PDF (151 pages, 37MB) contains scanned images. MathCON support has been added to the **universal extractor** system (`scripts/extract.ts`).

## 🎯 MathCON Configuration

MathCON is now integrated into `EXAM_CONFIGS`:

- **Display Name:** MathCON
- **Output File:** `mathcon-questions.json`
- **Difficulty:** Questions 1-10 (EASY), 11-20 (MEDIUM), 21+ (HARD)
- **Method:** PDF extraction + manual entry or JSON import

## ✅ Option 1: Web Interface (Easiest)

1. **Open the app**: http://localhost:3000/library/add
2. **Fill in the form**:
   - Question Text: Copy from PDF
   - Exam Name: `MathCON`
   - Exam Year: `2024`
   - Question Number: `1`, `2`, `3`, etc.
   - Topic: Choose from dropdown or enter custom
   - Difficulty: `EASY` (Q1-10), `MEDIUM` (Q11-20), `HARD` (Q21+)
   - Options A-E: Enter each option
   - Mark the correct answer
3. **Click "Add Question"**
4. **Repeat** for each question

## ✅ Option 2: JSON Bulk Upload (Faster for many questions)

### Step 1: Edit the Template

Open `mathcon-template.json` and add your questions:

```json
[
  {
    "examName": "MathCON",
    "examYear": 2024,
    "questionNumber": "1",
    "questionText": "What is 12 × 8?",
    "options": [
      { "letter": "A", "text": "84", "isCorrect": false },
      { "letter": "B", "text": "96", "isCorrect": true },
      { "letter": "C", "text": "104", "isCorrect": false },
      { "letter": "D", "text": "112", "isCorrect": false },
      { "letter": "E", "text": "120", "isCorrect": false }
    ],
    "topic": "Arithmetic",
    "difficulty": "EASY",
    "hasImage": false
  }
]
```

### Step 2: Import to Database

```bash
npx tsx scripts/import.ts mathcon-template.json
```

## 📋 Available Topics

- Arithmetic
- Algebra
- Geometry
- Number Theory
- Counting & Probability
- Logic & Reasoning
- Word Problems
- Patterns & Sequences

## 🎯 Difficulty Guidelines

- **EASY** (Questions 1-10): Basic calculations, simple concepts
- **MEDIUM** (Questions 11-20): Multi-step problems, moderate reasoning
- **HARD** (Questions 21+): Complex problems, advanced concepts

## 💡 Tips

1. **Copy-paste carefully** - Ensure mathematical symbols are preserved
2. **Double-check correct answers** - Mark `"isCorrect": true` only for the right option
3. **Use consistent formatting** - Keep JSON syntax valid
4. **Save frequently** - Don't lose your work
5. **Test small batches first** - Import 5-10 questions to verify format

## 🚀 Quick Start Commands

```bash
# Method 1: Start dev server and use web interface
npm run dev
# Navigate to: http://localhost:3000/library/add

# Method 2: Edit template and import
code mathcon-template.json  # or use any text editor
npx tsx scripts/import.ts mathcon-template.json

# Check database after import
PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -c "SELECT COUNT(*) FROM questions WHERE \"examName\" = 'MathCON';"
```

## ❓ Need Help?

- **JSON validation errors**: Check for missing commas, quotes, or brackets
- **Import fails**: Verify database is running and format is correct
- **Questions don't appear**: Refresh the library page and check filters

## 📊 Progress Tracking

Keep track of which questions you've added:

- Total MathCON questions in PDF: ~150 (estimate based on 151 pages)
- Questions added so far: Run query above to check
- Remaining: Calculate difference

---

**Ready to start?** Choose your preferred method and begin adding questions! 🎓
