import express from 'express';
import {
    createPrinterUser,
    getAllPrinterUsers,
    getPrinterUserById,
    updatePrinterUser,
    verifyPrinterUser,
    deletePrinterUser,
    getPrinterUserStats
} from '../controllers/printer.controller.js';
import { adminAuthMiddleware } from '../middlewares/auth.middleware.js';
import upload  from '../middlewares/upload.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuthMiddleware);

// Create printer user with document upload
router.post(
    '/',
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'shopLicense', maxCount: 1 }
    ]),
    createPrinterUser
);

// Get all printer users
router.get('/', getAllPrinterUsers);

// Get printer user by ID
router.get('/:id', getPrinterUserById);

// Update printer user with document upload
router.put(
    '/:id',
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'shopLicense', maxCount: 1 }
    ]),
    updatePrinterUser
);

// Verify printer user
router.patch('/:id/verify', verifyPrinterUser);

// Delete printer user
router.delete('/:id', deletePrinterUser);

// Get printer user statistics
router.get('/:id/stats', getPrinterUserStats);

export default router; 