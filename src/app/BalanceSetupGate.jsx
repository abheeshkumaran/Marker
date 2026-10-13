'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BalanceSetupGate({ children }) {
    const pathname = usePathname();
    const isAdminPanel = pathname?.startsWith('/admin-panel');
    const isPublicPage = ['/login', '/register', '/quicktalk', '/quicktalk/register'].includes(
        pathname,
    );
    const contentRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [balance, setBalance] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    async function checkTransactions() {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/current-balance', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Unable to check your transaction history.');
            }
            setIsReady(result.hasOpeningBalance);
        } catch (error) {
            setErrorMessage(error.message || 'Unable to check your transaction history.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!isPublicPage && !isAdminPanel && pathname !== '/super-admin') checkTransactions();
    }, [isAdminPanel, isPublicPage, pathname]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.inert = !isReady && !isDismissed && !isAdminPanel;
        }
    }, [isReady, isDismissed, isAdminPanel]);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/current-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: balance }),
            });
            const result = await response.json();
            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save your starting balance.');
            }
            setIsReady(true);
            setIsDismissed(false);
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save your starting balance.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isReady || isDismissed || isAdminPanel || isPublicPage || pathname === '/super-admin') {
        return children;
    }

    return (
        <>
            <div ref={contentRef} className="pointer-events-none" aria-hidden="true">
                {children}
            </div>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="balance-setup-title"
                    className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                >
                    <>
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <h1
                                id="balance-setup-title"
                                className="text-xl font-bold text-gray-900"
                            >
                                Set your current balance
                            </h1>
                            <button
                                type="button"
                                onClick={() => setIsDismissed(true)}
                                aria-label="Close current balance popup"
                                className="rounded-md px-2 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            >
                                &times;
                            </button>
                        </div>
                        {isLoading ? (
                            <p role="status" className="text-sm text-gray-600">
                                Checking your transaction history...
                            </p>
                        ) : errorMessage ? (
                            <div>
                                <p role="alert" className="text-sm text-red-600">
                                    {errorMessage}
                                </p>
                                <button
                                    type="button"
                                    onClick={checkTransactions}
                                    className="mt-3 text-sm font-semibold text-indigo-600 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="mb-5 text-sm text-gray-600">
                                Before you start, enter the money currently in your account. We’ll
                                save it as your opening balance so future expenses reduce your
                                balance in the statement.
                                </p>
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Current balance
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={balance}
                                            onChange={(event) => setBalance(event.target.value)}
                                            placeholder="Enter your current balance"
                                            required
                                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                                        />
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save starting balance'}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                </section>
            </div>
        </>
    );
}
