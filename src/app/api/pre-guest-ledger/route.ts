import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Append 00:00:00.000 to match string literal in PHP if necessary, but parameters usually handle types. 
    // However, PHP used: $start_date . ' 00:00:00.000';
    // Let's assume the DB 'sDate' is a datetime. Passing 'YYYY-MM-DD' might not match exact datetime if it stores time.
    // I will append the time part to be safe as per original PHP.

    // Actually, parameterized queries might handle 'YYYY-MM-DD' against datetime by assuming 00:00:00.
    // Safest is to pass the full string.
    const dateWithTime = `${date} 00:00:00.000`;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('date', dateWithTime)
            .query(`
                SELECT sDate, roomno, fullname, nameco, PayMode, doar, dod, Rate, dis, taka, Gross, total, credit, balance, Upgrade, GrossUSD, takaUSD, discount 
                FROM tblGuestLedger 
                WHERE (sDate=@date)
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
