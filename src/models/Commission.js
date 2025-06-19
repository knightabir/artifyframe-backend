import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator', // Assuming Creator model is used for sellers
        required: [true, 'Seller ID is required'],
        index: true
    },
    orderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: [true, 'Order Item ID is required'],
        index: true
    },
    amount: {
        type: mongoose.Decimal128,
        required: [true, 'Commission amount is required'],
        validate: {
            validator: function(value) {
                return value >= 0;
            },
            message: 'Commission amount cannot be negative'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
            message: 'Invalid commission status'
        },
        default: 'PENDING',
        index: true
    },
    paymentDetails: {
        transactionId: String,
        paidAt: Date,
        method: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
        transform: function(doc, ret) {
            if (ret.amount) {
                ret.amount = ret.amount.toString();
            }
            return ret;
        },
        virtuals: true
    }
});

// Indexes for better query performance
commissionSchema.index({ createdAt: -1 });
commissionSchema.index({ sellerId: 1, status: 1 });
commissionSchema.index({ orderItemId: 1, sellerId: 1 }, { unique: true });

// Virtual for formatted amount
commissionSchema.virtual('formattedAmount').get(function() {
    return this.amount ? `₹${this.amount.toString()}` : '₹0';
});

// Instance method to process payment
commissionSchema.methods.markAsPaid = async function(transactionId, method) {
    if (this.status === 'PAID') {
        throw new Error('Commission is already paid');
    }
    
    this.status = 'PAID';
    this.paymentDetails = {
        transactionId,
        paidAt: new Date(),
        method
    };
    
    return this.save();
};

// Static method to find pending commissions for a seller
commissionSchema.statics.findPendingBySeller = function(sellerId) {
    return this.find({
        sellerId,
        status: 'PENDING'
    }).sort({ createdAt: -1 });
};

// Static method to get commission statistics
commissionSchema.statics.getSellerStatistics = async function(sellerId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                sellerId: new mongoose.Types.ObjectId(sellerId),
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                totalAmount: { $sum: { $toDecimal: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ]);
};

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission; 