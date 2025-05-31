import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();



const connectDb = async () => {
    console.log(process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📈 Database connected');
    } catch (error) {
        console.error(error);
        console.log('🚨 ' + error);
        process.exit(1);
    }
}

export default connectDb;