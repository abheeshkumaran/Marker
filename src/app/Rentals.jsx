'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const paymentTypes = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Other'];
const lastRentalKey = 'marker.rentals.selected';

function formatAmount(amount) {
    return Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

function dayString(date) {
    return new Date(date).toISOString().slice(0, 10);
}

function todayString() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

function rateFor(rates, day) {
    let current = null;
    for (const rate of rates) {
        if (dayString(rate.effectiveFrom) <= day) current = rate;
        else break;
    }
    return current;
}

function errorText(body, fallback) {
    return body?.errors ? Object.values(body.errors).join(' ') : body?.error || fallback;
}

async function send(url, method, payload) {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, body };
}

function readStored() {
    try {
        return window.localStorage.getItem(lastRentalKey) || '';
    } catch {
        return '';
    }
}

function writeStored(value) {
    try {
        window.localStorage.setItem(lastRentalKey, value);
    } catch {
        // storage unavailable; the selection just isn't remembered
    }
}

// Overlay + dialog. Escape closes only the topmost one because the event stops here.
function Modal({ title, onClose, children, wide, layer = 'z-50' }) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current?.focus();
    }, []);

    return (
        <div
            className={`fixed inset-0 ${layer} flex items-center justify-center bg-black/40 p-4`}
            onClick={onClose}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    onClose();
                }
            }}
        >
            <section
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
                className={`max-h-[92vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl outline-none ${wide ? 'max-w-6xl' : 'max-w-md'}`}
            >
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={`Close ${title}`}
                        className="rounded-md px-2 text-2xl leading-none text-gray-400 hover:text-gray-600"
                    >
                        &times;
                    </button>
                </div>
                {children}
            </section>
        </div>
    );
}

