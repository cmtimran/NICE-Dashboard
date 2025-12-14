import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        // Fetch Top 5 Companies by number of bookings (Active & Future)
        const result = await pool.request().query(`
            SELECT TOP 5 Compay_Name as name, COUNT(*) as value
            FROM vwAdvanceBooking 
            WHERE fldStatus NOT IN ('Cancel', 'No Show') 
            AND Compay_Name IS NOT NULL 
            AND Compay_Name <> '' 
            AND Compay_Name NOT LIKE '%Walk%'
            GROUP BY Compay_Name 
            ORDER BY count(*) DESC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
