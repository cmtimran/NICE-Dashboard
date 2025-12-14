"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoLogout() {
    const router = useRouter();
    const TIMEOUT_MS = 2000000; // 33 minutes (approx) - from legacy idleTimer logic

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(logout, TIMEOUT_MS);
        };

        const logout = () => {
            localStorage.removeItem('user'); // Or clear cookie
            router.push('/login');
        };

        // Events to track activity
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);
        window.addEventListener('keypress', resetTimer);

        // Initial timer start
        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            window.removeEventListener('keypress', resetTimer);
        };
    }, [router]);

    return null; // This component handles logic only, no UI
}
