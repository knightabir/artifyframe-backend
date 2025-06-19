import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";


const creatorSchema = new mongoose.Schema({
    name: {
        firstName: {
            type: String,
            minlength: [2, "First name must be at least 2 characters long"],
            maxlength: [50, "First name cannot exceed 50 characters"],
            trim: true
        },
        lastName: {
            type: String,
            minlength: [2, "Last name must be at least 2 characters long"],
            maxlength: [50, "Last name cannot exceed 50 characters"],
            trim: true
        }
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email already exists"],
        lowercase: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email address",
        ],
    },
    govermentIds: {
        aadhaar: {
            type: String,
            match: [
                /^([0-9]){12}$/,
                "Please provide a valid Aadhaar number",
            ],
            trim: true
        },
        pan: {
            type: String,
            match: [
                /^([A-Z]){5}([0-9]){4}([A-Z]){1}?$/,
                "Please provide a valid PAN number",
            ],
            trim: true
        }
    },
    phoneNumber: {
        type: String,
        unique: [true, "Phone number already exists"],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"]
    },
    bio: {
        type: String,
        trim: true
    },

    bankInformation: {
        bankName: {
            type: String,
            trim: true
        },
        branchName: {
            type: String,
            trim: true
        },
        IFSC: {
            type: String,
            trim: true
        },
        accountNumber: {
            type: String
        },
        accountHolderName: {
            type: String
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    address: {
        label: {
            type: String,
            enum: ["home", "work", "billing", "shipping", "other"],
            default: "home"
        },
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zip: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        }
    },
    role: {
        type: String,
        enum: ["creator", "admin", "superadmin"],
        default: "creator"
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
    },
    coverImage: {
        type: String
    },
    isProfileCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
creatorSchema.index({ email: 1 });
creatorSchema.index({ role: 1 });
creatorSchema.index({ isActive: 1 });


// Hash password before saving
creatorSchema.pre('save', async function (next) {
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

//AES-256 encryption for sensitive data
creatorSchema.methods.encryptData = function (data) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for encryption');
    }

    const cipher = crypto.createCipher('aes-256-cbc', process.env.JWT_SECRET);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

//AES-256 decryption for sensitive data
creatorSchema.methods.decryptData = function (encryptedData) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for decryption');
    }

    const decipher = crypto.createDecipher('aes-256-cbc', process.env.JWT_SECRET);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Compare password method
creatorSchema.methods.comparePassword = async function (candidatePassword) {
    if (!candidatePassword || !this.password) {
        throw new Error('Password and candidate password are required');
    }
    return await bcrypt.compare(candidatePassword, this.password);
}

// Get full name
creatorSchema.virtual('fullName').get(function () {
    return `${this.name.firstName} ${this.name.lastName}`;
});

// Transform JSON output
creatorSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
}

const Creator = mongoose.model('Creator', creatorSchema);
export default Creator;