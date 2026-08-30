import mongoose from 'mongoose';

// Persisted chat messages. Only written while a conversation's `store` flag is on.
const ChatMessageSchema = new mongoose.Schema(
    {
        connectionId: { type: String, required: true, index: true },
        mid: { type: String, required: true }, // client-facing message id (uuid)
        fromUserId: { type: String, required: true },
        fromUsername: { type: String, required: true },
        text: { type: String, required: true },
        ts: { type: Number, required: true, index: true },
    },
    { timestamps: true },
);

// De-dupe when re-persisting the in-memory buffer as storage is turned on.
ChatMessageSchema.index({ connectionId: 1, mid: 1 }, { unique: true });

export default mongoose.models.ChatMessage ||
    mongoose.model('ChatMessage', ChatMessageSchema);
