import mongoose from 'mongoose';

// One row per rental per day. Rows are created automatically as pending; recording a
// payment fills in success / advance and recalculates pending.
const RentalEntrySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalSource', required: true },
        date: { type: Date, required: true },
        captain: { type: String, trim: true, maxlength: 60, default: '' },
        // amount due for the day, from the payment structure
        payment: { type: Number, required: true, min: 0 },
        // amount actually received
        success: { type: Number, default: 0, min: 0 },
        paymentType: { type: String, trim: true, maxlength: 30, default: '' },
        advance: { type: Number, default: 0, min: 0 },
        // payment - success - advance, never below 0
        pending: { type: Number, required: true, min: 0 },
        remark: { type: String, trim: true, maxlength: 200, default: '' },
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        // set once a payment has been recorded; structure changes leave these rows alone
        recordedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: 'rentalentries' },
);

RentalEntrySchema.index({ rentalId: 1, date: 1 }, { unique: true });

// In dev, hot reload re-runs this file; drop the cached model so schema edits take effect.
if (process.env.NODE_ENV !== 'production' && mongoose.models.RentalEntry) {
    mongoose.deleteModel('RentalEntry');
}

export default mongoose.models.RentalEntry || mongoose.model('RentalEntry', RentalEntrySchema);
