import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        status: 'error',
        message: 'Too many login attempts from this IP, please try again after a minute',
    }
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        status: 'error',
        message: 'Too many registration attempts from this IP, please try again after an hour',
    },
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        status: 'error',
        message: 'Too many forgot password attempts from this IP, please try again after an hour',
    }
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes',
    }
});