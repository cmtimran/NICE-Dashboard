import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                SELECT [entry], RegProof as reservation_no, GuestTitle, First_name, Last_name, Compay_Name, RoomType, fldStatus, Arrival_Date, Departure_Date, roomno, person as pax, rate, flt, fltTime, phone, [address] as email, [user_id], remark, Inclusions, ar, fldcondition 
                FROM vwAdvanceBooking 
                WHERE ([entry] BETWEEN @startDate AND @endDate) and ar=0 and fldcondition='Y' 
                ORDER BY reservation_no
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
