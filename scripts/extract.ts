import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import * as mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// ============================================================================
// EXAM CONFIGURATION INTERFACE
// ============================================================================

interface ExamConfig {
  name: string; // Exam name (e.g., "AMC8", "MOEMS")
  displayName: string; // Display name for output
  urlPattern: string; // URL pattern with {year}, {examName}, {problemNum} placeholders
  years: number[]; // Years to scrape
  problemsPerExam: number | ((year: number) => number); // Number of problems (can vary by year)
  outputFile: string; // Output JSON file path
  diagramDir: string; // Directory to save diagrams

  // Difficulty mapping function
  getDifficulty: (
    problemNum: number,
    totalProblems: number
  ) => 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

  // Custom extraction overrides (optional)
  customQuestionExtractor?: (
    $: cheerio.CheerioAPI,
    problemDiv: cheerio.Cheerio<any>
  ) => string | null;
  customOptionExtractor?: (
    $: cheerio.CheerioAPI,
    problemDiv: cheerio.Cheerio<any>
  ) => string[] | null;
  customSolutionExtractor?: (
    $: cheerio.CheerioAPI
  ) => { text: string; rawText: string; videoLinks: string[] } | null;

  // Answer detection pattern (optional - defaults to standard pattern)
  answerPattern?: RegExp[];
}

// ============================================================================
// PREDEFINED EXAM CONFIGURATIONS
// ============================================================================

const EXAM_CONFIGS: Record<string, ExamConfig> = {
  AMC8: {
    name: 'AMC8',
    displayName: 'AMC 8',
    urlPattern:
      'https://artofproblemsolving.com/wiki/index.php/{year}_AMC_8_Problems/Problem_{problemNum}',
    years: [
      2025, 2024, 2023, 2022, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
      2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000, 1999,
    ],
    problemsPerExam: 25,
    outputFile: 'amc8-questions.json',
    diagramDir: path.join(__dirname, '..', 'public', 'images', 'questions'),
    getDifficulty: (problemNum, total) => {
      if (problemNum <= total / 2.5) return 'EASY';
      if (problemNum <= total / 1.25) return 'MEDIUM';
      return 'HARD';
    },
  },

  MOEMS: {
    name: 'MOEMS',
    displayName: 'MOEMS Division E',
    urlPattern:
      'https://artofproblemsolving.com/wiki/index.php/{year}_MOEMS_Division_E_Problems/Problem_{problemNum}',
    years: [
      2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009,
      2008, 2007, 2006,
    ],
    problemsPerExam: 5, // MOEMS has 5 problems per exam, multiple exams per year
    outputFile: 'moems-questions.json',
    diagramDir: path.join(__dirname, '..', 'public', 'images', 'questions'),
    getDifficulty: (problemNum, total) => {
      // MOEMS problems get progressively harder
      if (problemNum === 1) return 'EASY';
      if (problemNum <= 3) return 'MEDIUM';
      return 'HARD';
    },
  },

  MATHKANGAROO: {
    name: 'MATHKANGAROO',
    displayName: 'Math Kangaroo',
    urlPattern:
      'https://artofproblemsolving.com/wiki/index.php/{year}_Math_Kangaroo_Problems/Problem_{problemNum}',
    years: [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015],
    problemsPerExam: 24, // Math Kangaroo typically has 24 problems
    outputFile: 'mathkangaroo-questions.json',
    diagramDir: path.join(__dirname, '..', 'public', 'images', 'questions'),
    getDifficulty: (problemNum, total) => {
      if (problemNum <= 8) return 'EASY';
      if (problemNum <= 16) return 'MEDIUM';
      return 'HARD';
    },
  },

  MATHCON: {
    name: 'MATHCON',
    displayName: 'MathCON',
    urlPattern: '', // PDF-based, not web-scraped
    years: [2024], // Add more years as needed
    problemsPerExam: 30, // Typical MathCON problem count (adjust as needed)
    outputFile: 'mathcon-questions.json',
    diagramDir: path.join(__dirname, '..', 'public', 'images', 'questions'),
    getDifficulty: (problemNum, total) => {
      if (problemNum <= 10) return 'EASY';
      if (problemNum <= 20) return 'MEDIUM';
      return 'HARD';
    },
  },
};

