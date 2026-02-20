// Centralized API Error Handling Module

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface ApiErrorOptions {
  status?: number;
  code?: ApiErrorCode;
  details?: unknown;
  cause?: unknown;
}

/**
 * Base API Error
 */
export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public details?: unknown;
  public override cause?: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);

    this.name = "ApiError";
    this.status = options.status ?? 500;
    this.code = options.code ?? "SERVER_ERROR";
    this.details = options.details;
    this.cause = options.cause;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, {
      status: 403,
      code: "FORBIDDEN",
    });
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, {
      status: 404,
      code: "NOT_FOUND",
    });
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message = "Conflict detected") {
    super(message, {
      status: 409,
      code: "CONFLICT",
    });
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, {
      status: 422,
      code: "VALIDATION_ERROR",
      details,
    });
  }
}

/**
 * Network Error (Frontend fetch failure)
 */
export class NetworkError extends ApiError {
  constructor(message = "Network request failed") {
    super(message, {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }
}

/**
 * Converts unknown errors into ApiError
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, {
      cause: error,
      code: "UNKNOWN_ERROR",
    });
  }

  return new ApiError("An unknown error occurred", {
    details: error,
    code: "UNKNOWN_ERROR",
  });
}
