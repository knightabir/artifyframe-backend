import express from "express";
import { forgotPassword, login, register, resetPassword } from "../controllers/auth.controller.js";
import { forgotPasswordLimiter, loginLimiter, registerLimiter } from "../middlewares/ratelimit.middleware.js";

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);


export default router;