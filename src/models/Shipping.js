import mongoose from 'mongoose';

const shippingSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order ID is required'],
        index: true
    },
    carrier: {
        type: String,
        required: [true, 'Carrier name is required'],
        trim: true,
        enum: {
            values: ['DHL', 'FedEx', 'BlueDart', 'DTDC', 'Delhivery', 'Other'],
            message: 'Invalid carrier'
        }
    },
    trackingNumber: {
        type: String,
        required: [true, 'Tracking number is required'],
        trim: true,
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'],
            message: 'Invalid shipping status'
        },
        default: 'PENDING',
        index: true
    },
    shippedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    estimatedDeliveryDate: {
        type: Date
    },
    trackingHistory: [{
        status: String,
        location: String,
        timestamp: Date,
        description: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
shippingSchema.index({ carrier: 1, trackingNumber: 1 }, { unique: true });
shippingSchema.index({ status: 1, shippedAt: -1 });

// Virtual for delivery duration (in days)
shippingSchema.virtual('deliveryDuration').get(function() {
    if (this.shippedAt && this.deliveredAt) {
        return Math.ceil((this.deliveredAt - this.shippedAt) / (1000 * 60 * 60 * 24));
    }
    return null;
});

// Instance method to update tracking status
shippingSchema.methods.updateStatus = async function(status, location, description) {
    this.status = status;
    this.lastUpdated = new Date();
    
    if (status === 'PICKED_UP' && !this.shippedAt) {
        this.shippedAt = new Date();
    } else if (status === 'DELIVERED' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }

    this.trackingHistory.push({
        status,
        location,
        timestamp: new Date(),
        description
    });

    return this.save();
};

// Static method to find active shipments
shippingSchema.statics.findActiveShipments = function() {
    return this.find({
        status: { $in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] }
    }).sort({ shippedAt: -1 });
};

// Static method to find delayed shipments
shippingSchema.statics.findDelayedShipments = function() {
    const today = new Date();
    return this.find({
        status: { $ne: 'DELIVERED' },
        estimatedDeliveryDate: { $lt: today }
    }).sort({ estimatedDeliveryDate: 1 });
};

// Static method to get shipping statistics
shippingSchema.statics.getStatistics = async function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                shippedAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                averageDeliveryTime: {
                    $avg: {
                        $cond: [
                            { $and: [
                                { $ne: ['$deliveredAt', null] },
                                { $ne: ['$shippedAt', null] }
                            ]},
                            { $divide: [
                                { $subtract: ['$deliveredAt', '$shippedAt'] },
                                1000 * 60 * 60 * 24 // Convert to days
                            ]},
                            null
                        ]
                    }
                }
            }
        }
    ]);
};

const Shipping = mongoose.model('Shipping', shippingSchema);

export default Shipping; 