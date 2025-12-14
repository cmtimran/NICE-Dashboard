"use client";
import { useEffect, useState, useRef } from 'react';
import { Calendar, Search, FileText, Printer, Copy, FileSpreadsheet, File, ChevronLeft, ChevronRight } from 'lucide-react';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from '@/lib/ExportUtils';

export default function CheckinListPage() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Checkin List ${startDate}`,
    });

    const filteredData = data.filter(item =>
        item.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomNo?.toString().includes(searchTerm) ||
        item.regNo?.toString().includes(searchTerm)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, data]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        if (!filteredData.length) return;

        const exportData = filteredData.map((row, i) => ({
            'S/L': i + 1,
            'Room': row.roomNo,
            'Reg No': row.regNo,
            'Guest Name': row.guestName,
            'Company': row.companyName,
            'Rate': Number(row.rate),
            'Check In': row.checkInDate,
            'Check Out': row.checkOutDate,
            'Status': row.status || 'Checked In'
        }));

        const filename = `Checkin_List_${startDate}`;

        switch (type) {
            case 'csv': exportToCSV(exportData, filename); break;
            case 'excel': exportToExcel(exportData, filename); break;
            case 'pdf':
                const headers = Object.keys(exportData[0]);
                exportToPDF(headers, exportData, `Check In List (${startDate})`, filename);
                break;
            case 'copy': copyToClipboard(exportData); break;
        }
    };

    const fetchData = () => {
        setLoading(true);
        fetch(`/api/checkin-list?startDate=${startDate}&endDate=${endDate}`)
            .then(res => res.json())
            .then(d => {
                if (!d.error) {
                    setData(d);
                }
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []); // Initial load

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Check-In List</h1>
                    <p className="text-gray-400">Guests arriving between selected dates</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto">
                        {/* Export Buttons */}
                        <div className="flex flex-wrap gap-2 print:hidden bg-white/5 p-1.5 rounded-xl border border-white/10">
                            <button onClick={() => handleExport('copy')} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors" title="Copy">
                                <Copy size={18} />
                            </button>
                            <button onClick={() => handleExport('csv')} className="p-2 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors" title="CSV">
                                <FileText size={18} />
                            </button>
                            <button onClick={() => handleExport('excel')} className="p-2 hover:bg-white/10 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors" title="Excel">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button onClick={() => handleExport('pdf')} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors" title="PDF">
                                <File size={18} />
                            </button>
                            <div className="w-px bg-white/10 mx-1" />
                            <button onClick={() => handlePrint && handlePrint()} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                <Printer size={16} /> <span className="hidden sm:inline">Print</span>
                            </button>
                        </div>

                        {/* Date Filters */}
                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 px-3">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-white text-sm outline-none w-auto max-w-[110px] sm:max-w-none"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-white text-sm outline-none w-auto max-w-[110px] sm:max-w-none"
                            />
                            <button
                                onClick={fetchData}
                                className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                                Filter
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-64 print:hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search list..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div ref={componentRef} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-gray-300 font-semibold border-b border-white/10 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="px-6 py-4">S/L</th>
                                <th className="px-6 py-4">Room</th>
                                <th className="px-6 py-4">Reg No</th>
                                <th className="px-6 py-4">Guest Name</th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Rate</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading Data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No check-ins found for this period</td>
                                </tr>
                            ) : paginatedData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group print:hover:bg-transparent">
                                    <td className="px-6 py-4 text-gray-500 print:text-black">{startIndex + i + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md font-mono font-bold print:bg-transparent print:text-black print:p-0">
                                            {row.roomNo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono print:text-black">{row.regNo}</td>
                                    <td className="px-6 py-4 text-white font-medium print:text-black">{row.guestName}</td>
                                    <td className="px-6 py-4 text-gray-400 print:text-black">{row.companyName}</td>
                                    <td className="px-6 py-4 text-gray-300 font-mono print:text-black">{Number(row.rate).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-green-400 print:text-black">{row.checkInDate}</td>
                                    <td className="px-6 py-4 text-gray-400 print:text-black">{row.checkOutDate}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 print:bg-transparent print:border-none print:text-black print:p-0">
                                            {row.status || 'Checked In'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <div className="text-gray-400 text-sm">
                        Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
                            <option value={filteredData.length} className="bg-slate-900">Show All</option>
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
            </div>
        </div>
    );
}
