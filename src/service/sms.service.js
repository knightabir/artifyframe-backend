import Queue from "bull";
import logger from "../utils/logger.js";

const sendQueue = new Queue('send', process.env.REDIS_URL);

export const sendSMS = async (phone, message) => {
    // placeholder for sms gateway integration
    await sendQueue.add({ phone, message });
};

smsQueue.process(async (job) => {
    const { phone, message } = job.data;
    // placeholder for sms gateway integration
    logger.info(`Sent SMS to ${phone}: ${message}`);
});