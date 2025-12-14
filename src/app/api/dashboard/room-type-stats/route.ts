import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        // Fetch Room Type Distribution (Active & Future)
        const result = await pool.request().query(`
            SELECT RoomType as name, COUNT(*) as value
            FROM vwAdvanceBooking 
            WHERE fldStatus NOT IN ('Cancel', 'No Show') 
            AND RoomType IS NOT NULL 
            GROUP BY RoomType 
            ORDER BY count(*) DESC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
