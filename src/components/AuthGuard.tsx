"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Allow access to login page without check
        if (pathname === '/login') {
            setAuthorized(true);
            return;
        }

        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            setAuthorized(false);
        } else {
            setAuthorized(true);
        }
    }, [router, pathname]);

    // Prevent flashing of protected content
    if (!authorized && pathname !== '/login') {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
