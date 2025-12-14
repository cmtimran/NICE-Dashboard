"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    const isLoginPage = pathname === '/login';

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen relative overflow-hidden bg-[#0f172a]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-4 z-[70] p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg border border-white/10"
            >
                {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Backdrop */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[40] backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-[50] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <Sidebar isOpen={isSidebarOpen} />
            </div>

            {/* Main Content */}
            <main
                className={`flex-1 h-full overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out w-full ${!isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'
                    }`}
            >
                <div className="mt-12 md:mt-8"> {/* Top margin to clear the button */}
                    {children}
                </div>
            </main>
        </div>
    );
}
