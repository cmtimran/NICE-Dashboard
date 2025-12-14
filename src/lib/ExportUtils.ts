// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
// @ts-ignore
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';

// --- Export to CSV ---
export const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const csvBuffer = XLSX.write(wb, { bookType: 'csv', type: 'array' });
    const blob = new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};

// --- Export to Excel ---
export const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
};

// --- Export to PDF ---
export const exportToPDF = (headers: string[], data: any[], title: string, filename: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);

    autoTable(doc, {
        head: [headers],
        body: data.map(item => Object.values(item)),
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${filename}.pdf`);
};

// --- Copy to Clipboard ---
export const copyToClipboard = (data: any[]) => {
    const headers = Object.keys(data[0]).join('\t');
    const rows = data.map(obj => Object.values(obj).join('\t')).join('\n');
    const clipboardData = `${headers}\n${rows}`;

    navigator.clipboard.writeText(clipboardData)
        .then(() => alert('Data copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
};
