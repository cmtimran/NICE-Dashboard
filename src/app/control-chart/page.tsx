"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Download, FileText, Printer, Copy, FileSpreadsheet, File, ChevronLeft, ChevronRight } from 'lucide-react';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from '@/lib/ExportUtils';

interface ControlChartData {
    date: string;
    roomType: string;
    totalRooms: number;
    occupiedRes: number;
    occupiedReg: number;
    totalOccupied: number;
    outOfOrder: number;
    outOfService: number;
    vacant: number;
}

export default function ControlChartPage() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<ControlChartData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomTypes, setRoomTypes] = useState<string[]>([]);

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedType, setSelectedType] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Control Chart ${startDate} to ${endDate}`,
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        if (!data.length) return;

        const exportData = data.map(row => ({
            'Date': new Date(row.date).toLocaleDateString(),
            'Type': row.roomType,
            'Total Room': row.totalRooms,
            'Occ. Res': row.occupiedRes,
            'Occ. Reg': row.occupiedReg,
            'Total Occ': row.totalOccupied,
            'Out Of Order': row.outOfOrder,
            'Out Of Service': row.outOfService,
            'Vacant': row.vacant
        }));

        const filename = `Control_Chart_${startDate}_to_${endDate}`;

        switch (type) {
            case 'csv': exportToCSV(exportData, filename); break;
            case 'excel': exportToExcel(exportData, filename); break;
            case 'pdf':
                const headers = Object.keys(exportData[0]);
                exportToPDF(headers, exportData, `Control Chart (${startDate} to ${endDate})`, filename);
                break;
            case 'copy': copyToClipboard(exportData); break;
        }
    };

    useEffect(() => {
        // Fetch Room Types
        fetch('/api/room-types')
            .then(res => res.json())
            .then(data => {
                if (data.types) setRoomTypes(data.types);
            })
            .catch(err => console.error(err));
    }, []);

    const fetchData = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let typeParam = selectedType;
            if (selectedType === 'All') {
                // Construct the legacy "All" string format: 'Type1', 'Type2'
                // Note: The API expects the string to be injected into: IN ('${roomType}')
                // So if we send "A','B", it becomes IN ('A','B').
                // If we allow the API to wrap the single value, we need to be careful.
                // In my API implementation: ... in ('${roomType}')
                // So if I pass "A', 'B", it becomes ... in ('A', 'B') -> Correct.
                // Escape single quotes in room types just in case
                typeParam = roomTypes.map(t => t.replace(/'/g, "''")).join("', '");
            } else {
                typeParam = selectedType.replace(/'/g, "''");
            }

            const res = await fetch(`/api/control-chart?startDate=${startDate}&endDate=${endDate}&roomType=${encodeURIComponent(typeParam)}`);
            const result = await res.json();

            if (result.error) throw new Error(result.details);

            setData(result.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch? Maybe not, usually reports require explicit run. 
    // But purely for DX, maybe run it if types are loaded? 
    // Better wait for user to click Submit as per legacy.

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reservation Control Chart</h1>
                    <p className="text-gray-400 mt-1">Monitor room occupancy and status controls</p>
                </div>

                {/* Export Toolbar */}
                <div className="flex gap-2 print:hidden">
                    <button onClick={() => handleExport('copy')} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors" title="Copy">
                        <Copy size={16} />
                    </button>
                    <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm transition-colors" title="CSV">
                        <FileText size={16} />
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm transition-colors" title="Excel">
                        <FileSpreadsheet size={16} />
                    </button>
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm transition-colors" title="PDF">
                        <File size={16} />
                    </button>
                    <button onClick={() => handlePrint && handlePrint()} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                        <Printer size={16} /> Print
                    </button>
                </div>
            </header>

            {/* Filters */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
            >
                <form onSubmit={fetchData} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> From Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> To Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Filter size={16} /> Room Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="All" className="bg-slate-900">All Types</option>
                            {roomTypes.map(type => (
                                <option key={type} value={type} className="bg-slate-900">{type}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                        Show Report
                    </button>
                </form>
            </motion.div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Data Table */}
            <motion.div
                ref={componentRef}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden print:bg-white print:text-black"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider print:bg-gray-100 print:text-black">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Room Type</th>
                                <th className="p-4 font-medium text-center">Total Room</th>
                                <th className="p-4 font-medium">Total Occupied Room</th>
                                <th className="p-4 font-medium text-center">Out Of Order</th>
                                <th className="p-4 font-medium text-center">Out Of Service</th>
                                <th className="p-4 font-medium text-center">Vacant Room</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 print:divide-gray-200">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        {loading ? 'Processing...' : 'No data found. Please adjust filters.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                        <td className="p-4 whitespace-nowrap print:text-black">{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="p-4 print:text-black">{row.roomType}</td>
                                        <td className="p-4 text-center print:text-black">{row.totalRooms}</td>
                                        <td className="p-4 text-sm print:text-black">
                                            <span className="text-blue-400 print:text-black">Res. Guest= {row.occupiedRes}</span> +
                                            <span className="text-emerald-400 print:text-black"> Inhouse Guest= {row.occupiedReg}</span> =
                                            <span className="font-bold text-white print:text-black"> {row.totalOccupied}</span>
                                        </td>
                                        <td className="p-4 text-center text-red-400 print:text-black">{row.outOfOrder}</td>
                                        <td className="p-4 text-center text-orange-400 print:text-black">{row.outOfService}</td>
                                        <td className="p-4 text-center font-bold text-white print:text-black">{row.vacant}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <div className="text-gray-400 text-sm">
                        Showing {data.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length} entries
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={20} className="bg-slate-900">20 per page</option>
                            <option value={50} className="bg-slate-900">50 per page</option>
                            <option value={100} className="bg-slate-900">100 per page</option>
                            <option value={data.length} className="bg-slate-900">Show All</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm text-gray-300">
                                Page <span className="text-white font-medium">{currentPage}</span> of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

