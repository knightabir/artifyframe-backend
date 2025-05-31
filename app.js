import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDb from './src/config/db.js';


dotenv.config();

const app = express();

// Connect to the database
connectDb();

// Middleware
app.use(express.json());
app.use(helmet());

//


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));