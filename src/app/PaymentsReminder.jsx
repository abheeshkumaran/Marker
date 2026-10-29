'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PaymentReminders from './PaymentReminders';

function BellIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

export default function PaymentsReminder({
    label = 'Payments reminder',
    className = 'flex min-h-24 w-full items-center gap-3 rounded-lg bg-amber-600 px-5 py-3 text-base font-semibold text-white shadow transition hover:bg-amber-700',
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={className}>
                <BellIcon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
            </button>

            {/* portalled to <body> so the sidebar's transform doesn't trap the fixed overlay */}
            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => setOpen(false)}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="payment-reminders-title"
                            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-gray-50 p-5 shadow-xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <h2
                                    id="payment-reminders-title"
                                    className="text-lg font-bold text-gray-900"
                                >
                                    Payment Reminders
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close payment reminders"
                                    className="rounded-md px-2 text-2xl leading-none text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            </div>
                            <PaymentReminders />
                        </section>
                    </div>,
                    document.body,
                )}
        </>
    );
}