// ============================================================================
// GENERAL CONFIGURATION
// ============================================================================

const RATE_LIMIT_MS = 1000;
const MAX_RETRIES = 3;

// ============================================================================
// COMPREHENSIVE LATEX CLEANING (UNIVERSAL - WORKS FOR ALL EXAMS)
// ============================================================================

function cleanLaTeX(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove dollar signs (both single and escaped)
  cleaned = cleaned.replace(/\\\$/g, '');
  cleaned = cleaned.replace(/\$/g, '');

  // Remove display math delimiters
  cleaned = cleaned.replace(/\\\[/g, '');
  cleaned = cleaned.replace(/\\\]/g, '');
  cleaned = cleaned.replace(/\\\(/g, '');
  cleaned = cleaned.replace(/\\\)/g, '');

  // Remove LaTeX artifacts from options (}\, \textbf{, etc.)
  cleaned = cleaned.replace(/\}\\\s*/g, '');
  cleaned = cleaned.replace(/\s*\\textbf\{/g, '');
  cleaned = cleaned.replace(/^\s*\}\s*/g, '');
  cleaned = cleaned.replace(/\s*\{\s*$/g, '');
  cleaned = cleaned.replace(/~\s*/g, '');
  cleaned = cleaned.replace(/\s*\}\s*$/g, '');

  // Convert fractions
  cleaned = cleaned.replace(/\\d?frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '($1/$2)');
  cleaned = cleaned.replace(/\\frac(\d)(\d)/g, '$1/$2');

  // Remove text formatting commands
  cleaned = cleaned.replace(/\\textbf\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\text\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\textit\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\textrm\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\mathrm\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\mathbf\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\mathit\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\boxed\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\boxed/g, '');
  cleaned = cleaned.replace(/\\emph\s*\{([^}]*)\}/g, '$1');

  // Remove spacing commands
  cleaned = cleaned.replace(/\\qquad/g, ' ');
  cleaned = cleaned.replace(/\\quad/g, ' ');
  cleaned = cleaned.replace(/\\,/g, '');
  cleaned = cleaned.replace(/\\!/g, '');
  cleaned = cleaned.replace(/\\;/g, ' ');
  cleaned = cleaned.replace(/\\:/g, ' ');
  cleaned = cleaned.replace(/\\ /g, ' ');

  // Convert special text commands
  cleaned = cleaned.replace(/\\ldots/g, '...');
  cleaned = cleaned.replace(/\\dots/g, '...');
  cleaned = cleaned.replace(/\\cdots/g, '...');

  // Convert geometry symbols to Unicode
  cleaned = cleaned.replace(/\\triangle\s*\{?([^}\s]*)\}?/g, '△$1');
  cleaned = cleaned.replace(/\\triangle/g, '△');
  cleaned = cleaned.replace(/\\angle\s*\{?([^}\s]*)\}?/g, '∠$1');
  cleaned = cleaned.replace(/\\angle/g, '∠');
  cleaned = cleaned.replace(/\\overline\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\underline\s*\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\parallel/g, '∥');
  cleaned = cleaned.replace(/\\perp/g, '⊥');
  cleaned = cleaned.replace(/\\cong/g, '≅');
  cleaned = cleaned.replace(/\\sim/g, '∼');

  // Convert Greek letters
  cleaned = cleaned.replace(/\\pi/g, 'π');
  cleaned = cleaned.replace(/\\alpha/g, 'α');
  cleaned = cleaned.replace(/\\beta/g, 'β');
  cleaned = cleaned.replace(/\\theta/g, 'θ');
  cleaned = cleaned.replace(/\\gamma/g, 'γ');
  cleaned = cleaned.replace(/\\delta/g, 'δ');
  cleaned = cleaned.replace(/\\Delta/g, 'Δ');
  cleaned = cleaned.replace(/\\phi/g, 'φ');
  cleaned = cleaned.replace(/\\Phi/g, 'Φ');

  // Convert operators
  cleaned = cleaned.replace(/\\times/g, '×');
  cleaned = cleaned.replace(/\\div/g, '÷');
  cleaned = cleaned.replace(/\\cdot/g, '·');
  cleaned = cleaned.replace(/\\circ/g, '°');
  cleaned = cleaned.replace(/\\pm/g, '±');
  cleaned = cleaned.replace(/\\mp/g, '∓');
  cleaned = cleaned.replace(/\\leq/g, '≤');
  cleaned = cleaned.replace(/\\geq/g, '≥');
  cleaned = cleaned.replace(/\\le/g, '≤');
  cleaned = cleaned.replace(/\\ge/g, '≥');
  cleaned = cleaned.replace(/\\neq/g, '≠');
  cleaned = cleaned.replace(/\\ne/g, '≠');
  cleaned = cleaned.replace(/\\approx/g, '≈');
  cleaned = cleaned.replace(/\\equiv/g, '≡');

  // Convert roots
  cleaned = cleaned.replace(/\\sqrt\s*\{([^}]*)\}/g, '√($1)');
  cleaned = cleaned.replace(/\\sqrt\[(\d+)\]\s*\{([^}]*)\}/g, '$1√($2)');

  // Convert subscripts and superscripts
  cleaned = cleaned.replace(/\^\{([^}]*)\}/g, '^$1');
  cleaned = cleaned.replace(/\_\{([^}]*)\}/g, '_$1');

  // Remove remaining LaTeX commands
  cleaned = cleaned.replace(/\\left/g, '');
  cleaned = cleaned.replace(/\\right/g, '');
  cleaned = cleaned.replace(/\\big/g, '');
  cleaned = cleaned.replace(/\\Big/g, '');
  cleaned = cleaned.replace(/\\limits/g, '');

  // Remove any remaining backslash commands
  cleaned = cleaned.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\[a-zA-Z]+/g, '');

  // Clean up braces
  cleaned = cleaned.replace(/\{([^}]*)\}/g, '$1');

  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

