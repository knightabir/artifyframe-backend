import jwt, { decode } from "jsonwebtoken";
import Creator from "../models/Creator.js";
import logger from "../utils/logger.js";

const creatorAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            logger.warn(`No token provided - ${req.metho} ${req.url}`);
        }

        
        const token = authHeader.split(" ")[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const creator = await Creator.findById(decoded.id);
        
        console.log(decoded);
        if (!creator) {
            logger.warn(`Creator not found - ${req.method} ${req.url}`);
        }

        req.user = creator;
        req.token = token;
        next();
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

export default creatorAuth;