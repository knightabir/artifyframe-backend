import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer ID is required']
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            message: 'Invalid order status'
        },
        default: 'PENDING'
    },
    totalAmount: {
        type: mongoose.Decimal128,
        required: [true, 'Total amount is required'],
        validate: {
            validator: function(value) {
                return value >= 0;
            },
            message: 'Total amount cannot be negative'
        }
    },
    shippingAddress: {
        name: {
            type: String,
            required: [true, 'Shipping name is required']
        },
        street: {
            type: String,
            required: [true, 'Street address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required']
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required']
        }
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            message: 'Invalid payment status'
        },
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        sparse: true,
        index: true
    },
    placedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'placedAt', updatedAt: 'updatedAt' },
    toJSON: { 
        transform: function(doc, ret) {
            if (ret.totalAmount) {
                // Convert Decimal128 to string for JSON responses
                ret.totalAmount = ret.totalAmount.toString();
            }
            return ret;
        },
        virtuals: true 
    },
    toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ placedAt: -1 });

// Virtual for formatted total amount
orderSchema.virtual('formattedTotalAmount').get(function() {
    return this.totalAmount ? `₹${this.totalAmount.toString()}` : '₹0';
});

// Pre-save middleware to update timestamps
orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance method to calculate delivery estimate
orderSchema.methods.getEstimatedDeliveryDate = function() {
    // Add 5-7 business days to the order date
    const deliveryDate = new Date(this.placedAt);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate;
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId) {
    return this.find({ customerId }).sort({ placedAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
    return this.find({ status }).sort({ placedAt: -1 });
};

// Static method to find orders by payment status
orderSchema.statics.findByPaymentStatus = function(paymentStatus) {
    return this.find({ paymentStatus }).sort({ placedAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);

export default Order; 