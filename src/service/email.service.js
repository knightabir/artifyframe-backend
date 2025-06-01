import nodemailer from "nodemailer";
import Queue from "bull";
import logger from "../utils/logger.js";

const emailQueue = new Queue('email', process.env.REDIS_URL);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

export const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        text: `Click the link below to reset your password: ${resetUrl}`
    };

    await emailQueue.add({ mailOptions });
};

emailQueue.process(async (job) => {
    const { mailOptions } = job.data;
    await transporter.sendMail(mailOptions);
})