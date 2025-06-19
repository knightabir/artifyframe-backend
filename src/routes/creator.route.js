import express from "express";
import { addOrUpdateAddress, addOrUpdateBankDetails, addOrUpdateBio, createCreator, login } from "../controllers/creator.controller.js";
import auth from "../middlewares/auth.middlware.js";
import creatorAuth from "../middlewares/creatorAuth.middleware.js";



const router = express.Router();

router.post('/create', createCreator);
router.post('/login', login);
router.post('/bank', creatorAuth, addOrUpdateBankDetails);
router.post('/address', creatorAuth, addOrUpdateAddress);
router.post('/bio', creatorAuth, addOrUpdateBio);

export default router;