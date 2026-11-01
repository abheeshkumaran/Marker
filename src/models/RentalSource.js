import mongoose from 'mongoose';

// Something rented out (e.g. a vehicle) — the "Rentals from" dropdown.
const RentalSourceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 60 },
        // lowercase copy of name so "Dzire" and "dzire" count as the same rental
        key: { type: String, required: true },
    },
    { timestamps: true, collection: 'rentalsources' },
);

RentalSourceSchema.index({ userId: 1, key: 1 }, { unique: true });

// In dev, hot reload re-runs this file; drop the cached model so schema edits take effect.
if (process.env.NODE_ENV !== 'production' && mongoose.models.RentalSource) {
    mongoose.deleteModel('RentalSource');
}

export default mongoose.models.RentalSource || mongoose.model('RentalSource', RentalSourceSchema);
