import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
    {
        // owner — every query is scoped by this so users never see each other's rows
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true },
);

export default mongoose.models.Activity ||
    mongoose.model('Activity', ActivitySchema);
