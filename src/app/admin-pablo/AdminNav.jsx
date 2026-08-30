'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { href: '/admin-pablo', label: 'Dashboard', exact: true },
    { href: '/admin-pablo/users', label: 'Users' },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
                <span className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    Admin Pablo
                </span>
                <div className="flex gap-4">
                    {links.map(({ href, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={
                                    'text-sm font-medium ' +
                                    (active
                                        ? 'text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-800')
                                }
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
