import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getStrengthLevel(accuracy: number): 'weak' | 'moderate' | 'strong' {
  if (accuracy < 60) return 'weak';
  if (accuracy < 80) return 'moderate';
  return 'strong';
}

export function getStrengthColor(level: 'weak' | 'moderate' | 'strong'): string {
  switch (level) {
    case 'weak': return 'text-red-600';
    case 'moderate': return 'text-yellow-600';
    case 'strong': return 'text-green-600';
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'text-green-600 bg-green-100';
    case 'intermediate': return 'text-yellow-600 bg-yellow-100';
    case 'advanced': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}