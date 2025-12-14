import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();

        // Simple heuristic for Source of Business
        // Agency -> has TravelAgency
        // Corporate -> has Compay_Name (and not Walk-in-ish)
        // Direct -> Everything else
        const result = await pool.request().query(`
            SELECT 
                CASE 
                    WHEN ReferenceBy IS NOT NULL AND ReferenceBy <> '' THEN 'OTA / Agency'
                    WHEN Compay_Name IS NOT NULL AND Compay_Name <> '' AND Compay_Name NOT LIKE '%Walk%' THEN 'Corporate'
                    ELSE 'Direct / Walk-in'
                END as sourceGroup,
                COUNT(*) as value
            FROM vwAdvanceBooking
            WHERE fldStatus NOT IN ('Cancel', 'No Show')
            GROUP BY 
                CASE 
                    WHEN ReferenceBy IS NOT NULL AND ReferenceBy <> '' THEN 'OTA / Agency'
                    WHEN Compay_Name IS NOT NULL AND Compay_Name <> '' AND Compay_Name NOT LIKE '%Walk%' THEN 'Corporate'
                    ELSE 'Direct / Walk-in'
                END
        `);

        return NextResponse.json(result.recordset);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
