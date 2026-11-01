import mongoose from 'mongoose';

// Payment structure: the daily amount due (and captain) for a rental from `effectiveFrom`
// until the next rate's effectiveFrom. Old rates are kept as history.
const RentalRateSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalSource', required: true },
        effectiveFrom: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        captain: { type: String, required: true, trim: true, maxlength: 60 },
    },
    { timestamps: true, collection: 'rentalrates' },
);

RentalRateSchema.index({ rentalId: 1, effectiveFrom: 1 }, { unique: true });

// In dev, hot reload re-runs this file; drop the cached model so schema edits take effect.
if (process.env.NODE_ENV !== 'production' && mongoose.models.RentalRate) {
    mongoose.deleteModel('RentalRate');
}

export default mongoose.models.RentalRate || mongoose.model('RentalRate', RentalRateSchema);
