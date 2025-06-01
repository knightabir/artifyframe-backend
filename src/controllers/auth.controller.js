import User from "../models/User.js";
import { sendResetPasswordEmail } from "../service/email.service.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import dotenv from 'dotenv';

dotenv.config();

export const register = async (req, res, next) => {
    try {
        logger.info(`User registration attempt - ${req.method} ${req.url}`);
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }
        const { email, password, name, phoneNumber, address, consent } = req.body;
        logger.info(`User registration data: ${email}, ${password}, ${name}, ${phoneNumber}, ${address}, ${consent}`);
        if (!consent) {
            logger.warn(`Terms and conditions not accepted - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "Please accept the terms and conditions", data: null });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn(`User already exists - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "User already exists", data: null });
        }
        if (!name) {
            logger.warn(`Name is required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "Name is required", data: null });
        }
        const user = new User({ email, password, name, phoneNumber, address, consent });
        await user.save();
        logger.info(`User created successfully - ${req.method} ${req.url}`);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(201).json({ status: "success", message: "User created successfully", data: { token } });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

export const login = async (req, res, next) => {
    try {
        logger.info(`Login attempt - ${req.method} ${req.url}`);
        const { email, password } = req.body;
        logger.info(`Login data: ${email}, ${password}`);

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(401).json({ status: "error", message: "Invalid credentials", data: null });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Password mismatch - ${req.method} ${req.url}`);
            return res.status(401).json({ status: "error", message: "Invalid credentials", data: null });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        logger.info(`Login successful - ${req.method} ${req.url}`);
        res.status(200).json({ status: "success", message: "Login successful", data: { token } });
    } catch (error) {
        if (error instanceof TypeError) {
            logger.error(`Type error: ${error.message} - ${req.method} ${req.url}`);
        } else if (error instanceof Error) {
            logger.error(`${error.message} - ${req.method} ${req.url}`);
        } else {
            logger.error(`Unknown error: ${error} - ${req.method} ${req.url}`);
        }
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        logger.info(`Forgot password attempt - ${req.method} ${req.url}`);
        const { email } = req.body;

        logger.info(`Fetching user with email: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({
                status: "error",
                message: "User not found",
                data: null,
            });
        }

        logger.info(`Generating reset token for user with ID: ${user._id}`);
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });

        logger.info(`Sending password reset email to: ${email}`);
        await sendResetPasswordEmail(email, resetToken);

        logger.info(`Password reset email sent successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: "Password reset email sent",
            data: { token: resetToken },
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        logger.info(`Password reset attempt - ${req.method} ${req.url}`);
        const { token, newPassword, confirmPassword } = req.body;
        logger.info(`Verifying token: ${token}`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        logger.info(`Fetching user with ID: ${decoded.id}`);
        const user = await User.findById(decoded.id);

        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }

        logger.info(`Checking if passwords match`);
        if (newPassword !== confirmPassword) {
            logger.warn(`Passwords do not match - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "Passwords do not match", data: null });
        }
        logger.info(`Updating password for user: ${user._id}`);
        user.password = newPassword;
        await user.save();
        logger.info(`Password changed successfully - ${req.method} ${req.url}`);
        res.status(200).json({ status: "success", message: "Password changed successfully", data: null });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}
