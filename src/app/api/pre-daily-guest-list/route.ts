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
                SELECT SDATE, [date], lname, fname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, Local, Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room as roomtype, Rate, dis, discount, Entry, Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, NewRegNo, Designation, Upgrade, fldShiftId, Service, Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus, fldPakId, fldPakName 
                FROM SAHLRT.dbo.[PreviousGuest] 
                WHERE ([SDATE] BETWEEN @startDate AND @endDate) and (Gust = 1) and Roomno not in (2000) 
                ORDER BY Roomno, Doar
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
