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

        // Query 1: Details
        const detailsResult = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT SL, [date], itemid, trbillno, roomno, billno, [name], nameco, Chargeto, payment, cheque, cash, [Card], Com, bKash 
                FROM vwDailyCollection 
                WHERE ([date] BETWEEN @startDate AND @endDate) and SL not in (19) 
                ORDER BY SL, payment
            `);

        // Query 2: Totals
        const totalsResult = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT sum(cheque) as totalcheque, sum(cash) as totalcash, sum([Card]) as totalCard, sum(Com) as totalCom, sum(bKash) as totalbKash 
                FROM vwDailyCollection 
                WHERE ([date] BETWEEN @startDate AND @endDate) and SL not in (19)
            `);

        return NextResponse.json({
            details: detailsResult.recordset,
            totals: totalsResult.recordset[0] || {}
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
