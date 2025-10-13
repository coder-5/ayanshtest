/**
 * Clean LaTeX artifacts directly in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanLatex(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove dollar signs first
      .replace(/\$/g, '')
      // Remove display math delimiters \[ and \]
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      // Handle LaTeX escapes
      .replace(/\\%/g, '%')
      .replace(/\\_/g, '_')
      .replace(/\\&/g, '&')
      .replace(/\\#/g, '#')
      .replace(/\\ /g, ' ') // backslash-space
      // Handle superscripts and subscripts
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^(\d)/g, '^$1')
      .replace(/_(\d+)/g, '₋$1')
      // Handle fractions (including dfrac)
      .replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
      // Handle fractions without braces like \frac16 -> (1/6)
      .replace(/\\frac(\d)(\d)/g, '($1/$2)')
      .replace(/\\dfrac(\d)(\d)/g, '($1/$2)')
      // Handle incomplete/malformed fractions
      .replace(/\\dfrac\{([^}]+)\)\{/g, '($1/')
      .replace(/\\frac\{([^}]+)\)\{/g, '($1/')
      .replace(/\\dfrac\{([^}]+)/g, '($1/')
      .replace(/\\frac\{([^}]+)/g, '($1/')
      // Remove textbf and other text commands (handle spaces before braces)
      .replace(/\\textbf\s*\{([^}]*)\}/g, '$1')
      .replace(/\\text\s*\{([^}]*)\}/g, '$1')
      .replace(/\\textit\s*\{([^}]*)\}/g, '$1')
      .replace(/\\boxed\s*\{([^}]*)\}/g, '$1')
      .replace(/\\mathrm\s*\{([^}]*)\}/g, '$1')
      // Remove \textbf without braces (e.g., "\textbf 4" -> "4")
      .replace(/\\textbf\s+/g, '')
      .replace(/\\boxed\s+/g, '')
      // Remove spacing commands
      .replace(/\\qquad/g, ' ')
      .replace(/\\quad/g, ' ')
      .replace(/\\,/g, '')
      .replace(/\\!/g, '')
      .replace(/\\;/g, '')
      .replace(/\\:/g, ' ')
      // Remove standalone braces
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/\{-\}/g, '-')
      .replace(/\{\}/g, '')
      // Clean up stray braces and backslashes
      .replace(/\}\s*\\/g, ' ')
      .replace(/\\\s*\{/g, ' ')
      .replace(/^\}\s*/g, '')
      .replace(/\s*\{$/g, '')
      // Remove tildes
      .replace(/~/g, ' ')
      // Remove double backslashes
      .replace(/\\\\/g, ' ')
      // Convert math operators
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
      // Handle \pi and other Greek letters
      .replace(/\\pi/g, 'π')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\theta/g, 'θ')
      // Handle \left and \right
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      // Handle malformed closing braces/parens in fractions
      .replace(/\)\{/g, '/')
      .replace(/\}\/\//g, ')')
      // Remove any remaining \frac or \dfrac commands
      .replace(/\\d?frac/g, '')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

async function main() {
  console.log('🧹 Cleaning LaTeX artifacts in database...\n');

  const solutions = await prisma.solution.findMany();
  console.log(`📊 Found ${solutions.length} solutions`);

  let cleaned = 0;
  let hasArtifacts = 0;

  for (const solution of solutions) {
    const before = solution.solutionText;
    const after = cleanLatex(before);

    if (before !== after) {
      // Check if it actually had artifacts
      if (
        before.includes('\\frac') ||
        before.includes('\\dfrac') ||
        before.includes('\\textbf') ||
        before.includes('\\text{') ||
        before.includes('\\qquad') ||
        before.includes('\\quad') ||
        before.includes('\\[') ||
        before.includes('\\]') ||
        before.includes('\\boxed') ||
        before.includes('\\mathrm') ||
        before.includes('\\times') ||
        before.includes('\\cdot') ||
        before.includes('\\pi') ||
        before.includes('\\left') ||
        before.includes('\\right')
      ) {
        hasArtifacts++;
      }

      await prisma.solution.update({
        where: { id: solution.id },
        data: { solutionText: after },
      });
      cleaned++;
    }
  }

  console.log(`\n✅ Cleaned ${cleaned} solutions`);
  console.log(`📌 ${hasArtifacts} had LaTeX artifacts`);

  await prisma.$disconnect();
}

main().catch(console.error);
