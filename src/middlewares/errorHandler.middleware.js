import { isOperationalError } from '../utils/error.js';
import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error 💥:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Set default error values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle operational errors
    if (isOperationalError(err)) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: 'Validation Error',
            errors
        });
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            status: 'fail',
            message: `Duplicate value for ${field}. Please use another value.`
        });
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: err.message
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            status: 'fail',
            message: 'Invalid token. Please log in again.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            status: 'fail',
            message: 'Token expired. Please log in again.'
        });
    }

    // Handle programming or unknown errors in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went wrong!'
        });
    }

    // Send detailed error in development
    return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    });
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    error.status = 'fail';
    next(error);
};