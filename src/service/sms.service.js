import Queue from "bull";
import logger from "../utils/logger.js";
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();


const smsQueue = new Queue('sms', process.env.REDIS_URL);

smsQueue.process(async (job) => {
    const { phone, message } = job.data;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        });
        console.log(`SMS sent to ${phone}`);
    } catch (error) {
        console.error(`Failed to send SMS to ${phone}:`, error);
        throw error; // Retry if configured
    }
});

export const sendSMS = async (phone, message) => {
    await smsQueue.add({ phone, message });
};