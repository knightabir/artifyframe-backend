import Creator from "../models/Creator.js";
import { sendResetPasswordEmail } from "../service/email.service.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
import Artwork from '../models/Artwork.js';
import AuditLog from '../models/AuditLog.js';
import cloudinary from '../config/cloudinary.js';
import { createError } from '../utils/error.js';

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

// add or update profile picture
export const addOrUpdateProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            logger.warn(`No file uploaded - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "No file uploaded", data: null });
        }
        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }
        creator.profileImage = {
            public_id: req.file.filename || req.file.public_id,
            url: req.file.path || req.file.secure_url
        };
        await creator.save();
        logger.info(`Profile picture uploaded/updated successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: "Profile picture uploaded/updated successfully",
            data: { profileImage: creator.profileImage }
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};

// add or update cover picture
export const addOrUpdateCoverPicture = async (req, res, next) => {
    try {
        if (!req.file) {
            logger.warn(`No file uploaded - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "No file uploaded", data: null });
        }
        const creator = await Creator.findById(req.user._id);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Creator not found", data: null });
        }
        creator.coverImage = {
            public_id: req.file.filename || req.file.public_id,
            url: req.file.path || req.file.secure_url
        };
        await creator.save();
        logger.info(`Cover picture uploaded/updated successfully - ${req.method} ${req.url}`);
        res.status(200).json({
            status: "success",
            message: "Cover picture uploaded/updated successfully",
            data: { coverImage: creator.coverImage }
        });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
};

// Upload artwork
export const uploadArtwork = async (req, res, next) => {
    try {
        const { title, description, price, commissionRate, categories, tags, dimensions } = req.body;
        
        if (!req.files || !req.files.image || !req.files.printableVersion) {
            return next(createError(400, 'Both preview image and printable version are required'));
        }

        // Upload preview image to Cloudinary
        const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
            folder: 'artworks/previews'
        });

        // Upload high-resolution version to Cloudinary with better quality
        const printableResult = await cloudinary.uploader.upload(req.files.printableVersion[0].path, {
            folder: 'artworks/printable',
            quality: 100
        });

        const artwork = new Artwork({
            title,
            description,
            creatorId: req.creator._id,
            price,
            commissionRate,
            categories: categories.split(','),
            tags: tags ? tags.split(',') : [],
            dimensions: {
                width: dimensions.width,
                height: dimensions.height,
                unit: dimensions.unit || 'INCHES'
            },
            image: {
                public_id: imageResult.public_id,
                url: imageResult.secure_url
            },
            printableVersion: {
                public_id: printableResult.public_id,
                url: printableResult.secure_url
            }
        });

        await artwork.save();

        // Create audit log
        await AuditLog.create({
            entityType: 'ARTWORK',
            entityId: artwork._id,
            action: 'CREATE',
            userId: req.creator._id,
            userType: 'CREATOR',
            metadata: {
                title: artwork.title,
                price: artwork.price.toString(),
                commissionRate: artwork.commissionRate
            }
        });

        res.status(201).json({
            success: true,
            message: 'Artwork uploaded successfully',
            data: artwork
        });
    } catch (error) {
        next(error);
    }
};

// Get creator's artworks
export const getCreatorArtworks = async (req, res, next) => {
    try {
        const artworks = await Artwork.findByCreator(req.creator._id);
        
        res.status(200).json({
            success: true,
            data: artworks
        });
    } catch (error) {
        next(error);
    }
};

// Get artwork details
export const getArtworkDetails = async (req, res, next) => {
    try {
        const artwork = await Artwork.findOne({
            _id: req.params.artworkId,
            creatorId: req.creator._id
        });

        if (!artwork) {
            return next(createError(404, 'Artwork not found'));
        }

        res.status(200).json({
            success: true,
            data: artwork
        });
    } catch (error) {
        next(error);
    }
};

// Update artwork
export const updateArtwork = async (req, res, next) => {
    try {
        const { title, description, price, commissionRate, categories, tags, dimensions, status } = req.body;
        
        const artwork = await Artwork.findOne({
            _id: req.params.artworkId,
            creatorId: req.creator._id
        });

        if (!artwork) {
            return next(createError(404, 'Artwork not found'));
        }

        // Handle image updates if provided
        if (req.files) {
            if (req.files.image) {
                // Delete old image
                await cloudinary.uploader.destroy(artwork.image.public_id);
                
                // Upload new image
                const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
                    folder: 'artworks/previews'
                });
                
                artwork.image = {
                    public_id: imageResult.public_id,
                    url: imageResult.secure_url
                };
            }

            if (req.files.printableVersion) {
                // Delete old printable version
                await cloudinary.uploader.destroy(artwork.printableVersion.public_id);
                
                // Upload new printable version
                const printableResult = await cloudinary.uploader.upload(req.files.printableVersion[0].path, {
                    folder: 'artworks/printable',
                    quality: 100
                });
                
                artwork.printableVersion = {
                    public_id: printableResult.public_id,
                    url: printableResult.secure_url
                };
            }
        }

        // Update other fields
        Object.assign(artwork, {
            title: title || artwork.title,
            description: description || artwork.description,
            price: price || artwork.price,
            commissionRate: commissionRate || artwork.commissionRate,
            categories: categories ? categories.split(',') : artwork.categories,
            tags: tags ? tags.split(',') : artwork.tags,
            dimensions: dimensions || artwork.dimensions,
            status: status || artwork.status
        });

        await artwork.save();

        // Create audit log
        await AuditLog.create({
            entityType: 'ARTWORK',
            entityId: artwork._id,
            action: 'UPDATE',
            userId: req.creator._id,
            userType: 'CREATOR',
            metadata: {
                title: artwork.title,
                price: artwork.price.toString(),
                commissionRate: artwork.commissionRate,
                status: artwork.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Artwork updated successfully',
            data: artwork
        });
    } catch (error) {
        next(error);
    }
};

// Delete artwork
export const deleteArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findOne({
            _id: req.params.artworkId,
            creatorId: req.creator._id
        });

        if (!artwork) {
            return next(createError(404, 'Artwork not found'));
        }

        // Delete images from Cloudinary
        await cloudinary.uploader.destroy(artwork.image.public_id);
        await cloudinary.uploader.destroy(artwork.printableVersion.public_id);

        // Delete artwork
        await artwork.deleteOne();

        // Create audit log
        await AuditLog.create({
            entityType: 'ARTWORK',
            entityId: artwork._id,
            action: 'DELETE',
            userId: req.creator._id,
            userType: 'CREATOR',
            metadata: {
                title: artwork.title
            }
        });

        res.status(200).json({
            success: true,
            message: 'Artwork deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get commission logs
export const getCommissionLogs = async (req, res, next) => {
    try {
        const commissionLogs = await Commission.find({
            sellerId: req.creator._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: commissionLogs
        });
    } catch (error) {
        next(error);
    }
};

// Get audit logs
export const getAuditLogs = async (req, res, next) => {
    try {
        const auditLogs = await AuditLog.find({
            userId: req.creator._id,
            userType: 'CREATOR'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: auditLogs
        });
    } catch (error) {
        next(error);
    }
};

// Get sales statistics
export const getSalesStats = async (req, res, next) => {
    try {
        const artworks = await Artwork.find({ creatorId: req.creator._id });
        
        const stats = {
            totalArtworks: artworks.length,
            totalSales: artworks.reduce((sum, artwork) => sum + artwork.totalSales, 0),
            totalRevenue: artworks.reduce((sum, artwork) => {
                return sum + parseFloat(artwork.totalRevenue.toString());
            }, 0),
            averageRating: artworks.reduce((sum, artwork) => {
                return sum + (artwork.rating.average * artwork.rating.count);
            }, 0) / artworks.reduce((sum, artwork) => sum + artwork.rating.count, 0) || 0,
            totalReviews: artworks.reduce((sum, artwork) => sum + artwork.rating.count, 0)
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};