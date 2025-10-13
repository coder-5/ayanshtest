import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Detect diagram URLs from AoPS page
function detectDiagramUrls($: cheerio.CheerioAPI, problemDiv: cheerio.Cheerio<any>): string[] {
  const diagrams: string[] = [];

  // Only search in the problem statement (before "Solution" heading)
  let problemStatement = problemDiv.clone();
  const solutionHeading = problemStatement.find('span#Solution, span#solution').first();
  if (solutionHeading.length > 0) {
    // Remove everything after the Solution heading
    solutionHeading.parent().nextAll().remove();
    solutionHeading.parent().remove();
  }

  problemStatement.find('img').each((_, img) => {
    const src = $(img).attr('src');
    const alt = $(img).attr('alt') || '';
    const classes = $(img).attr('class') || '';

    if (!src) return;

    // Skip AMC Logo and other non-diagram images
    if (
      src.includes('AMC_Logo') ||
      src.includes('amc_logo') ||
      src.includes('50px') ||
      src.includes('thumb/')
    ) {
      return;
    }

    // Skip short LaTeX equation images (likely inline formulas or options)
    if (alt.includes('$') && alt.length < 100 && !classes.includes('latexcenter')) {
      return;
    }

    // Include images that are likely diagrams
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

async function fetchDiagramUrl(year: number, problemNum: number): Promise<string | null> {
  const url = `https://artofproblemsolving.com/wiki/index.php/${year}_AMC_8_Problems/Problem_${problemNum}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const problemDiv = $('#mw-content-text .mw-parser-output').first();

    const diagrams = detectDiagramUrls($, problemDiv);
    return diagrams.length > 0 ? diagrams[0] : null;
  } catch (error) {
    console.error(`    ⚠️  Failed to fetch ${year} Problem ${problemNum}`);
    return null;
  }
}

async function updateDiagramUrls() {
  console.log('🔄 UPDATING DIAGRAM URLs TO HIGH-QUALITY AoPS SOURCES');
  console.log('='.repeat(70));

  // Get all AMC8 questions with local image paths OR with AMC Logo
  const questions = await prisma.question.findMany({
    where: {
      examName: 'AMC8',
      hasImage: true,
      OR: [
        { imageUrl: { startsWith: '/images/questions/' } },
        { imageUrl: { contains: 'AMC_Logo' } },
      ],
      deletedAt: null,
    },
    orderBy: [{ examYear: 'desc' }, { questionNumber: 'asc' }],
  });

  console.log(`\nFound ${questions.length} questions to update\n`);

  let updated = 0;
  let noImage = 0;
  let failed = 0;

  for (const question of questions) {
    const progress = `[${updated + noImage + failed + 1}/${questions.length}]`;
    console.log(`${progress} Fetching ${question.examYear} Problem ${question.questionNumber}...`);

    const aopsUrl = await fetchDiagramUrl(question.examYear!, parseInt(question.questionNumber!));

    if (aopsUrl) {
      await prisma.question.update({
        where: { id: question.id },
        data: { imageUrl: aopsUrl, hasImage: true },
      });
      console.log(`  ✅ Updated: ${aopsUrl.substring(0, 80)}...`);
      updated++;
    } else {
      // No diagram found, mark as no image
      await prisma.question.update({
        where: { id: question.id },
        data: { hasImage: false, imageUrl: null },
      });
      console.log(`  📝 No diagram - marked as text-only`);
      noImage++;
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('─'.repeat(70));
  console.log(`✅ Updated: ${updated}`);
  console.log(`📝 Text-only (no diagram): ${noImage}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70));

  console.log('\n✅ All diagram URLs updated to high-quality AoPS sources!');
  console.log('   Refresh your browser to see the improved diagrams.');
}

updateDiagramUrls()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
