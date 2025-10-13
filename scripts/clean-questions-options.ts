/**
 * Clean LaTeX from questions and options (but preserve $ for money)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanLatex(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove LaTeX dollar delimiters ONLY when followed by backslash
      .replace(/\$\\/g, '') // $\ pattern
      .replace(/\\\$/g, '') // \$ pattern
      // Remove display math delimiters \[ and \]
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      // Handle LaTeX escapes (but not \$)
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
      // Handle fractions without braces like \frac12 -> (1/6)
      .replace(/\\frac(\d)(\d)/g, '($1/$2)')
      .replace(/\\dfrac(\d)(\d)/g, '($1/$2)')
      // Handle incomplete/malformed fractions
      .replace(/\\dfrac\{([^}]+)\)\{/g, '($1/')
      .replace(/\\frac\{([^}]+)\)\{/g, '($1/')
      .replace(/\\dfrac\{([^}]+)/g, '($1/')
      .replace(/\\frac\{([^}]+)/g, '($1/')
      // Remove textbf and other text commands
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\textit\{([^}]*)\}/g, '$1')
      .replace(/\\boxed\{([^}]*)\}/g, '$1')
      .replace(/\\mathrm\{([^}]*)\}/g, '$1')
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
      // Handle geometry notation
      .replace(/\\overline\{([^}]*)\}/g, '$1') // \overline{BC} -> BC
      .replace(/\\underline\{([^}]*)\}/g, '$1') // \underline{text} -> text
      .replace(/\\triangle/g, '△') // \triangle -> △
      .replace(/\\angle/g, '∠') // \angle -> ∠
      .replace(/\\circ/g, '°') // \circ -> °
      .replace(/\\parallel/g, '∥') // \parallel -> ∥
      .replace(/\\perp/g, '⊥') // \perp -> ⊥
      .replace(/\\cong/g, '≅') // \cong -> ≅
      .replace(/\\sim/g, '~') // \sim -> ~
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
  console.log('🧹 Cleaning LaTeX from questions and options...\n');

  // Clean questions
  const questions = await prisma.question.findMany();
  console.log(`📊 Found ${questions.length} questions`);

  let cleanedQ = 0;
  for (const question of questions) {
    const before = question.questionText;
    const after = cleanLatex(before);

    if (before !== after) {
      await prisma.question.update({
        where: { id: question.id },
        data: { questionText: after },
      });
      cleanedQ++;
    }
  }

  // Clean options
  const options = await prisma.option.findMany();
  console.log(`📊 Found ${options.length} options`);

  let cleanedO = 0;
  for (const option of options) {
    const before = option.optionText;
    const after = cleanLatex(before);

    if (before !== after) {
      await prisma.option.update({
        where: { id: option.id },
        data: { optionText: after },
      });
      cleanedO++;
    }
  }

  console.log(`\n✅ Cleaned ${cleanedQ} questions`);
  console.log(`✅ Cleaned ${cleanedO} options`);

  await prisma.$disconnect();
}

main().catch(console.error);