// ============================================================================
// UNIVERSAL OPTION EXTRACTION
// ============================================================================

function extractOptionsFromMultipleImages(
  $: cheerio.CheerioAPI,
  problemDiv: cheerio.Cheerio<any>,
  debug = false
): string[] {
  const optionImages: string[] = [];

  problemDiv.find('img[alt*="$"]').each((_, img) => {
    const alt = $(img).attr('alt') || '';

    // Skip Asymptote diagrams UNLESS they contain option markers
    if (alt.includes('[asy]') && !alt.match(/\\textbf\s*\{\s*\(([A-E])\)\s*\}/)) {
      return;
    }

    // Skip standalone answer markers
    if (alt.match(/^\$\\boxed\{\\textbf\{\([A-E]\)\}\}\$$/)) {
      return;
    }

    // Check if this image contains any option marker with content
    if (alt.match(/\\textbf\s*\{\s*\(([A-E])\)\s*\}/)) {
      optionImages.push(alt);
    }
  });

  const combinedText = optionImages.join(' ');
  if (!combinedText) return [];

  const options: string[] = [];

  // Pattern 1: \textbf{(A)}\ content - IMPROVED to handle complex LaTeX like fractions
  // Changed [^\\\(\$]+? to .+? to allow LaTeX commands between options
  const pattern1 = /\\textbf\s*\{\s*\(([A-E])\)\s*\}\\?\s*(.+?)(?=\\qquad|\\quad|\\textbf|$)/g;
  let match;

  while ((match = pattern1.exec(combinedText)) !== null) {
    const letter = match[1];
    let content = match[2];

    // Remove trailing artifacts
    content = content.replace(/~.*$/g, '');
    content = content.replace(/\s*\}+\s*$/g, ''); // Remove trailing braces
    content = content.replace(/\s*\$+\s*$/g, ''); // Remove trailing $

    content = cleanLaTeX(content);
    const index = letter.charCodeAt(0) - 65;

    if (content.trim() && content.length > 0 && !options[index]) {
      options[index] = content.trim();
    }
  }

  // Pattern 2: (A) content (fallback)
  if (options.filter((o) => o).length < 5) {
    const pattern2 = /\(([A-E])\)\s*([^()\\]+?)(?=\s*\(|\\|$)/g;

    while ((match = pattern2.exec(combinedText)) !== null) {
      const letter = match[1];
      let content = match[2];

      content = content.replace(/~.*$/g, '');
      content = content.replace(/\s*\}.*$/g, '');
      content = content.replace(/\s*=.*$/g, '');

      content = cleanLaTeX(content.trim());
      const index = letter.charCodeAt(0) - 65;

      if (content && !options[index]) {
        options[index] = content;
      }
    }
  }

  return options.filter((o) => o);
}

