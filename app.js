import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDb from './src/config/db.js';
import errorHandler from './src/middlewares/errorHandler.middleware.js';
import authRoutes from './src/routes/auth.route.js';
import { apiLimiter } from './src/middlewares/ratelimit.middleware.js';
import userRoutes from './src/routes/user.route.js';
import creatorRouter from './src/routes/creator.route.js';


dotenv.config();

const app = express();

// Connect to the database
connectDb();

// Middleware
app.use(express.json());
app.use(helmet());

// rate limiter
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/creator', creatorRouter);

//Error Handler
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));