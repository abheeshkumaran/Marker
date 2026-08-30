import mongoose from 'mongoose';

const ConnectionRequestSchema = new mongoose.Schema(
    {
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        toUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
            index: true,
        },
    },
    { timestamps: true },
);

// Fast lookup of a specific pair.
ConnectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

export default mongoose.models.ConnectionRequest ||
    mongoose.model('ConnectionRequest', ConnectionRequestSchema);
