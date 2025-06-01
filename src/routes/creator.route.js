import express from "express";
import { createCreator, login } from "../controllers/creator.controller.js";



const router = express.Router();

router.post('/create', createCreator);
router.post('/login', login);

export default router;