import { prisma } from '@/lib/prisma';

export async function getDynamicCompetitions() {
  try {
    const competitions = await prisma.question.findMany({
      select: {
        examName: true
      },
      distinct: ['examName'],
      orderBy: {
        examName: 'asc'
      }
    });

    return competitions.map(c => c.examName);
  } catch (error) {
    return [];
  }
}

export async function getDynamicTopics() {
  try {
    const topics = await prisma.question.findMany({
      select: {
        topic: true
      },
      distinct: ['topic'],
      orderBy: {
        topic: 'asc'
      }
    });

    return topics.map(t => t.topic);
  } catch (error) {
    return [];
  }
}

export async function getCompetitionStats() {
  try {
    const stats = await prisma.question.groupBy({
      by: ['examName'],
      _count: {
        examName: true
      },
      orderBy: {
        _count: {
          examName: 'desc'
        }
      }
    });

    return stats;
  } catch (error) {
    return [];
  }
}

export async function getDynamicData() {
  try {
    const [competitions, topics, stats] = await Promise.all([
      getDynamicCompetitions(),
      getDynamicTopics(),
      getCompetitionStats()
    ]);

    return {
      competitions,
      topics,
      stats
    };
  } catch (error) {
    return {
      competitions: [],
      topics: [],
      stats: []
    };
  }
}

export function getExamIcon(examName: string): string {
  const name = examName.toLowerCase();

  if (name.includes('amc')) return '🧮';
  if (name.includes('kangaroo')) return '🦘';
  if (name.includes('moems')) return '🏆';
  if (name.includes('mathcounts')) return '📊';
  if (name.includes('aime')) return '🔢';
  if (name.includes('usamo') || name.includes('usajmo')) return '🥇';
  if (name.includes('local') || name.includes('school')) return '🏫';
  if (name.includes('state') || name.includes('regional')) return '🌟';
  if (name.includes('national')) return '🇺🇸';
  if (name.includes('international') || name.includes('imo')) return '🌍';

  return '📝'; // Default icon for any exam
}