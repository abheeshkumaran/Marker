import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        // due date of the next unpaid installment; moves forward a month each time one is paid
        date: { type: Date, required: true },
        // day of the month installments fall on, so short months don't shift later due dates
        dueDay: { type: Number, min: 1, max: 31 },
        // amount of each installment
        duePayment: { type: Number, required: true, min: 0 },
        // payment info: who / what the payment is for
        transferTo: { type: String, required: true, trim: true },
        // total number of installments for this payment
        noOfPendings: { type: Number, required: true, min: 1 },
        // installments paid so far; the next one is paidCount + 1 of noOfPendings
        paidCount: { type: Number, default: 0, min: 0 },
        // 'paid' once every installment is paid
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

// In dev, hot reload re-runs this file; drop the cached model so schema edits take effect.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Payment) {
    mongoose.deleteModel('Payment');
}

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