function extractOptionsFromHTML($: cheerio.CheerioAPI, problemDiv: cheerio.Cheerio<any>): string[] {
  const options: string[] = [];
  const text = problemDiv.text();

  const pattern = /\(([A-E])\)\s*([^()]+?)(?=\s*\([A-E]\)|$)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const letter = match[1];
    const content = cleanLaTeX(match[2].trim());
    const index = letter.charCodeAt(0) - 65;

    if (content && !options[index]) {
      options[index] = content;
    }
  }

  return options.filter((o) => o);
}

async function extractOptions(
  $: cheerio.CheerioAPI,
  problemDiv: cheerio.Cheerio<any>,
  debug = false
): Promise<string[]> {
  // Method 1: Multi-image extraction
  let options = extractOptionsFromMultipleImages($, problemDiv, debug);

  if (options.length === 5) {
    console.log('    ✓ Options extracted via Multi-Image LaTeX');
    return options;
  }

  // Method 2: HTML text extraction (fallback)
  options = extractOptionsFromHTML($, problemDiv);

  if (options.length === 5) {
    console.log('    ✓ Options extracted via HTML Text');
    return options;
  }

  if (options.length > 0 && options.length < 5) {
    console.log(`    ⚠️  Only ${options.length}/5 options extracted`);
  } else if (options.length === 0) {
    console.log(`    ❌ No options extracted`);
  }

  return options;
}

// ============================================================================
// UNIVERSAL QUESTION TEXT EXTRACTION
// ============================================================================

function extractQuestionText($: cheerio.CheerioAPI, problemDiv: cheerio.Cheerio<any>): string {
  let questionText = '';
  let foundSolution = false;
  let foundProblemHeading = false;

  problemDiv.children().each((i, elem) => {
    if (foundSolution) return false;

    const $elem = $(elem);
    const elemText = $elem.text().trim();

    // Skip the "Problem X" heading
    if (elemText.match(/^Problem\s+\d+$/i) && !foundProblemHeading) {
      foundProblemHeading = true;
      return;
    }

    // Stop at Solution heading
    if (elemText.match(/^Solution/i)) {
      foundSolution = true;
      return false;
    }

    if (elem.tagName !== 'p') return;
    if (!elemText) return;

    let paragraphText = '';

    $elem.contents().each((_, node) => {
      if (node.type === 'text') {
        paragraphText += $(node).text();
      } else if (node.type === 'tag' && node.name === 'img') {
        const alt = $(node).attr('alt') || '';
        if (alt.includes('$') && alt.length < 100 && !alt.includes('textbf')) {
          const cleaned = cleanLaTeX(alt);
          paragraphText += cleaned;
        }
      } else if (node.type === 'tag') {
        paragraphText += $(node).text();
      }
    });

    if (paragraphText.trim()) {
      questionText += (questionText ? ' ' : '') + paragraphText.trim();
    }
  });

  return cleanLaTeX(questionText);
}

// ============================================================================
// UNIVERSAL DIAGRAM DETECTION
// ============================================================================

function detectDiagrams($: cheerio.CheerioAPI, problemDiv: cheerio.Cheerio<any>): string[] {
  const diagrams: string[] = [];

  problemDiv.find('img').each((_, img) => {
    const src = $(img).attr('src');
    const alt = $(img).attr('alt') || '';
    const classes = $(img).attr('class') || '';

    if (!src) return;

    // Skip short LaTeX equation images
    if (alt.includes('$') && alt.length < 100 && !classes.includes('latexcenter')) {
      return;
    }

    const isDiagram =
      !alt.includes('$') ||
      (alt.length > 100 && classes.includes('latexcenter')) ||
      classes.includes('latexcenter');

    if (isDiagram) {
      let fullUrl: string;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        fullUrl = src;
      } else if (src.startsWith('//')) {
        fullUrl = 'https:' + src;
      } else if (src.startsWith('/')) {
        fullUrl = 'https://artofproblemsolving.com' + src;
      } else {
        fullUrl = 'https://artofproblemsolving.com/' + src;
      }
      diagrams.push(fullUrl);
    }
  });

  return diagrams;
}

