"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Printer, FileText, Copy, FileSpreadsheet, File, Download, Mail, Send } from 'lucide-react';
// @ts-ignore
import { useReactToPrint } from 'react-to-print';
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from '@/lib/ExportUtils';

export default function RevenueStatementPage() {
    const componentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Mail State
    const [showMailModal, setShowMailModal] = useState(false);
    const [email, setEmail] = useState('');
    const [sendingMail, setSendingMail] = useState(false);
    const [mailStatus, setMailStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Revenue Statement ${date}`,
    });

    // ... (existing helper functions) ...

    const prepareExportData = () => {
        if (!data) return [];
        // Helper to get row data
        const getRow = (description: string, today: number, mtd: number) => ({
            'Description': description,
            'Today': today,
            'Month To Date': mtd
        });

        // Construct the flat list matches the table visual order
        // Note: This matches the render logic in the table
        const rows = [
            getRow('--- Room Revenue ---', 0, 0),
            getRow('Room Charge', data.today.roomRent.amount, data.mtd.roomRent.amount),
            getRow('Extra Bed', data.today.extraBed.amount, data.mtd.extraBed.amount),
            getRow('Adjustment', data.today.roomAdj.amount, data.mtd.roomAdj.amount),

            getRow('--- F&B Revenue ---', 0, 0),
            getRow('Restaurant', data.today.restaurant.amount + data.today.outside.amount, data.mtd.restaurant.amount + data.mtd.outside.amount),
            getRow('Room Service', data.today.roomService.amount, data.mtd.roomService.amount),
            getRow('Banquet F&B', data.today.banquetFood.amount, data.mtd.banquetFood.amount),
            getRow('Adjustment', data.today.fnbAdj.amount, data.mtd.fnbAdj.amount),

            // Simplify export for now to core sections, similar to logic I had before deletion
        ];
        return rows;
    };


    const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'copy') => {
        if (!data) return;

        // Helper calculations (duplicated from render logic for fidelity)
        const calculateSubTotal = (stats: any, keys: string[], adjKey?: string) => {
            let total = 0;
            keys.forEach(k => { total += (stats[k]?.amount || 0); });
            if (adjKey) total -= (stats[adjKey]?.amount || 0);
            return total;
        };

        const calculateSectionTotals = (stats: any, keys: string[], adjKey?: string) => {
            let net = 0, sc = 0, vat = 0;
            keys.forEach(k => {
                net += stats[k]?.amount || 0;
                sc += stats[k]?.service || 0;
                vat += stats[k]?.vat || 0;
            });
            if (adjKey) {
                net -= stats[adjKey]?.amount || 0;
                sc -= stats[adjKey]?.service || 0;
                vat -= stats[adjKey]?.vat || 0;
            }
            return { net, sc, vat, grand: net + sc + vat };
        };

        // Prepare rows matching the visual table
        const rows = [];

        // Room Revenue
        rows.push({ Description: '--- ROOM REVENUE ---', Today: '', MTD: '' });
        rows.push({ Description: 'Room Charge', Today: data.today.roomRent.amount, MTD: data.mtd.roomRent.amount });
        rows.push({ Description: 'Extra Bed', Today: data.today.extraBed.amount, MTD: data.mtd.extraBed.amount });
        rows.push({ Description: 'Adjustment', Today: `(${data.today.roomAdj.amount})`, MTD: `(${data.mtd.roomAdj.amount})` });
        rows.push({
            Description: 'Sub Total (Room)',
            Today: calculateSubTotal(data.today, ['roomRent', 'extraBed'], 'roomAdj'),
            MTD: calculateSubTotal(data.mtd, ['roomRent', 'extraBed'], 'roomAdj')
        });

        // F&B Revenue
        rows.push({ Description: '--- F&B REVENUE ---', Today: '', MTD: '' });
        rows.push({ Description: 'Restaurant', Today: data.today.restaurant.amount + data.today.outside.amount, MTD: data.mtd.restaurant.amount + data.mtd.outside.amount });
        rows.push({ Description: 'Room Service', Today: data.today.roomService.amount, MTD: data.mtd.roomService.amount });
        rows.push({ Description: 'Banquet F&B', Today: data.today.banquetFood.amount, MTD: data.mtd.banquetFood.amount });
        rows.push({ Description: 'Adjustment', Today: `(${data.today.fnbAdj.amount})`, MTD: `(${data.mtd.fnbAdj.amount})` });
        rows.push({
            Description: 'Sub Total (F&B)',
            Today: calculateSubTotal(data.today, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj'),
            MTD: calculateSubTotal(data.mtd, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj')
        });

        // Hall & Equipment
        rows.push({ Description: '--- HALL & EQUIPMENT ---', Today: '', MTD: '' });
        rows.push({ Description: 'Banquet Rent', Today: data.today.banquetHall.amount, MTD: data.mtd.banquetHall.amount });
        rows.push({ Description: 'Equipment', Today: data.today.equipment.amount, MTD: data.mtd.equipment.amount });
        rows.push({ Description: 'Adjustment', Today: `(${data.today.hallAdj.amount})`, MTD: `(${data.mtd.hallAdj.amount})` });
        rows.push({
            Description: 'Sub Total (Hall)',
            Today: calculateSubTotal(data.today, ['banquetHall', 'confHall', 'equipment'], 'hallAdj'),
            MTD: calculateSubTotal(data.mtd, ['banquetHall', 'confHall', 'equipment'], 'hallAdj')
        });

        // Housekeeping
        rows.push({ Description: '--- HOUSEKEEPING ---', Today: '', MTD: '' });
        rows.push({ Description: 'Mini-Fridge', Today: data.today.minibar.amount, MTD: data.mtd.minibar.amount });
        rows.push({ Description: 'Laundry', Today: data.today.laundry.amount, MTD: data.mtd.laundry.amount });
        rows.push({ Description: 'Adjustment', Today: `(${data.today.hkAdj.amount})`, MTD: `(${data.mtd.hkAdj.amount})` });
        rows.push({
            Description: 'Sub Total (HK)',
            Today: calculateSubTotal(data.today, ['minibar', 'laundry'], 'hkAdj'),
            MTD: calculateSubTotal(data.mtd, ['minibar', 'laundry'], 'hkAdj')
        });

        // Others
        rows.push({ Description: '--- OTHERS ---', Today: '', MTD: '' });
        rows.push({ Description: 'Transportation', Today: data.today.transport.amount, MTD: data.mtd.transport.amount });
        rows.push({ Description: 'Telephone', Today: data.today.telephone.amount, MTD: data.mtd.telephone.amount });
        rows.push({ Description: 'Pool/Health/SPA', Today: data.today.healthClub.amount + data.today.swimmingPool.amount + data.today.spa.amount, MTD: data.mtd.healthClub.amount + data.mtd.swimmingPool.amount + data.mtd.spa.amount });
        rows.push({ Description: 'Misc/Damage', Today: data.today.misc.amount + data.today.damage.amount, MTD: data.mtd.misc.amount + data.mtd.damage.amount });
        rows.push({ Description: 'Adjustment', Today: `(${data.today.othersAdj.amount})`, MTD: `(${data.mtd.othersAdj.amount})` });
        rows.push({
            Description: 'Sub Total (Others)',
            Today: calculateSubTotal(data.today, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj'),
            MTD: calculateSubTotal(data.mtd, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj')
        });

        // Grand Totals
        const todayRoom = calculateSectionTotals(data.today, ['roomRent', 'extraBed'], 'roomAdj');
        const todayFnb = calculateSectionTotals(data.today, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj');
        const todayHall = calculateSectionTotals(data.today, ['banquetHall', 'confHall', 'equipment'], 'hallAdj');
        const todayHk = calculateSectionTotals(data.today, ['minibar', 'laundry'], 'hkAdj');
        const todayOther = calculateSectionTotals(data.today, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj');

        const mtdRoom = calculateSectionTotals(data.mtd, ['roomRent', 'extraBed'], 'roomAdj');
        const mtdFnb = calculateSectionTotals(data.mtd, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj');
        const mtdHall = calculateSectionTotals(data.mtd, ['banquetHall', 'confHall', 'equipment'], 'hallAdj');
        const mtdHk = calculateSectionTotals(data.mtd, ['minibar', 'laundry'], 'hkAdj');
        const mtdOther = calculateSectionTotals(data.mtd, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj');

        const todayNet = todayRoom.net + todayFnb.net + todayHall.net + todayHk.net + todayOther.net;
        const todaySc = todayRoom.sc + todayFnb.sc + todayHall.sc + todayHk.sc + todayOther.sc;
        const todayVat = todayRoom.vat + todayFnb.vat + todayHall.vat + todayHk.vat + todayOther.vat;
        const todayGrand = todayNet + todaySc + todayVat;

        const mtdNet = mtdRoom.net + mtdFnb.net + mtdHall.net + mtdHk.net + mtdOther.net;
        const mtdSc = mtdRoom.sc + mtdFnb.sc + mtdHall.sc + mtdHk.sc + mtdOther.sc;
        const mtdVat = mtdRoom.vat + mtdFnb.vat + mtdHall.vat + mtdHk.vat + mtdOther.vat;
        const mtdGrand = mtdNet + mtdSc + mtdVat;

        rows.push({ Description: '--- TOTALS ---', Today: '', MTD: '' });
        rows.push({ Description: 'Total (Net)', Today: todayNet, MTD: mtdNet });
        rows.push({ Description: 'Service Charge', Today: todaySc, MTD: mtdSc });
        rows.push({ Description: 'Govt. VAT', Today: todayVat, MTD: mtdVat });
        rows.push({ Description: 'GRAND TOTAL', Today: todayGrand, MTD: mtdGrand });

        const filename = `Revenue_Statement_${date}`;

        switch (type) {
            case 'csv': exportToCSV(rows, filename); break;
            case 'excel': exportToExcel(rows, filename); break;
            case 'pdf':
                const headers = ['Description', 'Today', 'MTD'];
                exportToPDF(headers, rows, `Revenue Statement ${date}`, filename);
                break;
            case 'copy': copyToClipboard(rows); break;
        }
    };

    const handleSendMail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingMail(true);
        setMailStatus('idle');
        setErrorMessage('');

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    subject: `Revenue Statement - ${date}`,
                    data: data
                })
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setMailStatus('success');
            setTimeout(() => {
                setShowMailModal(false);
                setMailStatus('idle');
                setEmail('');
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setMailStatus('error');
            setErrorMessage(err.message || 'An unknown error occurred');
        } finally {
            setSendingMail(false);
        }
    };


    const fetchData = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/revenue-statement?date=${date}`);
            const result = await res.json();

            if (result.error) throw new Error(result.details);

            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    };

    const renderRow = (label: string, todayVal: number, mtdVal: number, isSubTotal = false, isAdjustment = false) => (
        <tr className={`border-b border-white/5 ${isSubTotal ? 'bg-white/5 font-bold print:bg-gray-100' : 'hover:bg-white/5 transition-colors print:hover:bg-transparent'}`}>
            <td className={`p-3 ${isSubTotal ? 'text-white print:text-black font-bold' : 'text-gray-300 print:text-black'}`}>{label}</td>
            <td className={`p-3 text-right ${isSubTotal ? 'text-emerald-400 print:text-black' : 'text-gray-300 print:text-black'} ${isAdjustment ? 'text-red-400 print:text-red-600' : ''}`}>
                {isAdjustment ? `(${formatCurrency(todayVal)})` : formatCurrency(todayVal)}
            </td>
            <td className={`p-3 text-right ${isSubTotal ? 'text-emerald-400 print:text-black' : 'text-gray-300 print:text-black'} ${isAdjustment ? 'text-red-400 print:text-red-600' : ''}`}>
                {isAdjustment ? `(${formatCurrency(mtdVal)})` : formatCurrency(mtdVal)}
            </td>
        </tr>
    );

    const calculateSubTotal = (stats: any, keys: string[], adjKey?: string) => {
        let total = 0;
        keys.forEach(k => {
            const item = stats[k];
            total += (item.amount || 0);
        });
        if (adjKey) {
            total -= (stats[adjKey].amount || 0);
        }
        return total;
    };

    const calculateSectionTotals = (stats: any, keys: string[], adjKey?: string) => {
        let net = 0;
        let sc = 0;
        let vat = 0;

        keys.forEach(k => {
            net += stats[k].amount || 0;
            sc += stats[k].service || 0;
            vat += stats[k].vat || 0;
        });

        if (adjKey) {
            net -= stats[adjKey].amount || 0;
            sc -= stats[adjKey].service || 0;
            vat -= stats[adjKey].vat || 0;
        }

        return { net, sc, vat, grand: net + sc + vat };
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Revenue Statement</h1>
                    <p className="text-gray-400 mt-1">Daily and Month-to-Date revenue analysis</p>
                </div>

                {/* Export Toolbar */}
                <div className="flex flex-wrap gap-2 print:hidden bg-white/5 p-1.5 rounded-xl border border-white/10">
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
                    <div className="w-px bg-white/10 mx-1" />
                    <button onClick={() => handlePrint && handlePrint()} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white">
                        <Printer size={16} /> <span className="hidden sm:inline">Print</span>
                    </button>
                    <button onClick={() => setShowMailModal(true)} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white">
                        <Mail size={16} /> <span className="hidden sm:inline">Mail</span>
                    </button>
                </div>
            </header>

            {/* Mail Modal */}
            {showMailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Mail className="text-purple-400" /> Send Revenue Report
                        </h3>

                        {mailStatus === 'success' ? (
                            <div className="text-green-400 text-center py-8">
                                <Send size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-bold">Email Sent Successfully!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMail} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Recipient Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        placeholder="manager@example.com"
                                        required
                                    />
                                </div>

                                {mailStatus === 'error' && (
                                    <p className="text-red-400 text-sm">{errorMessage || 'Failed to send email. Please try again.'}</p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowMailModal(false)}
                                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingMail}
                                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {sendingMail ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                                        Send Report
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl print:hidden"
            >
                <form onSubmit={fetchData} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> Select Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                        Generate Statement
                    </button>
                </form>
            </motion.div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Report */}
            {data && (
                <motion.div
                    ref={componentRef}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden print:bg-white print:text-black"
                >
                    <div className="p-8 space-y-8">
                        <div className="text-center border-b border-white/10 pb-6">
                            <h2 className="text-2xl font-bold text-white print:text-black">Revenue Statement</h2>
                            <p className="text-gray-400 print:text-gray-600">Report Date: {new Date(date).toLocaleDateString()}</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-white/10 text-white print:bg-gray-200 print:text-black border-b border-white/10">
                                        <th className="p-4 rounded-tl-lg">Point Of Sales</th>
                                        <th className="p-4 text-right">Today</th>
                                        <th className="p-4 text-right rounded-tr-lg">Month To Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Room Revenue */}
                                    <tr>
                                        <td colSpan={3} className="p-3 bg-white/5 font-semibold text-blue-300 uppercase text-xs tracking-wider">Room Revenue</td>
                                    </tr>
                                    {renderRow('Room Charge', data.today.roomRent.amount, data.mtd.roomRent.amount)}
                                    {renderRow('Extra Bed', data.today.extraBed.amount, data.mtd.extraBed.amount)}
                                    {renderRow('Adjustment', data.today.roomAdj.amount, data.mtd.roomAdj.amount, false, true)}
                                    {renderRow('Sub Total',
                                        calculateSubTotal(data.today, ['roomRent', 'extraBed'], 'roomAdj'),
                                        calculateSubTotal(data.mtd, ['roomRent', 'extraBed'], 'roomAdj'),
                                        true
                                    )}

                                    {/* F&B Revenue */}
                                    <tr>
                                        <td colSpan={3} className="p-3 bg-white/5 font-semibold text-blue-300 uppercase text-xs tracking-wider">Food & Beverage Revenue</td>
                                    </tr>
                                    {renderRow('Restaurant', data.today.restaurant.amount + data.today.outside.amount, data.mtd.restaurant.amount + data.mtd.outside.amount)}
                                    {renderRow('Room Service', data.today.roomService.amount, data.mtd.roomService.amount)}
                                    {renderRow('Banquet Food & Beverage', data.today.banquetFood.amount, data.mtd.banquetFood.amount)}
                                    {renderRow('Adjustment', data.today.fnbAdj.amount, data.mtd.fnbAdj.amount, false, true)}
                                    {renderRow('Sub Total',
                                        calculateSubTotal(data.today, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj'),
                                        calculateSubTotal(data.mtd, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj'),
                                        true
                                    )}

                                    {/* Hall & Equipment */}
                                    <tr>
                                        <td colSpan={3} className="p-3 bg-white/5 font-semibold text-blue-300 uppercase text-xs tracking-wider">Hall & Equipment Revenue</td>
                                    </tr>
                                    {renderRow('Banquet Rent', data.today.banquetHall.amount, data.mtd.banquetHall.amount)}
                                    {renderRow('Equipment', data.today.equipment.amount, data.mtd.equipment.amount)}
                                    {renderRow('Adjustment', data.today.hallAdj.amount, data.mtd.hallAdj.amount, false, true)}
                                    {renderRow('Sub Total',
                                        calculateSubTotal(data.today, ['banquetHall', 'confHall', 'equipment'], 'hallAdj'),
                                        calculateSubTotal(data.mtd, ['banquetHall', 'confHall', 'equipment'], 'hallAdj'),
                                        true
                                    )}

                                    {/* Housekeeping */}
                                    <tr>
                                        <td colSpan={3} className="p-3 bg-white/5 font-semibold text-blue-300 uppercase text-xs tracking-wider">Housekeeping Revenue</td>
                                    </tr>
                                    {renderRow('Mini-Fridge', data.today.minibar.amount, data.mtd.minibar.amount)}
                                    {renderRow('Laundry', data.today.laundry.amount, data.mtd.laundry.amount)}
                                    {renderRow('Adjustment', data.today.hkAdj.amount, data.mtd.hkAdj.amount, false, true)}
                                    {renderRow('Sub Total',
                                        calculateSubTotal(data.today, ['minibar', 'laundry'], 'hkAdj'),
                                        calculateSubTotal(data.mtd, ['minibar', 'laundry'], 'hkAdj'),
                                        true
                                    )}

                                    {/* Others */}
                                    <tr>
                                        <td colSpan={3} className="p-3 bg-white/5 font-semibold text-blue-300 uppercase text-xs tracking-wider">Others Revenue</td>
                                    </tr>
                                    {renderRow('Transportation', data.today.transport.amount, data.mtd.transport.amount)}
                                    {renderRow('Telephone', data.today.telephone.amount, data.mtd.telephone.amount)}
                                    {renderRow('Business Center', data.today.businessCenter.amount, data.mtd.businessCenter.amount)}
                                    {renderRow('Driver Accommodation', data.today.driverAcc.amount, data.mtd.driverAcc.amount)}
                                    {renderRow('Health Club', data.today.healthClub.amount, data.mtd.healthClub.amount)}
                                    {renderRow('Swimming Pool', data.today.swimmingPool.amount, data.mtd.swimmingPool.amount)}
                                    {renderRow('SPA', data.today.spa.amount, data.mtd.spa.amount)}
                                    {renderRow('Gift Shop', data.today.giftShop.amount, data.mtd.giftShop.amount)}
                                    {renderRow('Recreation', data.today.ticketing.amount, data.mtd.ticketing.amount)}
                                    {renderRow('Damage Charge', data.today.damage.amount, data.mtd.damage.amount)}
                                    {renderRow('Misc. Charges', data.today.misc.amount, data.mtd.misc.amount)}
                                    {renderRow('Adjustment', data.today.othersAdj.amount, data.mtd.othersAdj.amount, false, true)}
                                    {renderRow('Sub Total',
                                        calculateSubTotal(data.today, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj'),
                                        calculateSubTotal(data.mtd, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj'),
                                        true
                                    )}

                                    {/* Grand Totals */}
                                    <tr>
                                        <td colSpan={3} className="p-4"></td>
                                    </tr>
                                    {(() => {
                                        const todayRoom = calculateSectionTotals(data.today, ['roomRent', 'extraBed'], 'roomAdj');
                                        const todayFnb = calculateSectionTotals(data.today, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj');
                                        const todayHall = calculateSectionTotals(data.today, ['banquetHall', 'confHall', 'equipment'], 'hallAdj');
                                        const todayHk = calculateSectionTotals(data.today, ['minibar', 'laundry'], 'hkAdj');
                                        const todayOther = calculateSectionTotals(data.today, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj');

                                        const mtdRoom = calculateSectionTotals(data.mtd, ['roomRent', 'extraBed'], 'roomAdj');
                                        const mtdFnb = calculateSectionTotals(data.mtd, ['restaurant', 'outside', 'roomService', 'banquetFood', 'confFood'], 'fnbAdj');
                                        const mtdHall = calculateSectionTotals(data.mtd, ['banquetHall', 'confHall', 'equipment'], 'hallAdj');
                                        const mtdHk = calculateSectionTotals(data.mtd, ['minibar', 'laundry'], 'hkAdj');
                                        const mtdOther = calculateSectionTotals(data.mtd, ['transport', 'telephone', 'businessCenter', 'driverAcc', 'healthClub', 'swimmingPool', 'spa', 'giftShop', 'ticketing', 'damage', 'misc'], 'othersAdj');

                                        const todayNet = todayRoom.net + todayFnb.net + todayHall.net + todayHk.net + todayOther.net;
                                        const todaySc = todayRoom.sc + todayFnb.sc + todayHall.sc + todayHk.sc + todayOther.sc;
                                        const todayVat = todayRoom.vat + todayFnb.vat + todayHall.vat + todayHk.vat + todayOther.vat;
                                        const todayGrand = todayNet + todaySc + todayVat;

                                        const mtdNet = mtdRoom.net + mtdFnb.net + mtdHall.net + mtdHk.net + mtdOther.net;
                                        const mtdSc = mtdRoom.sc + mtdFnb.sc + mtdHall.sc + mtdHk.sc + mtdOther.sc;
                                        const mtdVat = mtdRoom.vat + mtdFnb.vat + mtdHall.vat + mtdHk.vat + mtdOther.vat;
                                        const mtdGrand = mtdNet + mtdSc + mtdVat;

                                        return (
                                            <>
                                                {renderRow('Total (Net)', todayNet, mtdNet)}
                                                {renderRow('Service Charge', todaySc, mtdSc)}
                                                {renderRow('Govt. VAT', todayVat, mtdVat)}
                                                <tr className="bg-emerald-500/20 border-t-2 border-emerald-500">
                                                    <td className="p-4 font-bold text-white text-lg">Grand Total</td>
                                                    <td className="p-4 font-bold text-white text-right text-lg">{formatCurrency(todayGrand)}</td>
                                                    <td className="p-4 font-bold text-white text-right text-lg">{formatCurrency(mtdGrand)}</td>
                                                </tr>
                                            </>
                                        )
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        <div className="text-center text-xs text-gray-400 mt-8">
                            Generated by AI Dashboard System • {new Date().toLocaleString()}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
