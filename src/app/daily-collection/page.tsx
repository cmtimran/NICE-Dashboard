'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Search, FileText, Calendar, Copy, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DailyCollection() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any>({ details: [], totals: {} });
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
            const response = await fetch(`/api/daily-collection?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();
            if (result.details) {
                setData(result);
                // Prepare Chart Data
                const t = result.totals || {};
                const cData = [
                    { name: 'Cash', value: t.totalcash || 0 },
                    { name: 'Cheque', value: t.totalcheque || 0 },
                    { name: 'Card', value: t.totalCard || 0 },
                    { name: 'Credit', value: t.totalCom || 0 },
                    { name: 'M-Bank', value: t.totalbKash || 0 },
                ].filter(d => d.value > 0);
                setChartData(cData);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Daily_Collection_${startDate}`,
    });

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        const headers = ['Outlet', 'Date', 'Bill No', 'Room', 'Name', 'PayMode', 'Cheque', 'Cash', 'Card', 'Co. Credit', 'M-Banking'];
        const formatNum = (n: any) => typeof n === 'number' ? n.toFixed(2) : n;

        const rows = data.details.map((row: any) => [
            row.SL === 1 ? "FO" : row.SL === 2 ? "RSV." : row.SL === 3 ? "REST." : row.SL === 19 ? "C. COLL." : "OTHERS",
            new Date(row.date).toLocaleDateString(),
            row.billno,
            row.roomno,
            row.name,
            row.payment,
            formatNum(row.cheque),
            formatNum(row.cash),
            formatNum(row.Card),
            formatNum(row.Com),
            formatNum(row.bKash)
        ]);

        // Add total row
        const totals = data.totals || {};
        rows.push(['', '', '', '', '', 'Total:', formatNum(totals.totalcheque), formatNum(totals.totalcash), formatNum(totals.totalCard), formatNum(totals.totalCom), formatNum(totals.totalbKash)]);

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
            link.setAttribute('download', `daily_collection_${startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'excel') {
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Daily_Collection");
            XLSX.writeFile(wb, "daily_collection.xlsx");
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
                    if (data.row.index === rows.length - 1) data.cell.styles.fontStyle = 'bold';
                }
            });
            doc.text("Daily Collection Report", 14, 15);
            doc.save("daily_collection.pdf");
        }
    };

    const filteredData = (data.details || []).filter((item: any) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.billno?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, startDate, endDate]);

    const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Daily Collection</h1>
                    <p className="text-gray-400">Breakdown of daily collections.</p>
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
                            placeholder="Search Guest, Room, Bill..."
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
                    <h3 className="text-xl font-bold text-white mb-6">Payment Method Distribution</h3>
                    <div className="h-[300px] w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div ref={componentRef} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-gray-300 font-semibold border-b border-white/10 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="px-4 py-3">Outlet</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Bill No</th>
                                <th className="px-4 py-3">Room</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">PayMode</th>
                                <th className="px-4 py-3 text-right">Cheque</th>
                                <th className="px-4 py-3 text-right">Cash</th>
                                <th className="px-4 py-3 text-right">Card</th>
                                <th className="px-4 py-3 text-right">Co. Credit</th>
                                <th className="px-4 py-3 text-right">M-Banking</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={11} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                            ) : (
                                paginatedData.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                        <td className="px-4 py-2 text-gray-300 print:text-black">
                                            {row.SL === 1 ? "FO" : row.SL === 2 ? "RSV." : row.SL === 3 ? "REST." : row.SL === 19 ? "C. COLL." : "OTHERS"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-400 print:text-black">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-white print:text-black">{row.billno}</td>
                                        <td className="px-4 py-2 text-blue-300 font-mono print:text-black">{row.roomno}</td>
                                        <td className="px-4 py-2 text-gray-300 print:text-black">{row.name}</td>
                                        <td className="px-4 py-2 text-gray-400 print:text-black">{row.payment}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.cheque}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.cash}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.Card}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.Com}</td>
                                        <td className="px-4 py-2 text-right text-gray-300 print:text-black">{row.bKash}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="bg-white/10 font-bold border-t border-white/20 print:bg-gray-100 print:text-black text-white">
                                <td colSpan={6} className="px-4 py-3 text-right">Total:</td>
                                <td className="px-4 py-3 text-right">{data.totals?.totalcheque}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.totalcash}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.totalCard}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.totalCom}</td>
                                <td className="px-4 py-3 text-right">{data.totals?.totalbKash}</td>
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
