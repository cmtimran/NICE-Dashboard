import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 5 Nat as name, COUNT(*) as value
            FROM KHRLINT.dbo.Master
            WHERE Gust=1
            GROUP BY Nat
            ORDER BY COUNT(*) DESC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
