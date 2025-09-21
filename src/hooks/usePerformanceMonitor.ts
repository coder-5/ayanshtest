import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
  reRenderCount: number;
}

export function usePerformanceMonitor(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    reRenderCount: 0
  });

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const componentCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;

      setMetrics(prev => ({
        ...prev,
        renderTime,
        reRenderCount: renderCount.current,
        componentCount: componentCountRef.current
      }));

      // Log performance warnings
      if (renderTime > 100) {
        console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      if (renderCount.current > 10) {
        console.warn(`⚠️ Excessive re-renders in ${componentName}: ${renderCount.current} times`);
      }
    };
  });

  // Monitor memory usage
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));

        // Warn about memory usage
        const memoryMB = memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB > 100) {
          console.warn(`⚠️ High memory usage detected: ${memoryMB.toFixed(2)}MB`);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  const incrementComponentCount = () => {
    componentCountRef.current += 1;
  };

  const logMetrics = () => {
    if (!enabled) return;

    console.group(`📊 Performance Metrics - ${componentName}`);
    console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`Re-render Count: ${metrics.reRenderCount}`);
    console.log(`Component Count: ${metrics.componentCount}`);
    if (metrics.memoryUsage) {
      console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    }
    console.groupEnd();
  };

  return {
    metrics,
    incrementComponentCount,
    logMetrics
  };
}

// Hook for measuring specific operations
export function useOperationTimer(operationName: string) {
  const startTimer = useRef<number>(0);

  const start = () => {
    startTimer.current = performance.now();
  };

  const end = () => {
    const duration = performance.now() - startTimer.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);

      if (duration > 500) {
        console.warn(`⚠️ Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    }

    return duration;
  };

  return { start, end };
}