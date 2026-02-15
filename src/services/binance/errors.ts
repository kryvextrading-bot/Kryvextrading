export class BinanceApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'BinanceApiError';
  }
}

export class BinanceRateLimitError extends BinanceApiError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'BinanceRateLimitError';
  }
}

export class BinanceAuthError extends BinanceApiError {
  constructor(message: string) {
    super(message);
    this.name = 'BinanceAuthError';
  }
}
