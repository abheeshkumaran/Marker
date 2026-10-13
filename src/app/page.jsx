import Link from 'next/link';
import PaymentsReminder from './PaymentsReminder';

function IncomeIcon(props) {
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
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </svg>
    );
}

function ExpenseIcon(props) {
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
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

function PaymentChartIcon(props) {
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
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-5 5" />
        </svg>
    );
}

function QuickTalkIcon(props) {
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M13 7 8 12l5 5" />
        </svg>
    );
}

function AdminIcon(props) {
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
            <circle cx="12" cy="12" r="3" />
            <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2A1.7 1.7 0 0 0 7.8 17l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2A1.7 1.7 0 0 0 5.4 5.8l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2A1.7 1.7 0 0 0 17 3.4l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
        </svg>
    );
}

const buttons = [
    {
        label: 'Income',
        Icon: IncomeIcon,
        href: '/inome',
        className: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
        label: 'Expense',
        Icon: ExpenseIcon,
        href: '/expense',
        className: 'bg-rose-600 hover:bg-rose-700',
    },
    {
        label: 'Payment Chart',
        Icon: PaymentChartIcon,
        href: '/payment-chart',
        className: 'bg-black hover:bg-gray-900',
    },
    {
        label: 'QuickTalk',
        Icon: QuickTalkIcon,
        href: '/quicktalk',
        className: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
        label: 'Admin Panel',
        Icon: AdminIcon,
        href: '/admin-panel',
        className: 'bg-slate-700 hover:bg-slate-800',
    },
];

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900">mark Your Destiny</h1>

            <section
                aria-label="Main actions"
                className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {buttons.map(({ label, Icon, className, href }) => {
                    const cls = `flex min-h-24 w-full items-center gap-3 rounded-lg px-5 py-3 text-base font-semibold text-white shadow transition ${className}`;

                    return href ? (
                        <Link key={label} href={href} className={cls}>
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{label}</span>
                        </Link>
                    ) : (
                        <button key={label} type="button" className={cls}>
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{label}</span>
                        </button>
                    );
                })}

                <PaymentsReminder />
            </section>
        </main>
    );
}
