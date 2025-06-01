import User from "../models/User.js";
import logger from "../utils/logger.js";

// Update user profile
export const updateUserProfile = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }
        const { firstName, lastName, phoneNumber, password } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }
        user.name.firstName = firstName;
        user.name.lastName = lastName;
        user.phoneNumber = phoneNumber;
        user.password = password;
        await user.save();
        if (user) {
            logger.info(`User profile updated successfully - ${req.method} ${req.url}`);
            res.status(200).json({ status: "success", message: "User profile updated successfully", data: user });
        }
    } catch (error) {
        logger.warn(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}


// Get user profile
export const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password -__v -createdAt -updatedAt -lastLogin -role -isActive -consent -addresses');

        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }

        res.status(200).json({ status: "success", message: "User profile", data: user });

    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// add address
export const addAddress = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }

        let { label, street, apartment, city, state, zip, country, landmark, isDefault } = req.body;

        if (user.addresses.length <= 0) {
            isDefault = true;
        }

        user.addresses.push({ label, street, apartment, city, state, zip, country, landmark, isDefault: isDefault });
        await user.save();
        if (user) {
            logger.info(`Address added successfully - ${req.method} ${req.url}`);
            res.status(200).json({ status: "success", message: "Address added successfully", data: user });
        }
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// update address
export const updateAddress = async (req, res, next) => {
    try {
        if (!req.body) {
            logger.warn(`All fields are required - ${req.method} ${req.url}`);
            return res.status(400).json({ status: "error", message: "All fields are required", data: null });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }

        const addressId = req.params.addressId;
        const address = user.addresses.find(address => address._id == addressId);
        if (!address) {
            logger.warn(`Address not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Address not found", data: null });
        }
        const { label, street, apartment, city, state, zip, country, landmark, isDefault } = req.body;
        address.label = label;
        address.street = street;
        address.apartment = apartment;
        address.city = city;
        address.state = state;
        address.zip = zip;
        address.country = country;
        address.landmark = landmark;
        address.isDefault = isDefault;
        await user.save();
        if (user) {
            logger.info(`Address updated successfully - ${req.method} ${req.url}`);
            res.status(200).json({ status: "success", message: "Address updated successfully", data: user });
        }
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// remove address
export const removeAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }
        const addressId = req.params.addressId;
        const addressIndex = user.addresses.findIndex(address => address._id.toString() === addressId);
        if (addressIndex === -1) {
            logger.warn(`Address not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Address not found", data: null });
        }
        
        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If removed address was default and there are other addresses, make the first one default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }
        
        await user.save();
        logger.info(`Address removed successfully - ${req.method} ${req.url}`);
        res.status(200).json({ status: "success", message: "Address removed successfully", data: user });
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// set default address
export const setDefaultAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }
        const addressId = req.params.addressId;
        const address = user.addresses.find(address => address._id == addressId);
        if (!address) {
            logger.warn(`Address not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Address not found", data: null });
        }
        if (address.isDefault) {
            logger.info(`Default address is already set - ${req.method} ${req.url}`);
            return res.status(200).json({ status: "success", message: "Default address is already set", data: user });
        }

        // remove default from all addresses
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // set target address as default
        address.isDefault = true;

        await user.save();
        if (user) {
            logger.info(`Default address set successfully - ${req.method} ${req.url}`);
            res.status(200).json({ status: "success", message: "Default address set successfully", data: user });
        }
    } catch (error) {
        logger.error(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

// get default address
export const getDefaultAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            logger.warn(`User not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "User not found", data: null });
        }

        const defaultAddress = user.addresses.find(address => address.isDefault == true);
        if (!defaultAddress) {
            logger.warn(`Default address not found - ${req.method} ${req.url}`);
            return res.status(404).json({ status: "error", message: "Default address not found", data: null });
        }
        res.status(200).json({ status: "success", message: "Default address", data: defaultAddress });
    } catch (error) {
        logger.warn(`${error.message} - ${req.method} ${req.url}`);
        next(error);
    }
}

