"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    {
        title: 'Dashboard',
        icon: '📊', // You can replace with Lucide icons later
        path: '/',
        submenu: [
            { title: 'Dashboard', path: '/' },
            { title: 'Forecast Report', path: '/forecast' },
            { title: 'Res. Control Chart', path: '/control-chart' },
            // Add others
        ]
    },
    {
        title: 'Front Office',
        icon: '🏨',
        path: '#',
        submenu: [
            { title: 'Posting Date Wise Res.', path: '/posting-date-res' },
            { title: 'Reservation Cancel', path: '/reservation-cancel' },
            { title: 'Expected Arrival', path: '/expected-arrival' },
            { title: 'Reser. Exp. Departure', path: '/reservation-exp-departure' },
            { title: 'Inhouse Exp. Departure', path: '/inhouse-exp-departure' },
            { title: 'Checkin List', path: '/checkin-list' },
            { title: 'Checkout List', path: '/checkout-list' },
            { title: 'Daily Guest List', path: '/daily-guest-list' },
            { title: 'Pre. Daily Guest List', path: '/pre-daily-guest-list' },
            { title: 'Police Report', path: '/police-report' },
            { title: 'Local Police Report', path: '/local-police-report' },
        ]
    },
    {
        title: 'Accounts & Revenue',
        icon: '💰',
        path: '#',
        submenu: [
            { title: 'Guest Ledger', path: '/guest-ledger' },
            { title: 'Pre. Guest Ledger', path: '/pre-guest-ledger' },
            { title: 'Room Revenue', path: '/room-revenue' },
            { title: 'Daily Collection', path: '/daily-collection' },
            { title: 'Daily Collection All', path: '/daily-collection-all' },
            { title: 'Revenue Statement', path: '/revenue-statement' },
        ]
    },
];

interface SidebarProps {
    isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    const toggleMenu = (title: string) => {
        setExpanded(expanded === title ? null : title);
    };

    return (
        <div className={`h-screen w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 text-white flex flex-col fixed left-0 top-0 z-50 shadow-xl overflow-y-auto transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 text-2xl font-bold tracking-wider border-b border-white/10 flex items-center gap-2">
                <span className="text-blue-400">Khairul</span>Int
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <div key={item.title}>
                        <button
                            onClick={() => toggleMenu(item.title)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-white/10 ${expanded === item.title ? 'bg-white/5' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span className="font-medium">{item.title}</span>
                            </div>
                            <span className={`transform transition-transform ${expanded === item.title ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        <AnimatePresence>
                            {expanded === item.title && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden pl-4"
                                >
                                    <ul className="pl-4 border-l border-white/10 mt-2 space-y-1">
                                        {item.submenu.map((sub) => (
                                            <li key={sub.path}>
                                                <Link
                                                    href={sub.path}
                                                    className={`block py-2 px-3 text-sm rounded-lg hover:bg-white/10 transition-colors ${pathname === sub.path ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300'}`}
                                                >
                                                    {sub.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                <div className="mt-8 pt-8 border-t border-white/10">
                    <button
                        onClick={() => {
                            localStorage.removeItem('user');
                            router.push('/login');
                        }}
                        className="w-full flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
