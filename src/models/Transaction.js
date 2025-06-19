import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        // Optional as specified
        sparse: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer ID is required'],
        index: true
    },
    amount: {
        type: mongoose.Decimal128,
        required: [true, 'Amount is required'],
        validate: {
            validator: function(value) {
                return value >= 0;
            },
            message: 'Amount cannot be negative'
        }
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['STRIPE', 'RAZORPAY', 'BANK_TRANSFER', 'UPI', 'WALLET'],
            message: 'Invalid payment method'
        },
        required: [true, 'Payment method is required']
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
            message: 'Invalid transaction status'
        },
        default: 'PENDING'
    },
    providerTxnId: {
        type: String,
        sparse: true,
        index: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    errorDetails: {
        code: String,
        message: String,
        timestamp: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true // Once set, cannot be modified
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
        transform: function(doc, ret) {
            if (ret.amount) {
                // Convert Decimal128 to string for JSON responses
                ret.amount = ret.amount.toString();
            }
            // Remove sensitive data
            delete ret.errorDetails;
            delete ret.metadata;
            return ret;
        },
        virtuals: true
    },
    toObject: { virtuals: true }
});

// Indexes for better query performance
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ paymentMethod: 1, status: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
    return this.amount ? `₹${this.amount.toString()}` : '₹0';
});

// Instance method to check if transaction is successful
transactionSchema.methods.isSuccessful = function() {
    return this.status === 'COMPLETED';
};

// Instance method to check if transaction can be refunded
transactionSchema.methods.canBeRefunded = function() {
    return this.status === 'COMPLETED' && !this.refundedAt;
};

// Instance method to process refund
transactionSchema.methods.processRefund = async function(reason) {
    if (!this.canBeRefunded()) {
        throw new Error('Transaction cannot be refunded');
    }
    
    this.status = 'REFUNDED';
    this.metadata.set('refundReason', reason);
    this.metadata.set('refundedAt', new Date());
    
    return this.save();
};

// Static method to find transactions by customer
transactionSchema.statics.findByCustomer = function(customerId) {
    return this.find({ customerId }).sort({ createdAt: -1 });
};

// Static method to find transactions by order
transactionSchema.statics.findByOrder = function(orderId) {
    return this.find({ orderId }).sort({ createdAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getStatistics = async function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                status: 'COMPLETED'
            }
        },
        {
            $group: {
                _id: '$paymentMethod',
                totalAmount: { $sum: { $toDecimal: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ]);
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
    // If status is changing to COMPLETED, record the completion time
    if (this.isModified('status') && this.status === 'COMPLETED') {
        this.metadata.set('completedAt', new Date());
    }
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction; 