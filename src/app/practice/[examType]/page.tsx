import ExamPractice from '@/components/practice/ExamPractice';
import { isValidExamType } from '@/constants/examTypes';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    examType: string;
  };
}

export default function ExamTypePracticePage({ params }: Props) {
  const { examType } = params;

  // Validate exam type
  if (!isValidExamType(examType)) {
    notFound();
  }

  return <ExamPractice examType={examType} />;
}

// Generate static params for known exam types
export function generateStaticParams() {
  return [
    { examType: 'amc8' },
    { examType: 'kangaroo' },
    { examType: 'moems' },
    { examType: 'mathcounts' },
    { examType: 'cml' }
  ];
}