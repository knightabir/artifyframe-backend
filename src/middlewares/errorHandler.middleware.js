import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    logger.error(`${err.message} - ${req.method} ${req.url}`);
    res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
}

export default errorHandler;