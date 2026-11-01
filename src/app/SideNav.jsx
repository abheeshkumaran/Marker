'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Rentals from './Rentals';

function Icon({ children, ...props }) {
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
            {children}
        </svg>
    );
}

const links = [
    {
        href: '/',
        label: 'Dashboard',
        icon: (
            <>
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </>
        ),
    },
    {
        href: '/inome',
        label: 'Income',
        icon: (
            <>
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
            </>
        ),
    },
    {
        href: '/expense',
        label: 'Expenses',
        icon: (
            <>
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
            </>
        ),
    },
    {
        href: '/payment-chart',
        label: 'Transactions',
        icon: (
            <>
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-5 5" />
            </>
        ),
    },
    {
        href: '/income-expenditure',
        label: 'Income & Expenditure',
        icon: (
            <>
                <path d="M7 4v16M17 4v16" />
                <rect x="5" y="8" width="4" height="7" rx="0.5" />
                <rect x="15" y="6" width="4" height="9" rx="0.5" />
            </>
        ),
    },
];

const reminderLink = {
    href: '/payments',
    label: 'Payment Reminder',
    icon: (
        <>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
    ),
};

const sourceLink = {
    href: '/sources',
    label: 'Source',
    icon: (
        <>
            <path d="M3 7h18M3 12h18M3 17h12" />
        </>
    ),
};

const extraLinks = [
    {
        href: '/quicktalk',
        label: 'QuickTalk',
        icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    },
    {
        href: '/admin-panel',
        label: 'Admin Panel',
        icon: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
            </>
        ),
    },
];

const itemClass = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition';
const activeClass = 'bg-indigo-600 text-white shadow';
const idleClass = 'text-gray-300 hover:bg-gray-800 hover:text-white';

export default function SideNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    function renderLink({ href, label, icon }) {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
            <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`${itemClass} ${active ? activeClass : idleClass}`}
            >
                <Icon className="h-5 w-5 shrink-0">{icon}</Icon>
                <span>{label}</span>
            </Link>
        );
    }

    async function logout() {
        try {
            const response = await fetch('/api/talk/logout', { method: 'POST' });
            if (response.ok) router.replace('/login');
        } catch {
            return;
        }
    }

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center gap-3 bg-gray-900 px-4 py-3 md:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation"
                    className="rounded-md p-1 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                    <Icon className="h-6 w-6">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </Icon>
                </button>
                <span className="text-lg font-bold text-white">marker</span>
            </header>

            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={
                    'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-gray-900 p-4 transition-transform md:translate-x-0 ' +
                    (mobileOpen ? 'translate-x-0' : '-translate-x-full')
                }
            >
                <div className="mb-6 flex items-center justify-between px-3">
                    <span className="text-xl font-bold text-white">marker</span>
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close navigation"
                        className="rounded-md px-2 text-2xl leading-none text-gray-400 hover:text-white md:hidden"
                    >
                        &times;
                    </button>
                </div>

                <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
                    {links.map(renderLink)}
                    {renderLink(reminderLink)}
                    {renderLink(sourceLink)}
                    <Rentals className={`${itemClass} ${idleClass}`} />
                    <div className="my-3 border-t border-gray-800" />
                    {extraLinks.map(renderLink)}
                </nav>

                <button
                    type="button"
                    onClick={logout}
                    className={`${itemClass} ${idleClass}`}
                >
                    <Icon className="h-5 w-5 shrink-0">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="m16 17 5-5-5-5" />
                        <path d="M21 12H9" />
                    </Icon>
                    <span>Sign out</span>
                </button>
            </aside>
        </>
    );
}
