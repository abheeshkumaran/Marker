'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthBar from './AuthBar';

const publicPaths = new Set(['/login', '/register', '/quicktalk', '/quicktalk/register']);

export default function AuthGate({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let active = true;

        async function authorizePage() {
            if (publicPaths.has(pathname)) {
                if (active) setChecking(false);
                return;
            }

            try {
                const response = await fetch('/api/talk/me', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok || !result.user) {
                    router.replace('/login');
                    return;
                }

                if (result.user.role === 'superadmin' && pathname !== '/super-admin') {
                    router.replace('/super-admin');
                    return;
                }
                if (
                    result.user.role !== 'superadmin' &&
                    (pathname === '/super-admin' || pathname.startsWith('/admin-pablo'))
                ) {
                    router.replace('/');
                    return;
                }
                if (active) setChecking(false);
            } catch {
                router.replace('/login');
            }
        }

        authorizePage();
        return () => {
            active = false;
        };
    }, [pathname, router]);

    if (checking && !publicPaths.has(pathname)) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-100">
                <p role="status" className="text-sm text-gray-600">Checking account...</p>
            </main>
        );
    }

    return (
        <>
            {children}
            {!publicPaths.has(pathname) && pathname !== '/super-admin' && <AuthBar />}
        </>
    );
}
