/**
 * Types d'erreur standardisés pour l'application
 * Phase 1.1 - Stabilité Immédiate
 * 
 * Date: 17 mars 2026
 */

/**
 * Erreur de base de l'application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public context?: Record<string, any>,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintenir la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convertit l'erreur en format JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Erreur de cache Redis
 */
export class CacheError extends AppError {
  constructor(
    message: string,
    code: string,
    public operation: 'get' | 'set' | 'delete' | 'connect' | 'disconnect' | 'incr' | 'lpush' | 'rpush' | 'lrange' | 'exists' | 'flush',
    context?: Record<string, any>,
    originalError?: unknown
  ) {
    super(message, code, 'medium', { ...context, operation }, originalError);
    this.name = 'CacheError';
  }
}

/**
 * Erreur de réseau/API
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    code: string,
    public statusCode?: number,
    public endpoint?: string,
    context?: Record<string, any>,
    originalError?: unknown
  ) {
    super(message, code, 'high', { ...context, statusCode, endpoint }, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string,
    public value: any,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', 'low', { ...context, field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Erreur de timeout
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    public timeout: number,
    context?: Record<string, any>
  ) {
    super(message, 'TIMEOUT', 'medium', { ...context, timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Guard de type pour les erreurs
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Guard de type pour AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Guard de type pour CacheError
 */
export function isCacheError(error: unknown): error is CacheError {
  return error instanceof CacheError;
}

/**
 * Guard de type pour NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Convertit une erreur inconnue en AppError
 */
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isError(error)) {
    // Détecter le type d'erreur basé sur le message
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return new TimeoutError(error.message, 30000, context);
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError(error.message, 'NETWORK_ERROR', undefined, undefined, context, error);
    }

    if (error.message.includes('cache') || error.message.includes('Redis')) {
      return new CacheError(error.message, 'CACHE_ERROR', 'get', context, error);
    }

    return new AppError(error.message, 'UNKNOWN_ERROR', 'medium', context, error);
  }

  // Erreur non-Error (string, number, etc.)
  const message = typeof error === 'string' ? error : 'Erreur inconnue';
  return new AppError(message, 'UNKNOWN_ERROR', 'low', context, error);
}

/**
 * Crée une erreur de validation
 */
export function createValidationError(field: string, value: any, message?: string): ValidationError {
  const defaultMessage = `Validation failed for field '${field}' with value '${value}'`;
  return new ValidationError(message || defaultMessage, field, value);
}

/**
 * Crée une erreur de cache
 */
export function createCacheError(
  operation: 'get' | 'set' | 'delete' | 'connect' | 'disconnect',
  message: string,
  context?: Record<string, any>
): CacheError {
  return new CacheError(message, 'CACHE_ERROR', operation, context);
}

/**
 * Crée une erreur de réseau
 */
export function createNetworkError(
  message: string,
  statusCode?: number,
  endpoint?: string,
  context?: Record<string, any>
): NetworkError {
  return new NetworkError(message, 'NETWORK_ERROR', statusCode, endpoint, context);
}

/**
 * Crée une erreur de timeout
 */
export function createTimeoutError(timeout: number, message?: string): TimeoutError {
  const defaultMessage = `Operation timed out after ${timeout}ms`;
  return new TimeoutError(message || defaultMessage, timeout);
}

/**
 * Types de codes d'erreur
 */
export const ERROR_CODES = {
  // Cache
  CACHE_ERROR: 'CACHE_ERROR',
  CACHE_CONNECTION_FAILED: 'CACHE_CONNECTION_FAILED',
  CACHE_KEY_NOT_FOUND: 'CACHE_KEY_NOT_FOUND',
  CACHE_SERIALIZATION_ERROR: 'CACHE_SERIALIZATION_ERROR',
  
  // Réseau
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_NOT_FOUND: 'API_NOT_FOUND',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Système
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // Business
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
