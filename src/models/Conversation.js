import mongoose from 'mongoose';

// One row per connection. Tracks when the chat was last cleared so the other
// client can wipe its view too.
const ConversationSchema = new mongoose.Schema(
    {
        connectionId: { type: String, required: true, unique: true },
        clearedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export default mongoose.models.Conversation ||
    mongoose.model('Conversation', ConversationSchema);
