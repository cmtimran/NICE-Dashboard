import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();

        // Fetch Room Status counts from Rlist
        // We distinguish Occupied, Vacant Clean (Ok), OOO, OOS
        const result = await pool.request().query(`
            SELECT 
                CASE 
                    WHEN Gust = 'True' THEN 'Occupied'
                    WHEN Status = 'Out Of Order' THEN 'Out of Order'
                    WHEN Status = 'Out Of Service' THEN 'Out of Service'
                    WHEN Status = 'Ok' THEN 'Vacant Clean'
                    ELSE 'Other' 
                END as status,
                COUNT(*) as value
            FROM Rlist
            WHERE Room_type <> 'FOLIO'
            GROUP BY 
                CASE 
                    WHEN Gust = 'True' THEN 'Occupied'
                    WHEN Status = 'Out Of Order' THEN 'Out of Order'
                    WHEN Status = 'Out Of Service' THEN 'Out of Service'
                    WHEN Status = 'Ok' THEN 'Vacant Clean'
                    ELSE 'Other' 
                END
        `);

        return NextResponse.json(result.recordset);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
