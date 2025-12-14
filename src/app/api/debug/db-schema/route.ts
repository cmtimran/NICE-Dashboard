import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();

        // Get all tables and views
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
            ORDER BY TABLE_NAME
        `);

        // Get columns for vwAllSalesTips to debug the error
        const advanceBookingColumns = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'vwAllSalesTips'
        `);

        return NextResponse.json({
            tables: tablesResult.recordset,
            vwAdvanceBookingColumns: advanceBookingColumns.recordset.map((c: any) => c.COLUMN_NAME)
        });
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
