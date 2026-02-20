export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  filename?: string;
  includeHeaders?: boolean;
}

export class AdminExport {
  static toCSV<T extends Record<string, any>>(data: T[], headers?: string[]): string {
    if (data.length === 0) return '';
    
    const cols = headers || Object.keys(data[0]);
    const rows = data.map(item => 
      cols.map(col => {
        const value = item[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [cols.join(','), ...rows].join('\n');
  }

  static toJSON<T>(data: T[], pretty: boolean = false): string {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  static download(data: string, filename: string, type: string): void {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async exportData<T>(
    data: T[],
    options: ExportOptions
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = options.filename || `export-${timestamp}`;
    
    switch (options.format) {
      case 'csv':
        const csv = this.toCSV(data);
        this.download(csv, `${filename}.csv`, 'text/csv');
        break;
      case 'json':
        const json = this.toJSON(data, true);
        this.download(json, `${filename}.json`, 'application/json');
        break;
      case 'excel':
        // Implement Excel export if needed
        console.warn('Excel export not implemented');
        break;
    }
  }
}
