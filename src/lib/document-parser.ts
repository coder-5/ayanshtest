import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { randomBytes } from 'crypto';

export interface ParsedQuestion {
  text: string;
  type: 'multiple-choice' | 'open-ended';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  competition: string;
  year?: number;
}

export class DocumentParser {
  async parseDocument(file: File, competition: string): Promise<ParsedQuestion[]> {
    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.parseWordDocument(arrayBuffer, competition);
    } else if (fileType === 'application/pdf') {
      return this.parsePdfDocument(Buffer.from(arrayBuffer), competition);
    } else if (fileType.startsWith('image/')) {
      return this.parseImageDocument(arrayBuffer, competition);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async parseWordDocument(arrayBuffer: ArrayBuffer, competition: string): Promise<ParsedQuestion[]> {
    try {
      // Convert ArrayBuffer to Buffer for mammoth
      const buffer = Buffer.from(arrayBuffer);

      // Try extractRawText first
      let result;
      try {
        result = await mammoth.extractRawText({ buffer });
      } catch (error) {
        console.log('Raw text extraction failed, trying with arrayBuffer option');
        result = await mammoth.extractRawText({ arrayBuffer: buffer });
      }

      const text = result.value;

      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in document');
      }

      return this.parseTextContent(text, competition);
    } catch (error) {
      console.error('Error parsing Word document:', error);
      throw new Error(`Failed to parse Word document: ${error.message}`);
    }
  }

