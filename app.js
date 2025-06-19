import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './src/middlewares/errorHandler.middleware.js';
import authRoutes from './src/routes/auth.route.js';
import userRoutes from './src/routes/user.route.js';
import creatorRoutes from './src/routes/creator.route.js';
import printerRoutes from './src/routes/printer.route.js';
import { connectDB } from './src/config/db.js';
import { apiLimiter } from './src/middlewares/ratelimit.middleware.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());

// rate limiter
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/printers', printerRoutes);

// Handle undefined routes
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});