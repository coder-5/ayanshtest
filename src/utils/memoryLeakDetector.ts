// Memory leak detection utilities

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  componentCount: number;
}

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private readonly maxSnapshots = 50;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private componentRegistry = new Map<string, number>();

  constructor() {
    this.startMonitoring();
  }

  private getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private startMonitoring() {
    if (process.env.NODE_ENV !== 'development') return;

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, 10000); // Every 10 seconds

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  takeSnapshot() {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      ...memoryInfo,
      componentCount: this.getTotalComponentCount()
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    this.detectLeaks();
  }

  private detectLeaks() {
    if (this.snapshots.length < 5) return;

    const recent = this.snapshots.slice(-5);
    const memoryGrowth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;

    // Check for consistent memory growth
    const isGrowingConsistently = recent.every((snapshot, index) => {
      if (index === 0) return true;
      return snapshot.usedJSHeapSize >= recent[index - 1].usedJSHeapSize;
    });

    if (isGrowingConsistently && memoryGrowth > 5 * 1024 * 1024) { // 5MB growth
      console.warn('🚨 Potential memory leak detected!');
      console.warn(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB over ${timeSpan / 1000}s`);
      this.generateReport();
    }

    // Check for high memory usage
    const currentMemoryMB = recent[recent.length - 1].usedJSHeapSize / 1024 / 1024;
    if (currentMemoryMB > 150) {
      console.warn(`⚠️ High memory usage: ${currentMemoryMB.toFixed(2)}MB`);
    }
  }

  registerComponent(componentName: string) {
    const count = this.componentRegistry.get(componentName) || 0;
    this.componentRegistry.set(componentName, count + 1);
  }

  unregisterComponent(componentName: string) {
    const count = this.componentRegistry.get(componentName) || 0;
    if (count > 0) {
      this.componentRegistry.set(componentName, count - 1);
    }
  }

  private getTotalComponentCount(): number {
    return Array.from(this.componentRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  generateReport() {
    console.group('📊 Memory Leak Detection Report');

    if (this.snapshots.length > 0) {
      const latest = this.snapshots[this.snapshots.length - 1];
      const earliest = this.snapshots[0];

      console.log(`📈 Memory Usage Trend:`);
      console.log(`  Initial: ${(earliest.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Current: ${(latest.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Growth: ${((latest.usedJSHeapSize - earliest.usedJSHeapSize) / 1024 / 1024).toFixed(2)}MB`);
    }

    console.log(`🧩 Active Components:`);
    this.componentRegistry.forEach((count, name) => {
      if (count > 0) {
        console.log(`  ${name}: ${count} instances`);
      }
    });

    console.log(`🎯 Recommendations:`);
    console.log(`  - Check for uncleaned useEffect hooks`);
    console.log(`  - Verify timer cleanup (setInterval, setTimeout)`);
    console.log(`  - Review large state objects and arrays`);
    console.log(`  - Check for event listener cleanup`);

    console.groupEnd();
  }

  getMemoryUsageChart() {
    return this.snapshots.map(snapshot => ({
      time: new Date(snapshot.timestamp).toLocaleTimeString(),
      memory: Math.round(snapshot.usedJSHeapSize / 1024 / 1024),
      components: snapshot.componentCount
    }));
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.snapshots = [];
    this.componentRegistry.clear();
  }
}

// Global instance
export const memoryLeakDetector = new MemoryLeakDetector();

// React hook for component tracking
export function useMemoryTracking(componentName: string) {
  // Note: React import should be handled by the component using this hook
  // This will be used with React.useEffect in the consuming component
  return {
    register: () => memoryLeakDetector.registerComponent(componentName),
    unregister: () => memoryLeakDetector.unregisterComponent(componentName)
  };
}

// Manual memory check function
export function checkMemoryUsage(context?: string) {
  if (process.env.NODE_ENV !== 'development') return;

  const memoryInfo = (performance as any).memory;
  if (memoryInfo) {
    const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
    console.log(`🔍 Memory Check${context ? ` (${context})` : ''}: ${usedMB.toFixed(2)}MB`);

    if (usedMB > 100) {
      memoryLeakDetector.generateReport();
    }
  }
}