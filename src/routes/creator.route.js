import express from "express";
import { addOrUpdateAddress, addOrUpdateBankDetails, addOrUpdateBio, createCreator, login, addOrUpdateProfilePicture, addOrUpdateCoverPicture } from "../controllers/creator.controller.js";
import auth from "../middlewares/auth.middlware.js";
import creatorAuth from "../middlewares/creatorAuth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post('/create', createCreator);
router.post('/login', login);
router.post('/bank', creatorAuth, addOrUpdateBankDetails);
router.post('/address', creatorAuth, addOrUpdateAddress);
router.post('/bio', creatorAuth, addOrUpdateBio);

// Profile picture upload/update
router.patch('/profile-picture', auth, (req, res, next) => { req.uploadType = 'profile'; next(); }, upload.single('image'), addOrUpdateProfilePicture);

// Cover picture upload/update
router.patch('/cover-picture', auth, (req, res, next) => { req.uploadType = 'cover'; next(); }, upload.single('image'), addOrUpdateCoverPicture);

export default router;