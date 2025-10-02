// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Array<{ name: string; duration: number; timestamp: number }> = [];

  static mark(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  static measure(name: string, startMark: string, endMark?: string): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }

        const entries = performance.getEntriesByName(name, 'measure');
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
          const duration = lastEntry.duration;
          this.measures.push({
            name,
            duration,
            timestamp: Date.now()
          });

          // Clean up marks
          performance.clearMarks(startMark);
          if (endMark) performance.clearMarks(endMark);
          performance.clearMeasures(name);

          return duration;
        }
      } catch (error) {
        // Performance measurement failed - silently continue
      }
    }

    return 0;
  }

  static getMetrics(): Array<{ name: string; duration: number; timestamp: number }> {
    return [...this.measures];
  }

  static clearMetrics(): void {
    this.measures = [];
    this.marks.clear();
  }

  // Report slow operations
  static reportSlowOperation(name: string, duration: number, threshold: number = 100): void {
    if (duration > threshold) {
      // Slow operation detected - could be reported to analytics

      // Report to analytics service
      if (typeof window !== 'undefined') {
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'slow_operation',
            name,
            duration,
            threshold,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {
          // Silent fail for analytics
        });
      }
    }
  }
}

// Lazy loading utilities - simplified version to avoid TypeScript issues
export function createLazyComponent(
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallback: React.ComponentType<any> = () => null
) {
  const LazyComponent = React.lazy(importFunc);

  const LazyWrapper = (props: any) =>
    React.createElement(
      React.Suspense,
      { fallback: React.createElement(fallback) },
      React.createElement(LazyComponent, props)
    );

  LazyWrapper.displayName = `LazyWrapper(Component)`;

  return LazyWrapper;
}

// Memory usage monitoring
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class MemoryMonitor {
  static getMemoryUsage(): MemoryInfo | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  static logMemoryUsage(_label: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      // Production: Memory usage logging disabled
    }
  }

  static checkMemoryPressure(): boolean {
    const memory = this.getMemoryUsage();
    if (memory) {
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8; // 80% threshold
    }
    return false;
  }
}

// Bundle analyzer helper
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    // Note: Dynamic import tracking would need to be implemented at the bundler level
  }
}

import React from 'react';