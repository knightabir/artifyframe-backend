import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/error.js';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            throw new AuthenticationError('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AuthenticationError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new AuthenticationError('Token expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Middleware to verify admin access
 */
export const adminAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            throw new AuthenticationError('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        if (user.role !== 'ADMIN') {
            throw new AuthorizationError('Admin access required');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AuthenticationError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new AuthenticationError('Token expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Middleware to verify specific roles
 */
export const roleAuthMiddleware = (roles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                throw new AuthenticationError('No token provided');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                throw new AuthenticationError('User not found');
            }

            if (!roles.includes(user.role)) {
                throw new AuthorizationError('Unauthorized role');
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                next(new AuthenticationError('Invalid token'));
            } else if (error.name === 'TokenExpiredError') {
                next(new AuthenticationError('Token expired'));
            } else {
                next(error);
            }
        }
    };
}; 