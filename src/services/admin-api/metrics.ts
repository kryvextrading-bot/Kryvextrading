export class AdminMetrics {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxDataPoints = 100;

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    
    const values = this.metrics.get(metric)!;
    values.push(value);
    
    if (values.length > this.maxDataPoints) {
      values.shift();
    }
  }

  getAverage(metric: string, minutes: number = 5): number {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return 0;
    
    const now = Date.now();
    const cutoff = now - minutes * 60 * 1000;
    const recentValues = values.filter((_, index) => {
      // Assuming values are recorded at regular intervals
      const timestamp = now - (values.length - index) * 60000;
      return timestamp >= cutoff;
    });
    
    return recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  }

  getStats(metric: string): {
    min: number;
    max: number;
    avg: number;
    current: number;
    count: number;
  } {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0, count: 0 };
    }
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      current: values[values.length - 1],
      count: values.length
    };
  }

  reset(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}
