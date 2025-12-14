import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    try {
        const pool = await getPool();
        const requestPool = pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate);

        // Query 1: Details
        const detailsQuery = `
            SELECT date, roomno, billno, Name, sname, ammount, service, tax 
            FROM S1  
            WHERE (date BETWEEN @startDate AND @endDate) AND (scode in ('SR001','SN001','SM003', 'JSS11')) and ammount<>0 and roomno not in (2000) 
            ORDER BY roomno, scode
        `;
        const detailsResult = await requestPool.query(detailsQuery);

        // Query 2: Total Stats
        // New request for each query to avoid active result set issues
        const totalsResult = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT SUM(ammount) as total_amount, SUM(service)as total_service, SUM(tax) as total_tax, sum(ammount+service+tax) as total 
                FROM s1 
                WHERE (date BETWEEN @startDate AND @endDate) AND (scode in ('SR001','SN001','SM003', 'JSS11')) and ammount<>0 and roomno not in (2000)
            `);

        // Query 3: Adjustment
        const adjustmentResult = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT SUM(-credit) as total_amount, SUM(-service)as total_service, SUM(-tax) as total_tax, sum(-(credit+service+tax)) as total 
                FROM s1 
                WHERE (date BETWEEN @startDate AND @endDate) AND (scode in ('DR001','DN001', 'DM003', 'DJS11') and credit<>0 and roomno not in (2000))
            `);

        // Query 4: Total Credit (for Grand Total calc)
        const creditResult = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT SUM(credit) as total_credit, SUM(service)as total_service, SUM(tax) as total_tax, sum(credit+service+tax) as total 
                FROM s1 
                WHERE (date BETWEEN @startDate AND @endDate) AND (scode in ('DR001','DN001', 'DM003', 'DJS11')) and credit<>0 and roomno not in (2000)
            `);

        const totals = totalsResult.recordset[0] || {};
        const credit = creditResult.recordset[0] || {};

        const grandTotal = {
            total_amount: (totals.total_amount || 0) - (credit.total_credit || 0),
            total_service: (totals.total_service || 0) - (credit.total_service || 0),
            total_tax: (totals.total_tax || 0) - (credit.total_tax || 0),
            total: (totals.total || 0) - (credit.total || 0)
        };

        return NextResponse.json({
            details: detailsResult.recordset,
            totals: totals,
            adjustment: adjustmentResult.recordset[0] || {},
            grandTotal: grandTotal
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
