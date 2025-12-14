"use client";
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, FileText, Printer, Copy, FileSpreadsheet, File } from 'lucide-react';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from '@/lib/ExportUtils';

// ... (previous imports)

export default function ForecastPage() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        return d.toISOString().split('T')[0];
    });

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Forecast Report ${startDate} to ${endDate}`,
    });

    const prepareExportData = () => {
        return data.map(row => ({
            Date: row.date,
            'Total Rooms': row.totalRooms,
            'Exp. Arrival': row.expectedArrival,
            'Dep. (Reg)': row.departureReg,
            'Dep. (Res)': row.departureRes,
            'Total Dep.': row.totalDeparture,
            'Occupied': row.occupiedRoomsDisplay,
            'Vacant': row.vacantRooms,
            'OCC (%)': `${row.occupancyPercent}%`
        }));
    };

    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        const exportData = prepareExportData();
        const filename = `Forecast_Report_${startDate}_${endDate}`;

        switch (type) {
            case 'csv': exportToCSV(exportData, filename); break;
            case 'excel': exportToExcel(exportData, filename); break;
            case 'pdf':
                const headers = Object.keys(exportData[0]);
                exportToPDF(headers, exportData, `Forecast Report (${startDate} to ${endDate})`, filename);
                break;
            case 'copy': copyToClipboard(exportData); break;
        }
    };

    // ... (fetchData and CustomTooltip logic) ...

    const fetchData = () => {
        setLoading(true);
        fetch(`/api/forecast?startDate=${startDate}&endDate=${endDate}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 p-4 border border-slate-700 rounded-lg shadow-xl">
                    <p className="text-gray-300 font-mono mb-2">{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} style={{ color: p.color }} className="text-sm font-semibold">
                            {p.name}: {p.value}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header ... */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Forecast Report</h1>
                    <p className="text-gray-400">Occupancy trends and future availability</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={16} className="text-blue-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-white text-sm outline-none w-28 md:w-auto"
                        />
                    </div>
                    <span className="text-gray-500">-</span>
                    <div className="flex items-center gap-2 px-2">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-white text-sm outline-none w-28 md:w-auto"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors w-full md:w-auto"
                    >
                        Update
                    </button>
                </div>
            </header>

            {/* Trend Chart (Visible only on screen) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px] print:hidden">
                <h3 className="text-lg font-semibold text-white mb-6">Occupancy Trend (%)</h3>
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">Loading Chart...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorOcp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="occupancyPercent" stroke="#8884d8" fillOpacity={1} fill="url(#colorOcp)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap justify-start md:justify-end gap-2">
                <button onClick={() => handleExport('copy')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                    <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors">
                    <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors">
                    <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">
                    <File size={16} /> PDF
                </button>
                <button onClick={() => handlePrint && handlePrint()} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                    <Printer size={16} /> Print
                </button>
            </div>

            {/* Data Table (Printable) */}
            <div ref={componentRef} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden print:bg-white print:text-black">
                <div className="p-4 hidden print:block text-2xl font-bold text-center border-b border-gray-200">
                    Forecast Report ({startDate} to {endDate})
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Total Rooms</th>
                                <th className="px-6 py-4 text-center">Exp. Arrival</th>
                                <th className="px-6 py-4 text-center">Dep. (Reg)</th>
                                <th className="px-6 py-4 text-center">Dep. (Res)</th>
                                <th className="px-6 py-4 text-center">Total Dep.</th>
                                <th className="px-6 py-4 text-center text-orange-400 print:text-black">Occupied</th>
                                <th className="px-6 py-4 text-center text-green-400 print:text-black">Vacant</th>
                                <th className="px-6 py-4 text-center text-blue-400 print:text-black">OCC (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Loading Report...</td>
                                </tr>
                            ) : data.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                    <td className="px-6 py-4 text-gray-300 font-mono print:text-black">{row.date}</td>
                                    <td className="px-6 py-4 text-center text-gray-400 print:text-black">{row.totalRooms}</td>
                                    <td className="px-6 py-4 text-center text-gray-300 print:text-black">{row.expectedArrival}</td>
                                    <td className="px-6 py-4 text-center text-gray-400 print:text-black">{row.departureReg}</td>
                                    <td className="px-6 py-4 text-center text-gray-400 print:text-black">{row.departureRes}</td>
                                    <td className="px-6 py-4 text-center text-white font-medium print:text-black">{row.totalDeparture}</td>
                                    <td className="px-6 py-4 text-center text-orange-300 font-medium print:text-black">{row.occupiedRoomsDisplay}</td>
                                    <td className="px-6 py-4 text-center text-green-300 font-medium print:text-black">{row.vacantRooms}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 print:bg-transparent print:border-none print:text-black">
                                            {row.occupancyPercent}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
