'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const resetPhrase = 'RESET FINANCIAL DATA';

function formatAmount(amount) {
    return Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function AdminPanelPage() {
    const router = useRouter();
    const [activePopup, setActivePopup] = useState('');
    const [balanceInfo, setBalanceInfo] = useState(null);
    const [amount, setAmount] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const loadBalance = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/current-balance', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Unable to load current balance.');
            }
            setBalanceInfo(result);
            if (result.openingBalance) {
                setAmount(String(result.openingBalance.amount));
            }
        } catch (error) {
            setErrorMessage(error.message || 'Unable to load current balance.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activePopup === 'balance') loadBalance();
    }, [activePopup, loadBalance]);

    async function addBalance(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/current-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || result.errors?.amount || 'Unable to save balance.');
            }
            await loadBalance();
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save current balance.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resetFinancialData(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/transactions/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Unable to reset financial data.');
            }
            window.location.assign('/');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to reset financial data.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function logout() {
        try {
            const response = await fetch('/api/talk/logout', { method: 'POST' });
            if (!response.ok) throw new Error('Unable to sign out.');
            router.replace('/login');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to sign out.');
        }
    }

    function closePopup() {
        setActivePopup('');
        setAmount('');
        setConfirmation('');
        setErrorMessage('');
    }

    return (
        <main className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-5 px-4 py-3">
                    <span className="mr-auto text-sm font-bold uppercase tracking-wide text-gray-900">
                        Admin Panel
                    </span>
                    <button
                        type="button"
                        onClick={() => setActivePopup('balance')}
                        className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                    >
                        Current Balance
                    </button>
                    <button
                        type="button"
                        onClick={() => setActivePopup('settings')}
                        className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                    >
                        Settings
                    </button>
                    <Link href="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                        Home
                    </Link>
                    <button
                        type="button"
                        onClick={logout}
                        className="text-sm font-medium text-gray-600 hover:text-rose-600"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <section className="mx-auto max-w-5xl p-6">
                <div className="rounded-lg bg-white p-6 shadow">
                    <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your starting balance and financial transaction history.
                    </p>
                </div>
            </section>

            {activePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closePopup();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-popup-title"
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                    >
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <h2 id="admin-popup-title" className="text-xl font-bold text-gray-900">
                                {activePopup === 'balance' ? 'Current Balance' : 'Settings'}
                            </h2>
                            <button
                                type="button"
                                onClick={closePopup}
                                aria-label="Close popup"
                                className="rounded-md px-2 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            >
                                &times;
                            </button>
                        </div>

                        {activePopup === 'balance' &&
                            (isLoading ? (
                                <p role="status" className="text-sm text-gray-500">
                                    Loading current balance...
                                </p>
                            ) : (
                                <form onSubmit={addBalance} className="flex flex-col gap-4">
                                    {balanceInfo?.hasOpeningBalance && (
                                        <p className="text-sm text-gray-600">
                                            Current available balance:{' '}
                                            <strong className="text-gray-900">
                                                {formatAmount(balanceInfo.currentBalance)}
                                            </strong>
                                        </p>
                                    )}
                                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        {balanceInfo?.hasOpeningBalance
                                            ? 'Starting balance (already set)'
                                            : 'Add starting balance'}
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={amount}
                                            onChange={(event) => setAmount(event.target.value)}
                                            placeholder="Enter your current balance"
                                            required={!balanceInfo?.hasOpeningBalance}
                                            disabled={Boolean(balanceInfo?.hasOpeningBalance)}
                                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </label>
                                    {!balanceInfo?.hasOpeningBalance && (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Add Current Balance'}
                                        </button>
                                    )}
                                </form>
                            ))}

                        {activePopup === 'settings' && (
                            <form onSubmit={resetFinancialData} className="flex flex-col gap-4">
                                <p className="text-sm text-gray-600">
                                    Resetting deletes income, expense, and starting-balance records.
                                    Users, chats, connection requests, and payment reminders are kept.
                                    You will be asked for a starting balance again.
                                </p>
                                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                    Type <span className="font-mono">{resetPhrase}</span> to confirm
                                    <input
                                        type="text"
                                        value={confirmation}
                                        onChange={(event) => setConfirmation(event.target.value)}
                                        autoComplete="off"
                                        required
                                        className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || confirmation !== resetPhrase}
                                    className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Resetting...' : 'Reset financial data'}
                                </button>
                            </form>
                        )}

                        {errorMessage && (
                            <p role="alert" className="mt-4 text-sm text-red-600">
                                {errorMessage}
                            </p>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}
