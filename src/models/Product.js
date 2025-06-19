import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Creator",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: [3, 'Title must be at least 3 characters long'],
        maxLength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: [10, 'Description must be at least 10 characters long'],
        maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    commission: {
        type: Number,
        required: true,
        min: [0, 'Commission cannot be negative']
    },
    category: {
        type: String,
        enum: ["ARTWORK", "FRAMES"],
        required: true
    },
    thumbnail: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    rawFile: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true,
            enum: ['PSD', 'AI', 'PDF', 'RAW', 'Other']
        },
        fileSize: {
            type: Number,
            required: true
        }
    },
    tags: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length <= 10;
            },
            message: 'Cannot have more than 10 tags'
        }
    },
    dimensions: {
        type: {
            width: {
                type: Number,
                required: true,
                min: [0, 'Width cannot be negative']
            },
            height: {
                type: Number,
                required: true,
                min: [0, 'Height cannot be negative']
            },
            depth: {
                type: Number,
                min: [0, 'Depth cannot be negative']
            },
            units: {
                type: String,
                required: true,
                enum: ['cm', 'inches', 'pixels']
            }
        }
    },
    isCopyrightVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
