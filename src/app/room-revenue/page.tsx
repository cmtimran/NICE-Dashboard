'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Search, FileText, Calendar, Copy, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RoomRevenue() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any>({ details: [], totals: {}, adjustment: {}, grandTotal: {} });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/room-revenue?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();
            if (result.details) {
                setData(result);

                // Process data for Chart (Daily Revenue)
                const dailyRevenue: Record<string, number> = {};
                result.details.forEach((item: any) => {
                    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const total = (item.ammount || 0) + (item.service || 0) + (item.tax || 0);
                    dailyRevenue[date] = (dailyRevenue[date] || 0) + total;
                });
                setChartData(Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })));
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Room_Revenue_${startDate}`,
    });

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        const headers = ['Date', 'Room No', 'Guest', 'Service', 'Amount', 'S.Charge', 'VAT', 'Total'];
        const formatNum = (n: any) => typeof n === 'number' ? n.toFixed(2) : n;

        const rows = data.details.map((row: any) => [
            new Date(row.date).toLocaleDateString(),
            row.roomno,
            row.Name,
            row.sname,
            formatNum(row.ammount),
            formatNum(row.service),
            formatNum(row.tax),
            formatNum((row.ammount || 0) + (row.service || 0) + (row.tax || 0))
        ]);

        // Add summary rows
        const totals = data.totals || {};
        const adj = data.adjustment || {};
        const grand = data.grandTotal || {};

        rows.push(['', '', '', 'Total:', formatNum(totals.total_amount), formatNum(totals.total_service), formatNum(totals.total_tax), formatNum(totals.total)]);
        rows.push(['', '', '', 'Adjustment:', formatNum(adj.total_amount), formatNum(adj.total_service), formatNum(adj.total_tax), formatNum(adj.total)]);
        rows.push(['', '', '', 'Grand Total:', formatNum(grand.total_amount), formatNum(grand.total_service), formatNum(grand.total_tax), formatNum(grand.total)]);

        if (type === 'copy') {
            const text = [headers.join('\t'), ...rows.map((r: any[]) => r.join('\t'))].join('\n');
            navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        } else if (type === 'csv') {
            const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `room_revenue_${startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'excel') {
            // Reconstruct data for Excel to keep types properly if needed, but array of arrays is fine
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Room_Revenue");
            XLSX.writeFile(wb, "room_revenue.xlsx");
        } else if (type === 'pdf') {
            const doc = new jsPDF('l', 'mm', 'a4');
            // @ts-ignore
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                didParseCell: (data: any) => {
                    // Highlight summary rows
                    if (data.row.index >= rows.length - 3) {
                        data.cell.styles.fontStyle = 'bold';
                        if (data.row.index === rows.length - 2) data.cell.styles.textColor = [220, 53, 69]; // Red for Adjustment
                        if (data.row.index === rows.length - 1) data.cell.styles.fillColor = [200, 230, 255]; // Blue bg for Grand Total
                    }
                }
            });
            doc.text("Room Revenue Report", 14, 15);
            doc.save("room_revenue.pdf");
        }
    };

    const filteredData = (data.details || []).filter((item: any) =>
        item.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, startDate, endDate]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Room Revenue</h1>
                    <p className="text-gray-400">Revenue breakdown by room and service.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 w-full print:hidden">
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleExport('copy')} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors" title="Copy">
                            <Copy size={18} />
                        </button>
                        <button onClick={() => handleExport('csv')} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors" title="CSV">
                            <FileText size={18} />
                        </button>
                        <button onClick={() => handleExport('excel')} className="p-2 hover:bg-white/10 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors" title="Excel">
                            <FileSpreadsheet size={18} />
                        </button>
                        <button onClick={() => handleExport('pdf')} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors" title="PDF">
                            <Download size={18} />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button onClick={() => handlePrint && handlePrint()} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors" title="Print">
                            <Printer size={18} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-white/10 hidden sm:block" />

                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Guest, Room, Service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="w-px h-8 bg-white/10 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10">
                        <Calendar size={16} className="text-gray-400 ml-2" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-white text-sm outline-none w-[110px]" />
                        <span className="text-gray-500">-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-white text-sm outline-none w-[110px]" />
                        <button onClick={fetchData} className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            {chartData.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 print:hidden">
                    <h3 className="text-xl font-bold text-white mb-6">Daily Revenue Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} formatter={(value: number) => [`${value.toFixed(2)}`, 'Revenue']} />
                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div ref={componentRef} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-gray-300 font-semibold border-b border-white/10 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Room No</th>
                                <th className="px-4 py-3">Guest</th>
                                <th className="px-4 py-3">Service</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">S.Charge</th>
                                <th className="px-4 py-3 text-right">VAT</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                            ) : (
                                paginatedData.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                        <td className="px-4 py-2 text-gray-400 print:text-black">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 font-mono text-blue-300 print:text-black">{row.roomno}</td>
                                        <td className="px-4 py-2 text-white print:text-black">{row.Name}</td>
                                        <td className="px-4 py-2 text-gray-400 print:text-black">{row.sname}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.ammount}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.service}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.tax}</td>
                                        <td className="px-4 py-2 text-right font-bold text-green-400 print:text-black">{(row.ammount + row.service + row.tax).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                            {/* Totals Section */}
                            <tr className="bg-white/10 font-bold border-t border-white/20 print:bg-gray-100 print:text-black text-white">
                                <td colSpan={4} className="px-4 py-3 text-right">Total:</td>
                                <td className="px-4 py-3 text-right">{data.totals?.total_amount}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.total_service}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.total_tax}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.total}</td>
                            </tr>
                            <tr className="bg-white/5 font-bold text-red-400 border-t border-white/5 print:text-red-600">
                                <td colSpan={4} className="px-4 py-3 text-right">Adjustment:</td>
                                <td className="px-4 py-3 text-right">{data.adjustment?.total_amount}</td>
                                <td className="px-4 py-3 text-right">{data.adjustment?.total_service}</td>
                                <td className="px-4 py-3 text-right">{data.adjustment?.total_tax}</td>
                                <td className="px-4 py-3 text-right">{data.adjustment?.total}</td>
                            </tr>
                            <tr className="bg-blue-600/20 font-bold text-blue-400 text-base border-t border-blue-500/30 print:bg-blue-100 print:text-blue-800">
                                <td colSpan={4} className="px-4 py-3 text-right">Grand Total:</td>
                                <td className="px-4 py-3 text-right">{data.grandTotal?.total_amount}</td>
                                <td className="px-4 py-3 text-right">{data.grandTotal?.total_service}</td>
                                <td className="px-4 py-3 text-right">{data.grandTotal?.total_tax}</td>
                                <td className="px-4 py-3 text-right">{data.grandTotal?.total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="flex justify-between items-center print:hidden">
                <div className="text-sm text-gray-400">
                    Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} className="text-gray-300" />
                    </button>
                    <span className="flex items-center px-4 text-sm font-medium text-gray-300">
                        Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} className="text-gray-300" />
                    </button>
                </div>
            </div>
        </div >
    );
}
