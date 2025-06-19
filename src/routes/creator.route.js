import express from "express";
import { addOrUpdateAddress, addOrUpdateBankDetails, addOrUpdateBio, createCreator, login, addOrUpdateProfilePicture, addOrUpdateCoverPicture, uploadArtwork, getCreatorArtworks, getArtworkDetails, updateArtwork, deleteArtwork, getCommissionLogs, getAuditLogs, getSalesStats } from "../controllers/creator.controller.js";
import creatorAuth from "../middlewares/creatorAuth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post('/create', createCreator);
router.post('/login', login);
router.post('/bank', creatorAuth, addOrUpdateBankDetails);
router.post('/address', creatorAuth, addOrUpdateAddress);
router.post('/bio', creatorAuth, addOrUpdateBio);

// Profile picture upload/update
router.patch('/profile-picture', creatorAuth, (req, res, next) => { req.uploadType = 'profile'; next(); }, upload.single('image'), addOrUpdateProfilePicture);

// Cover picture upload/update
router.patch('/cover-picture', creatorAuth, (req, res, next) => { req.uploadType = 'cover'; next(); }, upload.single('image'), addOrUpdateCoverPicture);

// Artwork management routes
router.post(
    '/artwork',
    creatorAuth,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'printableVersion', maxCount: 1 }
    ]),
    uploadArtwork
);

router.get('/artworks', creatorAuth, getCreatorArtworks);
router.get('/artwork/:artworkId', creatorAuth, getArtworkDetails);

router.put(
    '/artwork/:artworkId',
    creatorAuth,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'printableVersion', maxCount: 1 }
    ]),
    updateArtwork
);

router.delete('/artwork/:artworkId', creatorAuth, deleteArtwork);

// Analytics and logs routes
router.get('/commission-logs', creatorAuth, getCommissionLogs);
router.get('/audit-logs', creatorAuth, getAuditLogs);
router.get('/sales-stats', creatorAuth, getSalesStats);

export default router;