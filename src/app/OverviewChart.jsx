'use client';

import { useState } from 'react';

const tickCount = 4;

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatTick(value) {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// Rounds the axis top up to 1, 2, 2.5 or 5 × a power of ten so the gridlines land on round numbers.
function niceMax(value) {
    if (value <= 0) return tickCount;
    const step = value / tickCount;
    const magnitude = 10 ** Math.floor(Math.log10(step));
    const nice = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= step);
    return nice * magnitude * tickCount;
}

// Largest names by total amount, e.g. the top income sources.
function topBy(items, field) {
    const totals = new Map();
    for (const item of items) totals.set(item[field], (totals.get(item[field]) || 0) + item.amount);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function buildBars(transactions, payments) {
    const incomes = transactions.filter((t) => t.type === 'income' && t.description !== 'Net Balance');
    const expenses = transactions.filter((t) => t.type === 'expense');
    const pending = payments.filter((p) => p.status === 'pending');
    const today = new Date().toISOString().slice(0, 10);
    const overdue = pending.filter((p) => new Date(p.date).toISOString().slice(0, 10) < today);
    const sum = (list, amount) => list.reduce((total, item) => total + amount(item), 0);

    return [
        {
            key: 'income',
            label: 'Income',
            color: '#36a87b',
            value: sum(incomes, (t) => t.amount),
            details: [
                `${incomes.length} ${incomes.length === 1 ? 'entry' : 'entries'}`,
                ...topBy(incomes, 'description').map(([name, total]) => `${name}: ${formatAmount(total)}`),
            ],
        },
        {
            key: 'due',
            label: 'Payments due',
            color: '#eba03e',
            value: sum(pending, (p) => (p.noOfPendings - p.paidCount) * p.duePayment),
            details: [
                `${pending.length} active ${pending.length === 1 ? 'reminder' : 'reminders'}`,
                `Next installments: ${formatAmount(sum(pending, (p) => p.duePayment))}`,
                `${overdue.length} overdue`,
            ],
        },
        {
            key: 'paid',
            label: 'Payments paid',
            color: '#6366f1',
            value: sum(payments, (p) => p.paidCount * p.duePayment),
            details: [
                `${sum(payments, (p) => p.paidCount)} installments paid`,
                `${payments.filter((p) => p.status === 'paid').length} reminders completed`,
            ],
        },
        {
            key: 'expense',
            label: 'Expenses',
            color: '#ef4444',
            value: sum(expenses, (t) => t.amount),
            details: [
                `${expenses.length} ${expenses.length === 1 ? 'entry' : 'entries'}`,
                ...topBy(expenses, 'description').map(([name, total]) => `${name}: ${formatAmount(total)}`),
            ],
        },
    ];
}

export default function OverviewChart({ transactions, payments, isLoading }) {
    const [activeKey, setActiveKey] = useState(null);
    const bars = buildBars(transactions, payments);
    const max = niceMax(Math.max(...bars.map((bar) => bar.value)));
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) => (max / tickCount) * (tickCount - index));

    return (
        <section className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-gray-900">Overview</h2>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    {bars.map((bar) => (
                        <li key={bar.key} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: bar.color }} />
                            {bar.label}
                        </li>
                    ))}
                </ul>
            </div>

            {isLoading ? (
                <p className="py-16 text-center text-sm text-gray-500">Loading chart…</p>
            ) : (
                <div className="flex gap-3">
                    <div className="flex h-64 flex-col justify-between pb-6 text-right text-xs text-gray-500">
                        {ticks.map((tick) => (
                            <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
                                {formatTick(tick)}
                            </span>
                        ))}
                    </div>

                    <div className="relative h-64 flex-1">
                        <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
                            {ticks.map((tick) => (
                                <div key={tick} className="border-t border-dashed border-gray-200" />
                            ))}
                        </div>

                        <div className="absolute inset-x-0 bottom-0 top-0 flex">
                            {bars.map((bar) => {
                                const active = activeKey === bar.key;
                                return (
                                    <div
                                        key={bar.key}
                                        className="relative flex flex-1 flex-col items-center"
                                        onMouseEnter={() => setActiveKey(bar.key)}
                                        onMouseLeave={() => setActiveKey(null)}
                                    >
                                        <div className="flex w-full flex-1 items-end justify-center pb-px">
                                            <button
                                                type="button"
                                                onFocus={() => setActiveKey(bar.key)}
                                                onBlur={() => setActiveKey(null)}
                                                aria-label={`${bar.label}: ${formatAmount(bar.value)}`}
                                                className="w-8 rounded-t-md transition-opacity sm:w-10"
                                                style={{
                                                    backgroundColor: bar.color,
                                                    height: `${(bar.value / max) * 100}%`,
                                                    opacity: activeKey && !active ? 0.5 : 1,
                                                }}
                                            />
                                        </div>
                                        <span className="mt-1.5 h-[18px] truncate text-xs text-gray-600">
                                            {bar.label}
                                        </span>

                                        {active && (
                                            <div
                                                role="tooltip"
                                                className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg"
                                            >
                                                <p className="mb-1 font-semibold" style={{ color: bar.color }}>
                                                    {bar.label}
                                                </p>
                                                <p className="mb-1 text-sm font-semibold">{formatAmount(bar.value)}</p>
                                                {bar.details.map((line) => (
                                                    <p key={line} className="capitalize text-gray-300">
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
