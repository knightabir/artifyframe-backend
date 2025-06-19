import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    entityType: {
        type: String,
        required: [true, 'Entity type is required'],
        enum: {
            values: ['USER', 'ORDER', 'TRANSACTION', 'COMMISSION', 'CREATOR', 'SHIPPING'],
            message: 'Invalid entity type'
        },
        index: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Entity ID is required'],
        index: true
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: {
            values: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'REFUND'],
            message: 'Invalid action type'
        },
        index: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Performer ID is required'],
        index: true
    },
    meta: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map(),
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
        index: true
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }, // We don't need updatedAt for audit logs
    toJSON: {
        transform: function(doc, ret) {
            // Convert meta Map to plain object for JSON
            if (ret.meta instanceof Map) {
                ret.meta = Object.fromEntries(ret.meta);
            }
            return ret;
        }
    }
});

// Compound indexes for common queries
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(params) {
    const {
        entityType,
        entityId,
        action,
        performedBy,
        meta = {},
        ipAddress,
        userAgent
    } = params;

    const log = new this({
        entityType,
        entityId,
        action,
        performedBy,
        meta,
        ipAddress,
        userAgent
    });

    return log.save();
};

// Static method to find logs by entity
auditLogSchema.statics.findByEntity = function(entityType, entityId) {
    return this.find({
        entityType,
        entityId
    })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email');
};

// Static method to find logs by user
auditLogSchema.statics.findByUser = function(userId) {
    return this.find({
        performedBy: userId
    })
    .sort({ createdAt: -1 });
};

// Static method to get activity statistics
auditLogSchema.statics.getActivityStats = async function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    entityType: '$entityType',
                    action: '$action'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.entityType',
                actions: {
                    $push: {
                        action: '$_id.action',
                        count: '$count'
                    }
                },
                totalCount: { $sum: '$count' }
            }
        }
    ]);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog; 