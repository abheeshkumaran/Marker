import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'superadmin'],
            default: 'user',
            required: true,
        },
        // bcrypt hash — never selected by default
        password: {
            type: String,
            required: true,
            select: false,
        },
        // 8-char code (lower + upper + digit + special), unique per user,
        // generated once at registration and never reused.
        connectingCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        // updated on chat activity — used for the WhatsApp-style "last seen"
        lastSeenAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