async function downloadDiagram(
  url: string,
  filename: string,
  diagramDir: string
): Promise<string | null> {
  try {
    const filepath = path.join(diagramDir, filename);

    if (!fs.existsSync(diagramDir)) {
      fs.mkdirSync(diagramDir, { recursive: true });
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000,
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/images/questions/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`    ⚠️  Failed to download diagram: ${url}`);
    return null;
  }
}

// ============================================================================
// UNIVERSAL SOLUTION EXTRACTION
// ============================================================================

function extractTextWithInlineLatex($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
  let text = '';

  element.contents().each((_, node) => {
    if (node.type === 'text') {
      text += $(node).text();
    } else if (node.type === 'tag' && node.name === 'img') {
      const alt = $(node).attr('alt') || '';
      if (alt.includes('$') && alt.length < 200 && !alt.includes('[asy]')) {
        const cleaned = cleanLaTeX(alt);
        text += cleaned;
      }
    } else if (node.type === 'tag') {
      text += extractTextWithInlineLatex($, $(node));
    }
  });

  return text;
}

function extractSolution($: cheerio.CheerioAPI): {
  text: string;
  rawText: string;
  videoLinks: string[];
} {
  let solutionText = '';
  let rawSolutionText = '';
  const videoLinks: string[] = [];

  $('.mw-headline').each((_, headline) => {
    const headlineText = $(headline).text();

    if (headlineText.match(/^Solution\s+\d+$/i)) {
      let currentElement = $(headline).parent().next();
      let solutionContent = '';

      while (currentElement.length && !currentElement.find('.mw-headline').length) {
        const elementText = extractTextWithInlineLatex($, currentElement);
        if (elementText.trim()) {
          solutionContent += elementText + ' ';
        }
        currentElement = currentElement.next();
      }

      if (solutionContent.trim()) {
        if (rawSolutionText) rawSolutionText += '\n\n';
        rawSolutionText += solutionContent.trim();

        if (solutionText) solutionText += '\n\n';
        solutionText += cleanLaTeX(solutionContent.trim());
      }
    }

    // Extract video solution links
    if (headlineText.match(/Video\s+Solution/i)) {
      let currentElement = $(headline).parent().next();

      while (currentElement.length && !currentElement.find('.mw-headline').length) {
        currentElement.find('a[href*="youtube"], a[href*="youtu.be"]').each((_, link) => {
          const href = $(link).attr('href');
          if (href) videoLinks.push(href);
        });
        currentElement = currentElement.next();
      }
    }
  });

  return { text: solutionText, rawText: rawSolutionText, videoLinks };
}

// ============================================================================
// UNIVERSAL SCRAPING LOGIC
// ============================================================================

