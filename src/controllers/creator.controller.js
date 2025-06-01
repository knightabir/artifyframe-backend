import Creator from "../models/Creator.js";
import { sendResetPasswordEmail } from "../service/email.service.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

export const createCreator = async (req, res, next) => {
    logger.info(`Creating a creator - ${req.method} ${req.url}`);
    if (!req.body) {
        logger.warn(`All fields are required - ${req.method} ${req.url}`);
        return res.status(400).json({
            status: "error",
            message: "All fields are required",
            data: null,
        });
    }
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    try {
        logger.info(
            `Creating a creator with name: ${firstName} ${lastName}, email: ${email}, phoneNumber: ${phoneNumber}`
        );
        const creator = new Creator({
            name: {
                firstName,
                lastName,
            },
            email,
            password,
            phoneNumber,
            role: "creator",
        });
        await creator.save();
        logger.info(`Creator created successfully - ${req.method} ${req.url}`);
        const token = jwt.sign({ id: creator._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        res.status(201).json({
            status: "success",
            message: "Creator created successfully",
            data: { token },
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};


export const login = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }
        logger.info(`Login attempt - ${req.method} ${req.url}`);
        const { email, password } = req.body;
        logger.info(`Login data: ${email}, ${password}`);

        const creator = await Creator.findOne({ email }).select('+password');
        if (!creator) {
            logger.warn(`creator not found - ${req.method} ${req.url}`);
            return res.status(401).json({ status: "error", message: "Invalid credentials", data: null });
        }

        const isMatch = await creator.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Password mismatch - ${req.method} ${req.url}`);
            return res.status(401).json({ status: "error", message: "Invalid credentials", data: null });
        }

        // Update the creator last login date
        creator.lastLogin = Date.now();
        await creator.save();

        const token = jwt.sign({ id: creator._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        logger.info(`Login successful - ${req.method} ${req.url}`);
        res.status(200).json({ status: "success", message: "Login successful", data: { token } });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// Add bank details
export const addBankDetails = async (req, res, next) => {};
// Update bank details
export const updateBankDetails = async (req, res, next) => {};
// add address
export const addAddress = async (req, res, next) => {};
// update address
export const updateAddress = async (req, res, next) => {};

// add bio
export const addBio = async (req, res, next) => {};
// update bio
export const updateBio = async (req, res, next) => {};

// add government id
export const addGovernmentId = async (req, res, next) => {};
// update government id
export const updateGovernmentId = async (req, res, next) => {};

// add profile picture
export const addProfilePicture = async (req, res, next) => {};

// update profile picture
export const updateProfilePicture = async (req, res, next) => {};

// add cover picture
export const addCoverPicture = async (req, res, next) => {};

// update cover picture
export const updateCoverPicture = async (req, res, next) => {};