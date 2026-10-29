import PaymentReminders from '../PaymentReminders';

export default function PaymentsPage() {
    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Payment Reminders</h1>
                <PaymentReminders />
            </div>
        </main>
    );
}
