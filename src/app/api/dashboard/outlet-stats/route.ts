import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                CASE 
                    WHEN SL = 1 THEN 'Front Office'
                    WHEN SL = 2 THEN 'Reservation'
                    WHEN SL = 3 THEN 'Restaurant'
                    WHEN SL = 19 THEN 'Corp. Collection'
                    ELSE 'Other Outlets'
                END as name,
                SUM(ammount) as value
            FROM vwAllSalesTips
            WHERE payment NOT IN ('Complimentary','Void','House Use','Entertainment')
            AND MONTH(date) = MONTH(GETDATE()) AND YEAR(date) = YEAR(GETDATE())
            GROUP BY 
                CASE 
                    WHEN SL = 1 THEN 'Front Office'
                    WHEN SL = 2 THEN 'Reservation'
                    WHEN SL = 3 THEN 'Restaurant'
                    WHEN SL = 19 THEN 'Corp. Collection'
                    ELSE 'Other Outlets'
                END
            ORDER BY SUM(ammount) DESC
        `);

        return NextResponse.json(result.recordset);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
