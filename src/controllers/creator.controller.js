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

// Add or update bank details
export const addOrUpdateBankDetails = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }

        const { accountNumber, bankName, branchName, IFSC, accountHolderName } = req.body;
        console.log(`account Number ${accountNumber}`);
        console.log(`Account holder name ${accountHolderName}`);
        console.log(`Branch Name ${branchName}`);
        console.log(`IFSC code ${IFSC}`);
        console.log(`Bank Name ${bankName}`);

        // Validate required fields
        if (!accountNumber || !bankName || !branchName || !IFSC || !accountHolderName) {
            logger.warn(`Missing required bank details - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "All bank details (accountNumber, bankName, branchName, IFSC, accountHolderName) are required",
                data: null
            });
        }

        // Validate account number (assuming 9-18 digits)
        if (!/^\d{9,18}$/.test(accountNumber)) {
            logger.warn(`Invalid account number format - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "Account number must be between 9 and 18 digits",
                data: null
            });
        }

        // Validate IFSC code (assuming standard Indian format)
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(IFSC)) {
            logger.warn(`Invalid IFSC code format - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "Invalid IFSC code format",
                data: null
            });
        }

        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }

        // Update bank details
        creator.bankInformation = {
            bankName,
            branchName,
            IFSC,
            accountNumber,
            accountHolderName,
            isVerified: false // Reset verification status when details are updated
        };

        await creator.save();

        logger.info(`Bank details updated successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: "Bank details updated successfully",
            data: creator.bankInformation
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};


// add or update address
export const addOrUpdateAddress = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }

        const { label, street, city, state, zip, country } = req.body;

        // Validate required fields
        if (!street || !city || !state || !country || !zip) {
            logger.warn(`Missing required address fields - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "All address fields (street, city, state, country, zip) are required",
                data: null
            });
        }

        // Validate address label
        if (label && !['home', 'work', 'billing', 'shipping', 'other'].includes(label)) {
            logger.warn(`Invalid address label - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "Address label must be one of: home, work, billing, shipping, other",
                data: null
            });
        }

        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }

        // Update address
        creator.address = {
            label: label || 'home',
            street,
            city,
            state,
            zip,
            country
        };

        await creator.save();

        logger.info(`Address updated successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: "Address updated successfully",
            data: creator.address
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};

// add or update bio
export const addOrUpdateBio = async (req, res, next) => {
    try {
        if (!req.body || !req.body.bio) {
            logger.warn(`Bio is required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "Bio is required", data: null });
        }

        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }

        creator.bio = req.body.bio;
        await creator.save();

        logger.info(`Bio ${creator.bio ? 'updated' : 'added'} successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: `Bio ${creator.bio ? 'updated' : 'added'} successfully`,
            data: { bio: creator.bio }
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};

// add or update government id
export const addOrUpdateGovernmentId = async (req, res, next) => {
    try {
        if (!req.body || !req.body.governmentId) {
            logger.warn(`Government ID is required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "Government ID is required", data: null });
        }

        const { governmentId, idType } = req.body;

        if (!idType || !['passport', 'drivers_license', 'national_id'].includes(idType)) {
            logger.warn(`Invalid ID type - ${req.method} ${req.url}`);
            return res.status(400).json({
                status: "error",
                message: "Valid ID type (passport, drivers_license, or national_id) is required",
                data: null
            });
        }

        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }

        creator.governmentId = governmentId;
        creator.idType = idType;
        await creator.save();

        logger.info(`Government ID ${creator.governmentId ? 'updated' : 'added'} successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: `Government ID ${creator.governmentId ? 'updated' : 'added'} successfully`,
            data: creator
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};

// add profile picture
export const addProfilePicture = async (req, res, next) => { };

// update profile picture
export const updateProfilePicture = async (req, res, next) => { };

// add cover picture
export const addCoverPicture = async (req, res, next) => { };

// update cover picture
export const updateCoverPicture = async (req, res, next) => { };