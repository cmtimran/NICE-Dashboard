import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT roomno, fullname, nameco, PayMode, doar, dod, Rate, dis, taka, Gross, total, credit, balance, Upgrade, GrossUSD, takaUSD, discount 
                FROM vwGuestLedger
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