function Field({ label, error, hint, children }) {
    return (
        <label className="block text-sm font-medium text-gray-700">
            {label}
            {children}
            {hint && !error && <span className="mt-1 block text-xs font-normal text-gray-500">{hint}</span>}
            {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
        </label>
    );
}

const inputClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

function StructureForm({ rental, rates, onClose, onSaved }) {
    const current = rates.length ? rateFor(rates, todayString()) || rates[rates.length - 1] : null;
    const [form, setForm] = useState({
        captain: current?.captain || '',
        amount: current ? String(current.amount) : '',
        effectiveFrom: todayString(),
    });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        const { ok, body } = await send(`/api/rentals/${rental.id}/rates`, 'POST', form).catch(() => ({
            ok: false,
            body: {},
        }));
        setBusy(false);
        if (!ok) {
            setErrors(body.errors || { _form: errorText(body, 'Could not save the structure.') });
            return;
        }
        onSaved();
    }

    return (
        <Modal
            title={rates.length ? 'Change Payment Structure' : 'Create Payment Structure'}
            onClose={onClose}
            layer="z-[60]"
        >
            <form onSubmit={submit} className="space-y-3">
                {errors._form && (
                    <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                        {errors._form}
                    </p>
                )}
                <Field label="Captain" error={errors.captain}>
                    <input
                        type="text"
                        value={form.captain}
                        onChange={(e) => set('captain', e.target.value)}
                        required
                        maxLength={60}
                        autoFocus
                        className={inputClass}
                    />
                </Field>
                <Field label="Required payment per day" error={errors.amount}>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.amount}
                        onChange={(e) => set('amount', e.target.value)}
                        required
                        className={inputClass}
                    />
                </Field>
                <Field
                    label={rates.length ? 'Affect from' : 'Start from'}
                    error={errors.effectiveFrom}
                    hint={
                        rates.length
                            ? 'Days from this date that have no payment recorded will use the new value.'
                            : 'A pending row is created for every day from this date.'
                    }
                >
                    <input
                        type="date"
                        value={form.effectiveFrom}
                        onChange={(e) => set('effectiveFrom', e.target.value)}
                        required
                        className={inputClass}
                    />
                </Field>

                {rates.length > 0 && (
                    <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                        <p className="mb-1 font-semibold text-gray-700">History</p>
                        <ul className="space-y-0.5">
                            {[...rates].reverse().map((rate) => (
                                <li key={rate.id} className="flex justify-between gap-2">
                                    <span>From {formatDate(rate.effectiveFrom)} · {rate.captain}</span>
                                    <span className="font-medium">{formatAmount(rate.amount)}/day</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function PaymentForm({ rental, rates, entries, initial, onClose, onSaved }) {
    const [form, setForm] = useState(() => {
        const date = initial?.date || todayString();
        const entry = entries.find((e) => dayString(e.date) === date);
        const rate = rateFor(rates, date);
        const due = entry?.recorded ? entry.payment : rate?.amount ?? 0;
        return {
            date,
            captain: entry?.captain || rate?.captain || '',
            success: initial?.fullPayment ? String(Math.max(0, due - (entry?.advance || 0))) : entry?.recorded ? String(entry.success) : '',
            paymentType: entry?.paymentType || 'Cash',
            advance: entry?.advance ? String(entry.advance) : '',
            remark: entry?.remark || '',
        };
    });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const entry = entries.find((e) => dayString(e.date) === form.date);
    const rate = rateFor(rates, form.date);
    const due = entry?.recorded ? entry.payment : rate?.amount ?? null;
    const pending = due === null ? null : Math.max(0, due - (Number(form.success) || 0) - (Number(form.advance) || 0));

    function set(key, value) {
        setForm((f) => {
            const next = { ...f, [key]: value };
            // picking another date pulls in that day's captain
            if (key === 'date') {
                const other = entries.find((e) => dayString(e.date) === value);
                next.captain = other?.captain || rateFor(rates, value)?.captain || f.captain;
            }
            return next;
        });
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        const { ok, body } = await send(`/api/rentals/${rental.id}/entries`, 'POST', form).catch(() => ({
            ok: false,
            body: {},
        }));
        setBusy(false);
        if (!ok) {
            setErrors(body.errors || { _form: errorText(body, 'Could not save the payment.') });
            return;
        }
        onSaved();
    }

    return (
        <Modal title={`Add Payment · ${rental.name}`} onClose={onClose} layer="z-[60]">
            <form onSubmit={submit} className="space-y-3">
                {errors._form && (
                    <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                        {errors._form}
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date" error={errors.date}>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => set('date', e.target.value)}
                            required
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Captain" error={errors.captain}>
                        <input
                            type="text"
                            value={form.captain}
                            onChange={(e) => set('captain', e.target.value)}
                            required
                            maxLength={60}
                            className={inputClass}
                        />
                    </Field>
                </div>

                <div className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                    {due === null ? (
                        'No payment structure covers this date.'
                    ) : (
                        <>
                            Payment due for this day: <strong>{formatAmount(due)}</strong>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Success (received)" error={errors.success}>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={form.success}
                            onChange={(e) => set('success', e.target.value)}
                            placeholder="0"
                            autoFocus
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Payment type" error={errors.paymentType}>
                        <select
                            value={form.paymentType}
                            onChange={(e) => set('paymentType', e.target.value)}
                            className={inputClass}
                        >
                            {paymentTypes.map((type) => (
                                <option key={type}>{type}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Advance" error={errors.advance}>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={form.advance}
                            onChange={(e) => set('advance', e.target.value)}
                            placeholder="0"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Pending">
                        <input
                            type="text"
                            readOnly
                            value={pending === null ? '—' : formatAmount(pending)}
                            className={`${inputClass} bg-gray-50 ${pending ? 'text-amber-700' : 'text-emerald-700'}`}
                        />
                    </Field>
                </div>

                <Field label="Remark" error={errors.remark}>
                    <input
                        type="text"
                        value={form.remark}
                        onChange={(e) => set('remark', e.target.value)}
                        maxLength={200}
                        className={inputClass}
                    />
                </Field>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy || due === null}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Save Payment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function RentalsManager() {
    const [rentals, setRentals] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [detail, setDetail] = useState(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState('');

    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newError, setNewError] = useState('');
    const [savingNew, setSavingNew] = useState(false);

    const [paymentForm, setPaymentForm] = useState(null);
    const [showStructure, setShowStructure] = useState(false);
    const [month, setMonth] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        async function loadRentals() {
            try {
                const response = await fetch('/api/rentals', { cache: 'no-store' });
                const body = await response.json();
                if (!response.ok) throw new Error(body.error || 'Unable to load rentals.');
                setRentals(body.items);
                const stored = readStored();
                if (body.items.some((item) => item.id === stored)) setSelectedId(stored);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoadingList(false);
            }
        }
        loadRentals();
    }, []);

    const loadDetail = useCallback(async (id) => {
        if (!id) {
            setDetail(null);
            return;
        }
        setLoadingDetail(true);
        setError('');
        try {
            const response = await fetch(`/api/rentals/${id}?today=${todayString()}`, { cache: 'no-store' });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Unable to load rental.');
            setDetail(body);
        } catch (e) {
            setError(e.message);
            setDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    useEffect(() => {
        loadDetail(selectedId);
        setMonth('all');
        setStatusFilter('all');
    }, [selectedId, loadDetail]);

    function select(id) {
        setSelectedId(id);
        writeStored(id);
    }

    async function createRental() {
        setSavingNew(true);
        setNewError('');
        const { ok, body } = await send('/api/rentals', 'POST', { name: newName }).catch(() => ({
            ok: false,
            body: {},
        }));
        setSavingNew(false);
        if (!ok) {
            setNewError(errorText(body, 'Could not save the rental.'));
            return;
        }
        setRentals((list) => [...list, body.item].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName('');
        setShowNew(false);
        select(body.item.id);
    }

    async function deleteRental() {
        const rental = rentals.find((r) => r.id === selectedId);
        if (!rental) return;
        if (!window.confirm(`Delete "${rental.name}" and all of its payment rows? This cannot be undone.`)) return;
        const { ok, body } = await send(`/api/rentals/${rental.id}`, 'DELETE').catch(() => ({ ok: false, body: {} }));
        if (!ok) {
            setError(errorText(body, 'Could not delete the rental.'));
            return;
        }
        setRentals((list) => list.filter((r) => r.id !== rental.id));
        select('');
    }

    const entries = useMemo(() => detail?.entries ?? [], [detail]);
    const rates = detail?.rates ?? [];
    const months = useMemo(
        () => [...new Set(entries.map((entry) => dayString(entry.date).slice(0, 7)))],
        [entries],
    );
    const visible = entries.filter(
        (entry) =>
            (month === 'all' || dayString(entry.date).startsWith(month)) &&
            (statusFilter === 'all' || entry.status === statusFilter),
    );
    const totals = visible.reduce(
        (sum, entry) => ({
            payment: sum.payment + entry.payment,
            success: sum.success + entry.success,
            advance: sum.advance + entry.advance,
            pending: sum.pending + entry.pending,
            pendingDays: sum.pendingDays + (entry.status === 'pending' ? 1 : 0),
        }),
        { payment: 0, success: 0, advance: 0, pending: 0, pendingDays: 0 },
    );
    const currentRate = detail ? rateFor(rates, detail.today) : null;
    const upcomingRate = rates.find((rate) => detail && dayString(rate.effectiveFrom) > detail.today);
    const rental = rentals.find((r) => r.id === selectedId);

    function saved() {
        setPaymentForm(null);
        setShowStructure(false);
        loadDetail(selectedId);
    }

    return (
        <div>
            <div className="flex flex-wrap items-end gap-2">
                <label className="block min-w-[200px] flex-1 text-sm font-medium text-gray-700">
                    Rentals from
                    <select
                        value={selectedId}
                        onChange={(e) => select(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">{loadingList ? 'Loading…' : 'Choose a rental'}</option>
                        {rentals.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setShowNew((v) => !v);
                        setNewError('');
                    }}
                    aria-expanded={showNew}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    + New rental
                </button>
                {selectedId && (
                    <button
                        type="button"
                        onClick={deleteRental}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                        Delete
                    </button>
                )}
            </div>

            {showNew && (
                <div className="mt-3 flex flex-wrap items-start gap-2 rounded-md bg-gray-50 p-3">
                    <div className="min-w-[200px] flex-1">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newName.trim()) createRental();
                                }
                            }}
                            maxLength={60}
                            autoFocus
                            placeholder="e.g. Dzire KL-07-1234"
                            aria-label="New rental name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {newError && <p className="mt-1 text-xs text-red-600">{newError}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={createRental}
                        disabled={savingNew || !newName.trim()}
                        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {savingNew ? 'Saving…' : 'Save rental'}
                    </button>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                    {error}
                </p>
            )}

            {!selectedId && !loadingList && (
                <p className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    {rentals.length
                        ? 'Choose a rental to see its payments.'
                        : 'Add your first rental with “+ New rental”.'}
                </p>
            )}

            {selectedId && loadingDetail && !detail && (
                <p className="mt-6 text-center text-sm text-gray-500">Loading…</p>
            )}

            {selectedId && detail && rental && (
                <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-sm">
                            {currentRate ? (
                                <>
                                    <p className="font-semibold text-gray-900">
                                        {formatAmount(currentRate.amount)} per day · Captain {currentRate.captain}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Since {formatDate(currentRate.effectiveFrom)}
                                        {upcomingRate &&
                                            ` · changes to ${formatAmount(upcomingRate.amount)} from ${formatDate(upcomingRate.effectiveFrom)}`}
                                    </p>
                                </>
                            ) : rates.length ? (
                                <p className="text-gray-700">
                                    Starts {formatDate(rates[0].effectiveFrom)} at {formatAmount(rates[0].amount)} per day.
                                </p>
                            ) : (
                                <p className="text-gray-700">
                                    No payment structure yet. Create one to start daily rows.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentForm({})}
                                disabled={!rates.length}
                                title={rates.length ? undefined : 'Create a payment structure first'}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                + Add Payment
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowStructure(true)}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                            >
                                {rates.length ? 'Change Payment Structure' : 'Create Payment Structure'}
                            </button>
                        </div>
                    </div>

                    {entries.length > 0 && (
                        <>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                                {[
                                    ['Payment due', totals.payment, 'text-gray-900'],
                                    ['Success', totals.success, 'text-emerald-700'],
                                    ['Advance', totals.advance, 'text-indigo-700'],
                                    ['Pending', totals.pending, 'text-amber-700'],
                                ].map(([label, value, color]) => (
                                    <div key={label} className="rounded-lg border border-gray-200 p-3">
                                        <p className="text-xs text-gray-500">{label}</p>
                                        <p className={`text-lg font-bold ${color}`}>{formatAmount(value)}</p>
                                    </div>
                                ))}
                                <div className="rounded-lg border border-gray-200 p-3">
                                    <p className="text-xs text-gray-500">Pending days</p>
                                    <p className="text-lg font-bold text-amber-700">{totals.pendingDays}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    aria-label="Month"
                                    className="rounded-md border-gray-300 py-1.5 text-sm"
                                >
                                    <option value="all">All months</option>
                                    {months.map((m) => (
                                        <option key={m} value={m}>
                                            {new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, {
                                                month: 'long',
                                                year: 'numeric',
                                                timeZone: 'UTC',
                                            })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    aria-label="Status"
                                    className="rounded-md border-gray-300 py-1.5 text-sm"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    {['Date', 'Captain', 'Payment', 'Success', 'Payment type', 'Advance', 'Pending', 'Remark', 'Action'].map(
                                        (heading) => (
                                            <th
                                                key={heading}
                                                className={`px-3 py-2.5 font-medium ${['Payment', 'Success', 'Advance', 'Pending'].includes(heading) ? 'text-right' : ''}`}
                                            >
                                                {heading}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                                            {rates.length
                                                ? 'No rows for this filter.'
                                                : 'Rows appear here once a payment structure is created.'}
                                        </td>
                                    </tr>
                                ) : (
                                    visible.map((entry) => {
                                        const day = dayString(entry.date);
                                        const isPending = entry.status === 'pending';
                                        return (
                                            <tr
                                                key={entry.id}
                                                className={`border-t border-gray-100 ${isPending ? 'bg-amber-50/40' : ''}`}
                                            >
                                                <td className="px-3 py-2 text-gray-900">{formatDate(entry.date)}</td>
                                                <td className="px-3 py-2 text-gray-900">{entry.captain}</td>
                                                <td className="px-3 py-2 text-right text-gray-900">{formatAmount(entry.payment)}</td>
                                                <td className="px-3 py-2 text-right text-emerald-700">
                                                    {entry.success ? formatAmount(entry.success) : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">{entry.paymentType || '—'}</td>
                                                <td className="px-3 py-2 text-right text-indigo-700">
                                                    {entry.advance ? formatAmount(entry.advance) : '—'}
                                                </td>
                                                <td
                                                    className={`px-3 py-2 text-right font-semibold ${entry.pending ? 'text-amber-700' : 'text-gray-400'}`}
                                                >
                                                    {formatAmount(entry.pending)}
                                                </td>
                                                <td className="max-w-[180px] truncate px-3 py-2 text-gray-600" title={entry.remark}>
                                                    {entry.remark || '—'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {isPending ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentForm({ date: day, fullPayment: true })}
                                                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            Paid
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                                                Paid
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ date: day })}
                                                                className="text-xs font-medium text-indigo-600 hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {paymentForm && detail && rental && (
                <PaymentForm
                    rental={rental}
                    rates={rates}
                    entries={entries}
                    initial={paymentForm}
                    onClose={() => setPaymentForm(null)}
                    onSaved={saved}
                />
            )}
            {showStructure && detail && rental && (
                <StructureForm
                    rental={rental}
                    rates={rates}
                    onClose={() => setShowStructure(false)}
                    onSaved={saved}
                />
            )}
        </div>
    );
}

function CarIcon(props) {
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
            <path d="M5 17h14v-5l-2-5H7l-2 5z" />
            <path d="M5 12h14" />
            <circle cx="8" cy="17" r="2" />
            <circle cx="16" cy="17" r="2" />
        </svg>
    );
}

export default function Rentals({ label = 'Rentals', className }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={className}>
                <CarIcon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
            </button>
            {/* portalled to <body> so the sidebar's transform doesn't trap the fixed overlay */}
            {open &&
                createPortal(
                    <Modal title="Rentals" onClose={() => setOpen(false)} wide>
                        <RentalsManager />
                    </Modal>,
                    document.body,
                )}
        </>
    );
}
