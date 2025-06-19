import PrinterUser from '../models/PrinterUser.js';
import AuditLog from '../models/AuditLog.js';
import cloudinary from '../config/cloudinary.js';
import { createError } from '../utils/error.js';

// Create printer user (admin only)
export const createPrinterUser = async (req, res, next) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            printingCapabilities,
            framingCapabilities,
            businessDetails,
            bankDetails
        } = req.body;

        // Check if printer user already exists
        const existingPrinter = await PrinterUser.findOne({ email });
        if (existingPrinter) {
            return next(createError(400, 'Printer user with this email already exists'));
        }

        // Handle document uploads
        const documents = {};
        if (req.files) {
            for (const [key, files] of Object.entries(req.files)) {
                const result = await cloudinary.uploader.upload(files[0].path, {
                    folder: 'printer_documents'
                });
                documents[key] = {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            }
        }

        const printerUser = new PrinterUser({
            name: { firstName, lastName },
            email,
            password,
            phone,
            address,
            printingCapabilities: printingCapabilities.split(','),
            framingCapabilities,
            businessDetails,
            bankDetails,
            documents
        });

        await printerUser.save();

        // Create audit log
        await AuditLog.create({
            entityType: 'PRINTER_USER',
            entityId: printerUser._id,
            action: 'CREATE',
            userId: req.user._id,
            userType: 'ADMIN',
            metadata: {
                email: printerUser.email,
                companyName: printerUser.businessDetails.companyName
            }
        });

        res.status(201).json({
            success: true,
            message: 'Printer user created successfully',
            data: printerUser
        });
    } catch (error) {
        next(error);
    }
};

// Get all printer users (admin only)
export const getAllPrinterUsers = async (req, res, next) => {
    try {
        const printers = await PrinterUser.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: printers
        });
    } catch (error) {
        next(error);
    }
};

// Get printer user by ID (admin only)
export const getPrinterUserById = async (req, res, next) => {
    try {
        const printer = await PrinterUser.findById(req.params.id)
            .select('-password');

        if (!printer) {
            return next(createError(404, 'Printer user not found'));
        }

        res.status(200).json({
            success: true,
            data: printer
        });
    } catch (error) {
        next(error);
    }
};

// Update printer user (admin only)
export const updatePrinterUser = async (req, res, next) => {
    try {
        const printer = await PrinterUser.findById(req.params.id);
        if (!printer) {
            return next(createError(404, 'Printer user not found'));
        }

        const {
            firstName,
            lastName,
            phone,
            address,
            printingCapabilities,
            framingCapabilities,
            businessDetails,
            bankDetails,
            status
        } = req.body;

        // Handle document uploads
        if (req.files) {
            for (const [key, files] of Object.entries(req.files)) {
                // Delete old document if exists
                if (printer.documents[key]?.public_id) {
                    await cloudinary.uploader.destroy(printer.documents[key].public_id);
                }

                const result = await cloudinary.uploader.upload(files[0].path, {
                    folder: 'printer_documents'
                });

                printer.documents[key] = {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            }
        }

        // Update fields
        Object.assign(printer, {
            name: { 
                firstName: firstName || printer.name.firstName,
                lastName: lastName || printer.name.lastName
            },
            phone: phone || printer.phone,
            address: address || printer.address,
            printingCapabilities: printingCapabilities ? printingCapabilities.split(',') : printer.printingCapabilities,
            framingCapabilities: framingCapabilities !== undefined ? framingCapabilities : printer.framingCapabilities,
            businessDetails: { ...printer.businessDetails, ...businessDetails },
            bankDetails: { ...printer.bankDetails, ...bankDetails },
            status: status || printer.status
        });

        await printer.save();

        // Create audit log
        await AuditLog.create({
            entityType: 'PRINTER_USER',
            entityId: printer._id,
            action: 'UPDATE',
            userId: req.user._id,
            userType: 'ADMIN',
            metadata: {
                email: printer.email,
                status: printer.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Printer user updated successfully',
            data: printer
        });
    } catch (error) {
        next(error);
    }
};

// Verify printer user (admin only)
export const verifyPrinterUser = async (req, res, next) => {
    try {
        const printer = await PrinterUser.findById(req.params.id);
        if (!printer) {
            return next(createError(404, 'Printer user not found'));
        }

        printer.isVerified = true;
        printer.verifiedAt = new Date();
        printer.status = 'ACTIVE';

        await printer.save();

        // Create audit log
        await AuditLog.create({
            entityType: 'PRINTER_USER',
            entityId: printer._id,
            action: 'VERIFY',
            userId: req.user._id,
            userType: 'ADMIN',
            metadata: {
                email: printer.email,
                verifiedAt: printer.verifiedAt
            }
        });

        res.status(200).json({
            success: true,
            message: 'Printer user verified successfully',
            data: printer
        });
    } catch (error) {
        next(error);
    }
};

// Delete printer user (admin only)
export const deletePrinterUser = async (req, res, next) => {
    try {
        const printer = await PrinterUser.findById(req.params.id);
        if (!printer) {
            return next(createError(404, 'Printer user not found'));
        }

        // Delete all documents from Cloudinary
        for (const doc of Object.values(printer.documents)) {
            if (doc?.public_id) {
                await cloudinary.uploader.destroy(doc.public_id);
            }
        }

        await printer.deleteOne();

        // Create audit log
        await AuditLog.create({
            entityType: 'PRINTER_USER',
            entityId: printer._id,
            action: 'DELETE',
            userId: req.user._id,
            userType: 'ADMIN',
            metadata: {
                email: printer.email
            }
        });

        res.status(200).json({
            success: true,
            message: 'Printer user deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get printer user statistics (admin only)
export const getPrinterUserStats = async (req, res, next) => {
    try {
        const printer = await PrinterUser.findById(req.params.id);
        if (!printer) {
            return next(createError(404, 'Printer user not found'));
        }

        const stats = {
            completedOrders: printer.completedOrders,
            activeOrders: printer.activeOrders,
            rating: printer.rating,
            status: printer.status,
            isVerified: printer.isVerified,
            verifiedAt: printer.verifiedAt,
            lastLogin: printer.lastLogin
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
}; 