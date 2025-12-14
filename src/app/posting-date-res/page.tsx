'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Search, FileText, Copy, Calendar, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';

interface Reservation {
    entry: string;
    reservation_no: string;
    GuestTitle: string;
    First_name: string;
    Last_name: string;
    Compay_Name: string;
    RoomType: string;
    fldStatus: string;
    Arrival_Date: string;
    Departure_Date: string;
    roomno: string;
    pax: number;
    rate: number;
    flt: string;
    fltTime: string;
    phone: string;
    email: string;
    user_id: string;
    remark: string;
    Inclusions: string;
    ar: number;
    fldcondition: string;
}

export default function PostingDateWiseReservation() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/posting-date-res?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();
            if (Array.isArray(result)) {
                setData(result);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Posting_Date_Res_${startDate}`,
    });

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        const headers = ['Entry Date', 'Booking No', 'Guest Name', 'Company', 'Room Type', 'Room No', 'Rate', 'PAX', 'Arrival', 'Departure', 'Mobile', 'Email', 'Status', 'Message', 'Remarks', 'User'];
        const rows = data.map(item => [
            new Date(item.entry).toLocaleDateString(),
            item.reservation_no,
            `${item.First_name} ${item.Last_name}`,
            item.Compay_Name,
            item.RoomType,
            item.roomno,
            item.rate,
            item.pax,
            new Date(item.Arrival_Date).toLocaleDateString(),
            new Date(item.Departure_Date).toLocaleDateString(),
            item.phone,
            item.email,
            item.fldStatus,
            item.Inclusions,
            item.remark,
            item.user_id
        ]);

        if (type === 'copy') {
            const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
            navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        } else if (type === 'csv') {
            const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `posting_date_res_${startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Posting Date Res");
            XLSX.writeFile(wb, "posting_date_reservation.xlsx");
        } else if (type === 'pdf') {
            const doc = new jsPDF('l', 'mm', 'a4');
            const tableColumn = ['Date', 'B.No', 'Guest', 'Company', 'Room', 'Rate', 'Arr', 'Dep', 'Status', 'User'];
            const tableRows = data.map(item => [
                new Date(item.entry).toLocaleDateString(),
                item.reservation_no,
                `${item.First_name} ${item.Last_name}`.substring(0, 15),
                item.Compay_Name?.substring(0, 10),
                item.roomno,
                item.rate,
                new Date(item.Arrival_Date).toLocaleDateString(),
                new Date(item.Departure_Date).toLocaleDateString(),
                item.fldStatus,
                item.user_id
            ]);

            // @ts-ignore
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] }
            });
            doc.text("Posting Date Wise Reservation", 14, 15);
            doc.save("posting_date_reservation.pdf");
        }
    };

    const filteredData = data.filter(item =>
        item.reservation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.First_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, startDate, endDate]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Posting Date Wise Reservation</h1>
                <p className="text-gray-400">Review reservations posted within a date range.</p>
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
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                <div className="w-px h-8 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10">
                    <Calendar size={16} className="text-gray-400 ml-2" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-white text-sm outline-none w-[110px]" />
                    <span className="text-gray-500">-</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-white text-sm outline-none w-[110px]" />
                    <button onClick={fetchData} className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Filter
                    </button>
                </div>
            </div>

            <div ref={componentRef} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-gray-300 font-semibold border-b border-white/10 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="px-6 py-4">Entry Date</th>
                                <th className="px-6 py-4">Booking No</th>
                                <th className="px-6 py-4">Guest Name</th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Room Type</th>
                                <th className="px-6 py-4">Room No</th>
                                <th className="px-6 py-4">Rate</th>
                                <th className="px-6 py-4">PAX</th>
                                <th className="px-6 py-4">Arrival</th>
                                <th className="px-6 py-4">Departure</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={13} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-6 py-8 text-center text-gray-500">No records found.</td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                        <td className="px-6 py-4 text-gray-400 print:text-black">{new Date(item.entry).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-white print:text-black">{item.reservation_no}</td>
                                        <td className="px-6 py-4 text-gray-300 print:text-black">{`${item.First_name} ${item.Last_name}`}</td>
                                        <td className="px-6 py-4 text-gray-400 print:text-black">{item.Compay_Name}</td>
                                        <td className="px-6 py-4 text-gray-400 print:text-black">{item.RoomType}</td>
                                        <td className="px-6 py-4 text-blue-400 print:text-black">{item.roomno}</td>
                                        <td className="px-6 py-4 text-gray-300 print:text-black">{item.rate}</td>
                                        <td className="px-6 py-4 text-gray-400 print:text-black">{item.pax}</td>
                                        <td className="px-6 py-4 text-green-400 print:text-black">{new Date(item.Arrival_Date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-red-400 print:text-black">{new Date(item.Departure_Date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-400 print:text-black">{item.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.fldStatus === 'Confirm' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'} print:text-black print:border-none print:bg-transparent`}>
                                                {item.fldStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 print:text-black">{item.user_id}</td>
                                    </tr>
                                ))
                            )}
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
        </div>
    );
}
