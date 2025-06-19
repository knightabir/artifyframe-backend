import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const printerUserSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    printingCapabilities: [{
        type: String,
        enum: ['DIGITAL', 'OFFSET', 'LARGE_FORMAT', 'PHOTO', 'FINE_ART']
    }],
    framingCapabilities: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    completedOrders: {
        type: Number,
        default: 0
    },
    activeOrders: {
        type: Number,
        default: 0
    },
    businessDetails: {
        companyName: {
            type: String,
            required: true
        },
        gstNumber: {
            type: String,
            required: true,
            unique: true
        },
        panNumber: {
            type: String,
            required: true,
            unique: true
        },
        businessType: {
            type: String,
            enum: ['INDIVIDUAL', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED']
        }
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        accountHolderName: String
    },
    documents: {
        gstCertificate: {
            public_id: String,
            url: String
        },
        panCard: {
            public_id: String,
            url: String
        },
        shopLicense: {
            public_id: String,
            url: String
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    lastLogin: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
printerUserSchema.index({ 'name.firstName': 1, 'name.lastName': 1 });
printerUserSchema.index({ status: 1 });
printerUserSchema.index({ completedOrders: -1 });
printerUserSchema.index({ 'businessDetails.companyName': 1 });

// Virtual for full name
printerUserSchema.virtual('fullName').get(function() {
    return `${this.name.firstName} ${this.name.lastName}`;
});

// Hash password before saving
printerUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
printerUserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update order counts
printerUserSchema.methods.updateOrderCounts = async function(completed = false) {
    if (completed) {
        this.completedOrders += 1;
        this.activeOrders -= 1;
    } else {
        this.activeOrders += 1;
    }
    return this.save();
};

// Add rating
printerUserSchema.methods.addRating = async function(newRating) {
    const totalRating = (this.rating.average * this.rating.count) + newRating;
    this.rating.count += 1;
    this.rating.average = totalRating / this.rating.count;
    return this.save();
};

// Static method to find available printers
printerUserSchema.statics.findAvailable = function() {
    return this.find({
        status: 'ACTIVE',
        isVerified: true
    }).sort({ 'rating.average': -1 });
};

// Static method to find by capabilities
printerUserSchema.statics.findByCapabilities = function(printingType, needsFraming) {
    const query = {
        status: 'ACTIVE',
        isVerified: true,
        printingCapabilities: printingType
    };
    
    if (needsFraming) {
        query.framingCapabilities = true;
    }
    
    return this.find(query).sort({ 'rating.average': -1 });
};

const PrinterUser = mongoose.model('PrinterUser', printerUserSchema);

export default PrinterUser; 