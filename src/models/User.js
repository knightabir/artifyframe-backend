import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        required: [true, "Address label is required"],
        enum: ["home", "work", "billing", "shipping", "other"],
        default: "home"
    },
    street: {
        type: String,
        required: [true, "Street is required"],
        trim: true
    },
    apartment: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true
    },
    zip: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
        match: [/^\d{6}$/, "Please provide a valid Indian pin code"]
    },
    country: {
        type: String,
        required: [true, "Country is required"],
        default: "India",
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const userSchema = new mongoose.Schema({
    name: {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            minlength: [2, "First name must be at least 2 characters long"],
            maxlength: [50, "First name cannot exceed 50 characters"],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            minlength: [2, "Last name must be at least 2 characters long"],
            maxlength: [50, "Last name cannot exceed 50 characters"],
            trim: true
        }
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email address",
        ],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false,
    },
    addresses: {
        type: [addressSchema],
        validate: {
            validator: function(addresses) {
                // Ensure only one default address
                const defaultAddresses = addresses.filter(addr => addr.isDefault);
                return defaultAddresses.length <= 1;
            },
            message: "Only one address can be set as default"
        }
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"]
    },
    role: {
        type: String,
        enum: {
            values: ["user", "admin", "printer", "designer"],
            message: "Role must be one of: user, admin, printer, designer"
        },
        default: "user",
    },
    consent: {
        type: Boolean,
        required: [true, "Consent is required"],
        validate: {
            validator: function(consent) {
                return consent === true;
            },
            message: "You must accept the terms and conditions"
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    profileImage: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ "addresses.isDefault": 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Ensure only one default address
userSchema.pre('save', function (next) {
    if (this.addresses && this.addresses.length > 0) {
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
        
        // If no default address is set, make the first one default
        if (defaultAddresses.length === 0) {
            this.addresses[0].isDefault = true;
        }
        // If multiple default addresses, keep only the first one as default
        else if (defaultAddresses.length > 1) {
            let firstDefaultFound = false;
            this.addresses.forEach(addr => {
                if (addr.isDefault && !firstDefaultFound) {
                    firstDefaultFound = true;
                } else if (addr.isDefault) {
                    addr.isDefault = false;
                }
            });
        }
    }
    next();
});

// AES-256 encryption for sensitive data
userSchema.methods.encryptData = function (data) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for encryption');
    }
    
    const cipher = crypto.createCipher('aes-256-cbc', process.env.JWT_SECRET);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// AES-256 decryption for sensitive data
userSchema.methods.decryptData = function (encryptedData) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for decryption');
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.JWT_SECRET);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!candidatePassword || !this.password) {
        throw new Error('Password and candidate password are required');
    }
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
    return `${this.name.firstName} ${this.name.lastName}`;
});

// Get default address
userSchema.virtual('defaultAddress').get(function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Instance method to add address
userSchema.methods.addAddress = function(addressData) {
    // If this is the first address or explicitly set as default, make it default
    if (this.addresses.length === 0 || addressData.isDefault) {
        // Remove default from other addresses
        this.addresses.forEach(addr => {
            addr.isDefault = false;
        });
        addressData.isDefault = true;
    }
    
    this.addresses.push(addressData);
    return this.save();
};

// Instance method to update address
userSchema.methods.updateAddress = function(addressId, updateData) {
    const address = this.addresses.id(addressId);
    if (!address) {
        throw new Error('Address not found');
    }
    
    // If setting as default, remove default from others
    if (updateData.isDefault) {
        this.addresses.forEach(addr => {
            if (addr._id.toString() !== addressId.toString()) {
                addr.isDefault = false;
            }
        });
    }
    
    Object.assign(address, updateData);
    return this.save();
};

// Instance method to remove address
userSchema.methods.removeAddress = function(addressId) {
    const address = this.addresses.id(addressId);
    if (!address) {
        throw new Error('Address not found');
    }
    
    const wasDefault = address.isDefault;
    address.remove();
    
    // If removed address was default, make first remaining address default
    if (wasDefault && this.addresses.length > 0) {
        this.addresses[0].isDefault = true;
    }
    
    return this.save();
};

// Instance method to set default address
userSchema.methods.setDefaultAddress = function(addressId) {
    const targetAddress = this.addresses.id(addressId);
    if (!targetAddress) {
        throw new Error('Address not found');
    }
    
    // Remove default from all addresses
    this.addresses.forEach(addr => {
        addr.isDefault = false;
    });
    
    // Set target address as default
    targetAddress.isDefault = true;
    
    return this.save();
};

// Static method to find user with addresses
userSchema.statics.findWithAddresses = function(query) {
    return this.findOne(query).populate('addresses');
};

// Transform JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model("User", userSchema);
export default User;