  private async parsePdfDocument(buffer: Buffer, competition: string): Promise<ParsedQuestion[]> {
    let tempFile: string | null = null;

    try {
      // Create unique temporary file to avoid collisions
      const tempId = randomBytes(8).toString('hex');
      tempFile = path.join(process.cwd(), 'uploads', 'temp', `pdf-${tempId}.pdf`);

      // Ensure temp directory exists
      await this.ensureTempDirectory();

      // Write buffer to temporary file
      fs.writeFileSync(tempFile, buffer);

      // Parse PDF content
      const text = await this.extractTextFromPdf(tempFile);

      return this.parseTextContent(text, competition);
    } catch (error) {
      console.error('Error parsing PDF document:', error);
      throw new Error(`Failed to parse PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Always clean up temp file
      if (tempFile && fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', tempFile);
        }
      }
    }
  }

  private async ensureTempDirectory(): Promise<void> {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      // Import pdf-parse dynamically to avoid build issues
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseImageDocument(arrayBuffer: ArrayBuffer, competition: string): Promise<ParsedQuestion[]> {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(Buffer.from(arrayBuffer));
      await worker.terminate();

      return this.parseTextContent(text, competition);
    } catch (error) {
      console.error('Error parsing image document:', error);
      throw new Error('Failed to parse image document');
    }
  }

  private parseTextContent(text: string, competition: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Extract year from document text
    const extractedYear = this.extractYearFromText(text, competition);

    // First, try to detect if this is a solutions document
    const isSolutionsDocument = this.detectSolutionsDocument(text);

    if (isSolutionsDocument) {
      // Parse solutions and try to match with existing questions
      return this.parseSolutionsDocument(text, competition);
    }

    // Parse as regular questions document
    if (competition.toLowerCase().includes('amc')) {
      questions.push(...this.parseAMCQuestions(text, competition, extractedYear));
    } else if (competition.toLowerCase().includes('moems')) {
      questions.push(...this.parseMOEMSQuestions(text, competition, extractedYear));
    } else if (competition.toLowerCase().includes('kangaroo')) {
      questions.push(...this.parseKangarooQuestions(text, competition, extractedYear));
    } else {
      questions.push(...this.parseGenericQuestions(text, competition, extractedYear));
    }

    return questions;
  }

  private parseAMCQuestions(text: string, competition: string, year?: number): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Check if document contains both questions and solutions
    const hasAnswerKey = /answer\s*key|solutions|answers\s*:/i.test(text);

    if (hasAnswerKey) {
      return this.parseQuestionsWithSolutions(text, competition, 'amc');
    }

    // AMC 8 pattern: numbered questions with multiple choice options (A) through (E)
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const matches = text.match(questionPattern);

    if (matches) {
      matches.forEach(match => {
        const optionPattern = /\(([A-E])\)\s*([^(]+?)(?=\([A-E]\)|$)/g;
        const options: string[] = [];
        let optionMatch;

        while ((optionMatch = optionPattern.exec(match)) !== null) {
          options.push(optionMatch[2].trim());
        }

        if (options.length > 0) {
          const questionText = match.replace(/\d+\.\s*/, '').replace(/\([A-E]\)[^(]+/g, '').trim();

          questions.push({
            text: questionText,
            type: 'multiple-choice',
            options,
            competition,
            topic: this.inferTopic(questionText),
            difficulty: this.inferDifficulty(questionText),
            year
          });
        }
      });
    }

    return questions;
  }

  private parseMOEMSQuestions(text: string, competition: string, year?: number): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Check if document contains both questions and solutions
    const hasAnswerKey = /answer\s*key|solutions|answers\s*:/i.test(text);

    if (hasAnswerKey) {
      return this.parseQuestionsWithSolutions(text, competition, 'moems');
    }

    // MOEMS pattern: numbered questions without multiple choice
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const matches = text.match(questionPattern);

    if (matches) {
      matches.forEach(match => {
        const questionText = match.replace(/\d+\.\s*/, '').trim();

        if (questionText.length > 10) { // Filter out very short matches
          questions.push({
            text: questionText,
            type: 'open-ended',
            competition,
            topic: this.inferTopic(questionText),
            difficulty: this.inferDifficulty(questionText),
            year
          });
        }
      });
    }

    return questions;
  }

  private parseKangarooQuestions(text: string, competition: string, year?: number): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Math Kangaroo can have both multiple choice and open-ended
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const matches = text.match(questionPattern);

    if (matches) {
      matches.forEach(match => {
        const hasOptions = /\([A-E]\)/.test(match);

        if (hasOptions) {
          // Multiple choice question
          const optionPattern = /\(([A-E])\)\s*([^(]+?)(?=\([A-E]\)|$)/g;
          const options: string[] = [];
          let optionMatch;

          while ((optionMatch = optionPattern.exec(match)) !== null) {
            options.push(optionMatch[2].trim());
          }

          if (options.length > 0) {
            const questionText = match.replace(/\d+\.\s*/, '').replace(/\([A-E]\)[^(]+/g, '').trim();

            questions.push({
              text: questionText,
              type: 'multiple-choice',
              options,
              competition,
              topic: this.inferTopic(questionText),
              difficulty: this.inferDifficulty(questionText),
              year
            });
          }
        } else {
          // Open-ended question
          const questionText = match.replace(/\d+\.\s*/, '').trim();

          if (questionText.length > 10) {
            questions.push({
              text: questionText,
              type: 'open-ended',
              competition,
              topic: this.inferTopic(questionText),
              difficulty: this.inferDifficulty(questionText),
              year
            });
          }
        }
      });
    }

    return questions;
  }

  private parseGenericQuestions(text: string, competition: string, year?: number): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Generic pattern for any numbered questions
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const matches = text.match(questionPattern);

    if (matches) {
      matches.forEach(match => {
        const hasOptions = /\([A-E]\)/.test(match);
        const questionText = match.replace(/\d+\.\s*/, '').trim();

        if (questionText.length > 10) {
          questions.push({
            text: questionText,
            type: hasOptions ? 'multiple-choice' : 'open-ended',
            competition,
            topic: this.inferTopic(questionText),
            difficulty: this.inferDifficulty(questionText),
            year
          });
        }
      });
    }

    return questions;
  }

  private inferTopic(questionText: string): string {
    const text = questionText.toLowerCase();

    if (text.includes('triangle') || text.includes('circle') || text.includes('angle') ||
        text.includes('area') || text.includes('perimeter') || text.includes('volume') ||
        text.includes('polygon') || text.includes('rectangle') || text.includes('square')) {
      return 'geometry';
    }

    if (text.includes('prime') || text.includes('factor') || text.includes('divisible') ||
        text.includes('remainder') || text.includes('gcd') || text.includes('lcm') ||
        text.includes('modulo') || text.includes('integer')) {
      return 'number-theory';
    }

    if (text.includes('probability') || text.includes('chance') || text.includes('likely') ||
        text.includes('coin') || text.includes('dice') || text.includes('random')) {
      return 'probability';
    }

    if (text.includes('combination') || text.includes('permutation') || text.includes('arrange') ||
        text.includes('choose') || text.includes('select') || text.includes('ways')) {
      return 'combinatorics';
    }

    if (text.includes('equation') || text.includes('solve') || text.includes('variable') ||
        text.includes('expression') || text.includes('simplify') || text.includes('factor')) {
      return 'algebra';
    }

    return 'general';
  }

  private inferDifficulty(questionText: string): 'easy' | 'medium' | 'hard' {
    const text = questionText.toLowerCase();
    const wordCount = text.split(' ').length;

    // Simple heuristics for difficulty
    if (wordCount < 15 && !text.includes('prove') && !text.includes('show that')) {
      return 'easy';
    }

    if (text.includes('prove') || text.includes('show that') || text.includes('find all') ||
        text.includes('maximum') || text.includes('minimum') || wordCount > 30) {
      return 'hard';
    }

    return 'medium';
  }

  private extractYearFromText(text: string, competition: string): number | undefined {
    // Extract year based on competition type
    if (competition.toLowerCase().includes('amc')) {
      // Look for "AMC 8 2023" or "AMC 10 2024" patterns
      const amcYearMatch = text.match(/AMC\s*(?:8|10|12)\s*(\d{4})/i);
      if (amcYearMatch) {
        return parseInt(amcYearMatch[1]);
      }
    }

    if (competition.toLowerCase().includes('moems')) {
      // Look for "MOEMS 2023" or "Division E 2024" patterns
      const moemsYearMatch = text.match(/(?:MOEMS|Division\s*E)\s*(\d{4})/i);
      if (moemsYearMatch) {
        return parseInt(moemsYearMatch[1]);
      }
    }

    if (competition.toLowerCase().includes('kangaroo')) {
      // Look for "Math Kangaroo 2023" patterns
      const kangarooYearMatch = text.match(/Math\s*Kangaroo\s*(\d{4})/i);
      if (kangarooYearMatch) {
        return parseInt(kangarooYearMatch[1]);
      }
    }

    // Generic year extraction - look for 4-digit years (2000-2030)
    const genericYearMatch = text.match(/\b(20[0-2]\d|203[0])\b/);
    if (genericYearMatch) {
      return parseInt(genericYearMatch[1]);
    }

    return undefined;
  }

  // New methods for handling solutions documents and combined documents

  private detectSolutionsDocument(text: string): boolean {
    const solutionKeywords = [
      /answer\s*key/i,
      /solutions/i,
      /answers\s*only/i,
      /solution\s*guide/i,
      /correct\s*answers/i
    ];

    return solutionKeywords.some(pattern => pattern.test(text));
  }

  private parseSolutionsDocument(text: string, competition: string): ParsedQuestion[] {
    // For solutions-only documents, we need to match with existing questions
    // This would require database access, so return empty array for now
    // In practice, this would update existing questions with solutions
    console.log('Solutions document detected - would update existing questions');
    return [];
  }

  private parseQuestionsWithSolutions(text: string, competition: string, type: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Split document into sections
    const sections = this.splitDocumentSections(text);

    if (type === 'amc') {
      questions.push(...this.parseAMCWithSolutions(sections, competition));
    } else if (type === 'moems') {
      questions.push(...this.parseMOEMSWithSolutions(sections, competition));
    }

    return questions;
  }

  private splitDocumentSections(text: string): { questions: string; solutions: string } {
    // Look for common section separators
    const separators = [
      /answer\s*key/i,
      /solutions/i,
      /answers\s*:/i,
      /solution\s*guide/i
    ];

    for (const separator of separators) {
      const match = text.search(separator);
      if (match !== -1) {
        return {
          questions: text.substring(0, match).trim(),
          solutions: text.substring(match).trim()
        };
      }
    }

    // If no clear separator, try to detect by pattern changes
    const lines = text.split('\n');
    let splitIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('answer') || line.includes('solution')) {
        // Check if this line starts a solutions section
        const nextFewLines = lines.slice(i, i + 5).join(' ').toLowerCase();
        if (/\d+\.\s*[a-e]|\d+\.\s*\d+/.test(nextFewLines)) {
          splitIndex = i;
          break;
        }
      }
    }

    if (splitIndex !== -1) {
      return {
        questions: lines.slice(0, splitIndex).join('\n').trim(),
        solutions: lines.slice(splitIndex).join('\n').trim()
      };
    }

    return { questions: text, solutions: '' };
  }

  private parseAMCWithSolutions(sections: { questions: string; solutions: string }, competition: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Parse questions section first
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const questionMatches = sections.questions.match(questionPattern);

    if (!questionMatches) return questions;

    // Parse solutions section
    const solutionPattern = /(\d+)\.\s*([A-E]|\d+|.*?)(?=\d+\.|$)/gm;
    const solutionMatches = sections.solutions.match(solutionPattern);

    const solutionsMap = new Map<number, { answer: string; explanation: string }>();

    if (solutionMatches) {
      solutionMatches.forEach(match => {
        const questionNum = parseInt(match.match(/(\d+)\./)?.[1] || '0');
        const content = match.replace(/\d+\.\s*/, '').trim();

        // Extract answer and explanation
        const answerMatch = content.match(/^([A-E]|\d+(?:\.\d+)?)/);
        const answer = answerMatch ? answerMatch[1] : '';
        const explanation = content.replace(/^([A-E]|\d+(?:\.\d+)?)\.?\s*/, '').trim();

        solutionsMap.set(questionNum, { answer, explanation });
      });
    }

    // Combine questions with solutions
    questionMatches.forEach((match, index) => {
      const questionNum = index + 1;
      const optionPattern = /\(([A-E])\)\s*([^(]+?)(?=\([A-E]\)|$)/g;
      const options: string[] = [];
      const optionLabels: string[] = [];
      let optionMatch;

      while ((optionMatch = optionPattern.exec(match)) !== null) {
        optionLabels.push(optionMatch[1]);
        options.push(optionMatch[2].trim());
      }

      if (options.length > 0) {
        const questionText = match.replace(/\d+\.\s*/, '').replace(/\([A-E]\)[^(]+/g, '').trim();
        const solution = solutionsMap.get(questionNum);

        questions.push({
          text: questionText,
          type: 'multiple-choice',
          options,
          correctAnswer: solution?.answer || '',
          explanation: solution?.explanation || '',
          competition,
          topic: this.inferTopic(questionText),
          difficulty: this.inferDifficulty(questionText),
          year: undefined
        });
      }
    });

    return questions;
  }

  private parseMOEMSWithSolutions(sections: { questions: string; solutions: string }, competition: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // Parse questions section
    const questionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const questionMatches = sections.questions.match(questionPattern);

    if (!questionMatches) return questions;

    // Parse solutions section
    const solutionPattern = /(\d+)\.\s*(.*?)(?=\d+\.|$)/gm;
    const solutionMatches = sections.solutions.match(solutionPattern);

    const solutionsMap = new Map<number, { answer: string; explanation: string }>();

    if (solutionMatches) {
      solutionMatches.forEach(match => {
        const questionNum = parseInt(match.match(/(\d+)\./)?.[1] || '0');
        const content = match.replace(/\d+\.\s*/, '').trim();

        // For MOEMS, try to extract numerical answer
        const answerMatch = content.match(/(\d+(?:\.\d+)?|\d+\/\d+)/);
        const answer = answerMatch ? answerMatch[1] : '';
        const explanation = content;

        solutionsMap.set(questionNum, { answer, explanation });
      });
    }

    // Combine questions with solutions
    questionMatches.forEach((match, index) => {
      const questionNum = index + 1;
      const questionText = match.replace(/\d+\.\s*/, '').trim();

      if (questionText.length > 10) {
        const solution = solutionsMap.get(questionNum);

        questions.push({
          text: questionText,
          type: 'open-ended',
          correctAnswer: solution?.answer || '',
          explanation: solution?.explanation || '',
          competition,
          topic: this.inferTopic(questionText),
          difficulty: this.inferDifficulty(questionText),
          year: undefined
        });
      }
    });

    return questions;
  }
}