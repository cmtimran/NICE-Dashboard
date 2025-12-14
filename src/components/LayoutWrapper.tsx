"use client";
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();

    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen relative overflow-hidden">
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`fixed top-4 z-[60] p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all duration-300 shadow-lg border border-white/10 ${isSidebarOpen ? 'left-[15rem]' : 'left-4'}`}
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} />

            {/* Main Content */}
            <main
                className={`flex-1 h-full overflow-y-auto p-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
            >
                <div className="mt-8"> {/* Top margin to clear the button if sidebar is closed */}
                    {children}
                </div>
            </main>
        </div>
    );
}
