import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const sql = "SELECT Roomno_type FROM type where Roomno_type not in ('FOLIO')";
        const result = await query(sql);

        const types = result.recordset.map((row: any) => row.Roomno_type);

        return NextResponse.json({ types });
    } catch (error: any) {
        console.error('Room Types API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
