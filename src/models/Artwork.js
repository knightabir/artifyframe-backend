import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
        required: [true, 'Creator ID is required'],
        index: true
    },
    image: {
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    },
    // High-resolution version for printing
    printableVersion: {
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    },
    price: {
        type: mongoose.Decimal128,
        required: [true, 'Price is required'],
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Price must be greater than 0'
        }
    },
    commissionRate: {
        type: Number,
        required: [true, 'Commission rate is required'],
        min: [0, 'Commission rate cannot be negative'],
        max: [100, 'Commission rate cannot exceed 100%'],
        default: 10
    },
    categories: [{
        type: String,
        required: true,
        enum: ['ABSTRACT', 'LANDSCAPE', 'PORTRAIT', 'MODERN', 'TRADITIONAL', 'DIGITAL', 'OTHER']
    }],
    tags: [{
        type: String,
        trim: true
    }],
    dimensions: {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        unit: { 
            type: String, 
            enum: ['INCHES', 'CM'],
            default: 'INCHES'
        }
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'REJECTED', 'ARCHIVED'],
        default: 'DRAFT'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: mongoose.Decimal128,
        default: 0
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
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            if (ret.price) ret.price = ret.price.toString();
            if (ret.totalRevenue) ret.totalRevenue = ret.totalRevenue.toString();
            return ret;
        },
        virtuals: true
    }
});

// Indexes for better query performance
artworkSchema.index({ title: 'text', description: 'text' });
artworkSchema.index({ categories: 1 });
artworkSchema.index({ tags: 1 });
artworkSchema.index({ status: 1, isActive: 1 });
artworkSchema.index({ creatorId: 1, status: 1 });

// Virtual for formatted price
artworkSchema.virtual('formattedPrice').get(function() {
    return this.price ? `₹${this.price.toString()}` : '₹0';
});

// Calculate commission amount
artworkSchema.methods.calculateCommission = function(salePrice) {
    const commission = (salePrice * this.commissionRate) / 100;
    return new mongoose.Types.Decimal128(commission.toFixed(2));
};

// Update sales statistics
artworkSchema.methods.updateSalesStats = async function(saleAmount) {
    this.totalSales += 1;
    this.totalRevenue = new mongoose.Types.Decimal128(
        (parseFloat(this.totalRevenue.toString()) + parseFloat(saleAmount.toString())).toFixed(2)
    );
    return this.save();
};

// Add review
artworkSchema.methods.addReview = async function(userId, rating, comment) {
    this.reviews.push({ userId, rating, comment });
    
    // Update average rating
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
    
    return this.save();
};

// Static method to find popular artworks
artworkSchema.statics.findPopular = function() {
    return this.find({
        status: 'PUBLISHED',
        isActive: true
    })
    .sort({ totalSales: -1, 'rating.average': -1 })
    .limit(10);
};

// Static method to find by creator
artworkSchema.statics.findByCreator = function(creatorId) {
    return this.find({
        creatorId,
        isActive: true
    })
    .sort({ createdAt: -1 });
};

const Artwork = mongoose.model('Artwork', artworkSchema);

export default Artwork; 