async function scrapeProblem(
  config: ExamConfig,
  year: number,
  problemNum: number,
  retries = 0,
  debug = false
): Promise<any | null> {
  const url = config.urlPattern
    .replace('{year}', year.toString())
    .replace('{examName}', config.name)
    .replace('{problemNum}', problemNum.toString());

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const problemDiv = $('#mw-content-text .mw-parser-output').first();

    if (!problemDiv.length) {
      console.log(`    ❌ No problem content found`);
      return null;
    }

    // Extract question text (use custom or default)
    const problemText = config.customQuestionExtractor
      ? config.customQuestionExtractor($, problemDiv)
      : extractQuestionText($, problemDiv);

    if (!problemText) {
      console.log(`    ❌ No problem text extracted`);
      return null;
    }

    // Extract options (use custom or default)
    const options = config.customOptionExtractor
      ? await config.customOptionExtractor($, problemDiv)
      : await extractOptions($, problemDiv, debug);

    if (options && options.length < 5) {
      console.log(`    ⚠️  Incomplete options (${options.length}/5)`);
    }

    // Detect and download diagrams
    const diagramUrls = detectDiagrams($, problemDiv);
    const diagrams: string[] = [];

    for (let i = 0; i < diagramUrls.length; i++) {
      const filename = `${config.name.toLowerCase()}-${year}-p${problemNum}-${i + 1}.png`;
      const localPath = await downloadDiagram(diagramUrls[i], filename, config.diagramDir);
      if (localPath) diagrams.push(localPath);
    }

    // Extract solution (use custom or default)
    const solution = config.customSolutionExtractor
      ? config.customSolutionExtractor($)
      : extractSolution($);

    // Determine correct answer - IMPROVED to handle complex boxed answers
    let correctAnswer = '';
    const answerPatterns = config.answerPattern || [
      /\\boxed\{\\textbf\{\(([A-E])\)\}[~\s]*[^}]*\}/i, // \boxed{\textbf{(C)}~\frac{20}{33}}
      /\\boxed\{\\textbf\{\(([A-E])\)\}/i, // \boxed{\textbf{(B)}}
      /\\boxed\{\\text\{\(([A-E])\)\s*\}\}/i, // \boxed{\text{(A) }}
      /answer\s+is\s+\(?([A-E])\)?/i, // "answer is (B)"
      /\(([A-E])\)[^\w\(]/, // "(A)" standalone
      /\b([A-E])\b/, // Single letter
    ];

    for (const pattern of answerPatterns) {
      const match = solution.rawText.match(pattern) || solution.text.match(pattern);
      if (match) {
        correctAnswer = match[1].toUpperCase();
        break;
      }
    }

    const totalProblems =
      typeof config.problemsPerExam === 'function'
        ? config.problemsPerExam(year)
        : config.problemsPerExam;

    return {
      examName: config.displayName,
      examYear: year,
      questionNumber: problemNum.toString(),
      questionText: problemText,
      options:
        options?.map((opt, idx) => ({
          letter: String.fromCharCode(65 + idx),
          text: opt,
          isCorrect: String.fromCharCode(65 + idx) === correctAnswer,
        })) || [],
      solution: solution.text || undefined,
      videoLinks: solution.videoLinks.length > 0 ? solution.videoLinks : undefined,
      imageUrl: diagrams.length > 0 ? diagrams[0] : undefined,
      hasImage: diagrams.length > 0,
      topic: 'General Math',
      difficulty: config.getDifficulty(problemNum, totalProblems),
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`    ⊘ Problem does not exist (404)`);
      return null;
    }

    if (retries < MAX_RETRIES) {
      console.log(`    ⚠️  Error, retrying (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return scrapeProblem(config, year, problemNum, retries + 1, debug);
    }

    console.error(`    ❌ Failed after ${MAX_RETRIES} retries:`, error.message);
    return null;
  }
}

async function scrapeYear(config: ExamConfig, year: number): Promise<any[]> {
  console.log(`\n📅 Scraping ${config.displayName} ${year}...`);
  const problems: any[] = [];

  const numProblems =
    typeof config.problemsPerExam === 'function'
      ? config.problemsPerExam(year)
      : config.problemsPerExam;

  for (let i = 1; i <= numProblems; i++) {
    console.log(`  Problem ${i}/${numProblems}...`);
    const problem = await scrapeProblem(config, year, i);

    if (problem) {
      problems.push(problem);
      console.log(
        `    ✓ Success (${problem.options.length} options, ${problem.hasImage ? 'has diagram' : 'no diagram'})`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
  }

  console.log(`✓ Completed ${year}: ${problems.length}/${numProblems} problems scraped`);
  return problems;
}

function saveProgress(config: ExamConfig, questions: any[]): void {
  const outputPath = path.join(__dirname, '..', config.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
  console.log(`💾 Saved ${questions.length} questions to ${config.outputFile}`);
}

function loadProgress(config: ExamConfig): any[] {
  const outputPath = path.join(__dirname, '..', config.outputFile);
  if (fs.existsSync(outputPath)) {
    const data = fs.readFileSync(outputPath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const examType = process.argv[2]?.toUpperCase();

  if (!examType || !EXAM_CONFIGS[examType]) {
    console.log('🚀 UNIVERSAL EXAM SCRAPER');
    console.log('=========================');
    console.log('\nUsage: npx tsx scripts/scrape-universal.ts <EXAM_TYPE>');
    console.log('\nAvailable exam types:');
    Object.keys(EXAM_CONFIGS).forEach((key) => {
      const config = EXAM_CONFIGS[key];
      console.log(`  - ${key.padEnd(15)} ${config.displayName} (${config.years.length} years)`);
    });
    console.log('\nExample: npx tsx scripts/scrape-universal.ts AMC8');
    process.exit(1);
  }

  const config = EXAM_CONFIGS[examType];

  console.log(`\n🚀 ${config.displayName.toUpperCase()} SCRAPER`);
  console.log('='.repeat(40));
  console.log(`Years to scrape: ${config.years.length}`);
  console.log(`Output file: ${config.outputFile}`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms between problems\n`);

  let allQuestions = loadProgress(config);
  console.log(`📂 Loaded ${allQuestions.length} existing questions from progress file`);

  const scrapedYears = new Set(allQuestions.map((q) => q.examYear));
  const yearsToScrape = config.years.filter((year) => !scrapedYears.has(year));

  console.log(`📋 Years remaining to scrape: ${yearsToScrape.join(', ')}\n`);

  for (const year of yearsToScrape) {
    const yearQuestions = await scrapeYear(config, year);
    allQuestions = [...allQuestions, ...yearQuestions];

    // Save progress after each year
    saveProgress(config, allQuestions);
  }

  console.log(`\n✅ SCRAPING COMPLETE!`);
  console.log(`Total questions scraped: ${allQuestions.length}`);

  // Statistics
  const withOptions = allQuestions.filter((q) => q.options && q.options.length === 5);
  const withDiagrams = allQuestions.filter((q) => q.hasImage);
  const withSolutions = allQuestions.filter((q) => q.solution);

  console.log(`\n📊 Statistics:`);
  console.log(
    `  - Complete options (5/5): ${withOptions.length}/${allQuestions.length} (${Math.round((withOptions.length / allQuestions.length) * 100)}%)`
  );
  console.log(`  - With diagrams: ${withDiagrams.length}/${allQuestions.length}`);
  console.log(`  - With solutions: ${withSolutions.length}/${allQuestions.length}`);

  console.log('\n🎉 All done! Ready to upload to database.');
}

// ============================================================================
// PDF EXTRACTION
// ============================================================================

async function extractFromPDF(pdfPath: string): Promise<string> {
  console.log(`📄 Extracting text from PDF: ${pdfPath}`);

  let parser;
  try {
    // Validate file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Dynamic import for pdf-parse v2 (uses PDFParse class)
    const { PDFParse, VerbosityLevel } = await import('pdf-parse');

    const dataBuffer = fs.readFileSync(pdfPath);

    // Validate PDF has content
    if (dataBuffer.length === 0) {
      console.warn(`⚠️  PDF file is empty`);
      return '';
    }

    parser = new PDFParse({
      data: dataBuffer,
      verbosity: VerbosityLevel.ERRORS,
    });

    const textResult = await parser.getText();
    const text = textResult.text || '';
    const numPages = textResult.pages?.length || 0;

    console.log(`✅ Extracted ${text.length} characters from ${numPages} pages`);

    if (text.length < 1000 && numPages > 10) {
      console.warn(
        `⚠️  WARNING: Very low text extracted (${text.length} chars from ${numPages} pages)`
      );
      console.warn(
        `   This PDF may be image-based (scanned). Consider using extractFromPDFWithOCR().`
      );
    }

    return text;
  } catch (error: any) {
    console.error(`❌ Failed to extract from PDF:`, error.message);
    throw new Error(`PDF extraction failed: ${error.message}`);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================================================
// WORD DOCUMENT EXTRACTION
// ============================================================================

async function extractFromWord(docxPath: string): Promise<string> {
  console.log(`📝 Extracting text from Word document: ${docxPath}`);

  try {
    const buffer = fs.readFileSync(docxPath);
    const result = await mammoth.extractRawText({ buffer });

    console.log(`✅ Extracted ${result.value.length} characters`);

    if (result.messages.length > 0) {
      console.warn(`⚠️  Extraction warnings:`);
      result.messages.forEach((msg) => console.warn(`   - ${msg.message}`));
    }

    return result.value;
  } catch (error: any) {
    console.error(`❌ Failed to extract from Word document:`, error.message);
    throw error;
  }
}

// ============================================================================
// OCR - IMAGE TEXT EXTRACTION
// ============================================================================

async function extractFromImage(imagePath: string): Promise<string> {
  console.log(`🖼️  Extracting text from image using OCR: ${imagePath}`);

  let worker;
  try {
    // Validate file exists and is readable
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(imagePath);

    console.log(`✅ Extracted ${text.length} characters from image`);
    return text;
  } catch (error: any) {
    console.error(`❌ Failed to extract from image:`, error.message);
    throw new Error(`Image OCR failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    }
  }
}

// ============================================================================
// PDF WITH IMAGE EXTRACTION (OCR)
// ============================================================================

async function extractFromPDFWithOCR(pdfPath: string): Promise<string> {
  console.log(`📄 Extracting from PDF with OCR support: ${pdfPath}`);

  let parser;
  let worker;
  try {
    // Validate file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const { PDFParse, VerbosityLevel } = await import('pdf-parse');

    const dataBuffer = fs.readFileSync(pdfPath);

    if (dataBuffer.length === 0) {
      console.warn(`⚠️  PDF file is empty`);
      return '';
    }

    parser = new PDFParse({
      data: dataBuffer,
      verbosity: VerbosityLevel.ERRORS,
    });

    // First, try text extraction
    const textResult = await parser.getText();
    let text = textResult.text || '';
    const numPages = textResult.pages?.length || 0;

    console.log(`✅ Extracted ${text.length} characters (text) from ${numPages} pages`);

    // If very little text extracted, try OCR on images
    if (text.length < 1000 && numPages > 5) {
      console.log(`⚠️  Low text content - attempting OCR on embedded images...`);

      try {
        // Extract images and run OCR
        worker = await createWorker('eng');
        let ocrText = '';

        for (let pageNum = 1; pageNum <= Math.min(numPages, 50); pageNum++) {
          try {
            const imageBuffer = await parser.getImage(pageNum, 'png');
            if (imageBuffer && imageBuffer.data) {
              const {
                data: { text: pageText },
              } = await worker.recognize(imageBuffer.data);
              ocrText += pageText + '\n\n';
              console.log(`  Page ${pageNum}: OCR extracted ${pageText.length} chars`);
            }
          } catch (err) {
            // Skip pages that fail
            console.log(`  Page ${pageNum}: Skipped (no image or OCR failed)`);
          }
        }

        if (ocrText.length > text.length) {
          console.log(
            `✅ OCR extracted ${ocrText.length} characters (better than text extraction)`
          );
          text = ocrText;
        }
      } catch (ocrError: any) {
        console.warn(`⚠️  OCR failed: ${ocrError.message}`);
      }
    }

    return text;
  } catch (error: any) {
    console.error(`❌ Failed to extract from PDF:`, error.message);
    throw new Error(`PDF extraction with OCR failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================================================
// GENERIC FILE EXTRACTION
// ============================================================================

async function extractFromFile(filePath: string, useOCR: boolean = false): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return useOCR ? await extractFromPDFWithOCR(filePath) : await extractFromPDF(filePath);
    case '.docx':
    case '.doc':
      return await extractFromWord(filePath);
    case '.txt':
      return fs.readFileSync(filePath, 'utf-8');
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.bmp':
    case '.tiff':
      return await extractFromImage(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export {
  EXAM_CONFIGS,
  cleanLaTeX,
  extractOptions,
  detectDiagrams,
  scrapeProblem,
  scrapeYear,
  extractFromPDF,
  extractFromPDFWithOCR,
  extractFromWord,
  extractFromImage,
  extractFromFile,
};
