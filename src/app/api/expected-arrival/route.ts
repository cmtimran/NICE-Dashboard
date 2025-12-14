import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Missing date parameters' }, { status: 400 });
        }

        const sql = `SELECT RegProof as reservation_no, GuestTitle, First_name, Last_name, Compay_Name, RoomType, fldStatus, Arrival_Date, Departure_Date, roomno, person as pax, rate, flt, fltTime, phone, [address] as email, [user_id], remarks, Inclusions as [message], ar, fldcondition FROM vwAdvanceBooking WHERE (Arrival_Date BETWEEN '${startDate}' AND '${endDate}') and ar=0 and fldcondition='Y' order by reservation_no`;

        const result = await query(sql);

        const data = result.recordset.map((row: any) => ({
            reservationNo: row.reservation_no,
            guestName: `${row.First_name || ''} ${row.Last_name || ''}`.trim(),
            companyName: row.Compay_Name,
            roomType: row.RoomType,
            roomNo: row.roomno,
            rate: row.rate,
            pax: row.pax,
            arrivalDate: row.Arrival_Date ? new Date(row.Arrival_Date).toISOString().split('T')[0] : '',
            departureDate: row.Departure_Date ? new Date(row.Departure_Date).toISOString().split('T')[0] : '',
            mobile: row.phone,
            email: row.email,
            status: row.fldStatus,
            flightC: row.flt, // legacy 'flt'
            message: row.message, // legacy 'Inclusions'
            remarks: row.remarks,
            userId: row.user_id
        }));

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Expected Arrival API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
