import mongoose from "mongoose";
import dotenv from 'dotenv';
import logger from "../utils/logger.js";

dotenv.config();



const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Database connected ✅');
    } catch (error) {
        console.error(error);
        console.log('🚨 ' + error);
        process.exit(1);
    }
}

export default connectDb;