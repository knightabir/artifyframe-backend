/**
 * Custom error creator for consistent error handling across the application
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Custom error object with status code and message
 */
export const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    error.isOperational = true;

    return error;
};

/**
 * Error class for validation errors
 */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for authentication errors
 */
export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for authorization errors
 */
export class AuthorizationError extends Error {
    constructor(message = 'Not authorized to access this resource') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for not found errors
 */
export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for conflict errors (e.g., duplicate entries)
 */
export class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for rate limit errors
 */
export class RateLimitError extends Error {
    constructor(message = 'Too many requests') {
        super(message);
        this.name = 'RateLimitError';
        this.statusCode = 429;
        this.status = 'fail';
        this.isOperational = true;
    }
}

/**
 * Error class for database errors
 */
export class DatabaseError extends Error {
    constructor(message = 'Database operation failed') {
        super(message);
        this.name = 'DatabaseError';
        this.statusCode = 500;
        this.status = 'error';
        this.isOperational = true;
    }
}

/**
 * Error class for third-party service errors
 */
export class ServiceError extends Error {
    constructor(message = 'Service operation failed') {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = 502;
        this.status = 'error';
        this.isOperational = true;
    }
}

/**
 * Check if error is operational (known error type)
 * @param {Error} error - Error object to check
 * @returns {boolean} True if error is operational, false otherwise
 */
export const isOperationalError = (error) => {
    return error.isOperational;
};

/**
 * Handle unhandled rejections and exceptions
 * @param {Error} error - Error object
 */
export const handleFatalError = (error) => {
    console.error('FATAL ERROR 💥:', error);
    // In production, you might want to:
    // 1. Log to external service
    // 2. Send notification to dev team
    // 3. Gracefully shutdown server
    process.exit(1);
}; 