import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            logger.warn(`No token provided - ${req.method} ${req.url}`);
            return res.status(401).json({ status: "error", message: "No token provided", data: null });
        }
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

export default auth;