import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        // Calculate Lead Time buckets
        // DATEDIFF(day, Entry, Arrival_Date)
        // Note: Entry might need casting if it's not pure date, but usually fine in MSSQL.
        // We filter for active bookings (not Cancel/No Show)
        const result = await pool.request().query(`
            SELECT 
                CASE 
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) <= 0 THEN 'Same Day'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 1 AND 3 THEN '1-3 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 4 AND 7 THEN '4-7 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 8 AND 30 THEN '8-30 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) > 30 THEN '30+ Days'
                    ELSE 'Unknown'
                END as leadTimeGroup,
                COUNT(*) as count
            FROM vwAdvanceBooking
            WHERE fldStatus NOT IN ('Cancel', 'No Show')
            GROUP BY 
                CASE 
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) <= 0 THEN 'Same Day'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 1 AND 3 THEN '1-3 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 4 AND 7 THEN '4-7 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) BETWEEN 8 AND 30 THEN '8-30 Days'
                    WHEN DATEDIFF(day, [Entry], Arrival_Date) > 30 THEN '30+ Days'
                    ELSE 'Unknown'
                END
        `);

        // Order the results for consistent chart display
        const orderMap: Record<string, number> = {
            'Same Day': 1,
            '1-3 Days': 2,
            '4-7 Days': 3,
            '8-30 Days': 4,
            '30+ Days': 5,
            'Unknown': 6
        };

        const sortedData = result.recordset.sort((a: any, b: any) => orderMap[a.leadTimeGroup] - orderMap[b.leadTimeGroup]);

        return NextResponse.json(sortedData);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
