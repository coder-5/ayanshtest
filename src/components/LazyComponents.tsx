import { lazy } from 'react';

// Lazy load heavy components to improve initial bundle size
export const LazyPracticeSession = lazy(() =>
  import('./practice/PracticeSession').then(module => ({ default: module.PracticeSession }))
);

export const LazyAnalyticsDashboard = lazy(() =>
  import('./analytics/PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard }))
);

export const LazyQualityDashboard = lazy(() =>
  import('./quality/QualityDashboard')
);

export const LazyExamForm = lazy(() =>
  import('./exams/ExamForm')
);

export const LazyDiagramDisplay = lazy(() =>
  import('./practice/DiagramDisplay').then(module => ({ default: module.default }))
);

export const LazySolutionVisualizer = lazy(() =>
  import('./practice/SolutionVisualizer').then(module => ({ default: module.default }))
);