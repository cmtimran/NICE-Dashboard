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
                SELECT [date], fname, lname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, [Local], Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room as roomtype, Rate, dis, discount, [Entry], Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, Designation, Upgrade, fldShiftId, [Service], Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus 
                FROM DHLRST.dbo.[Master] 
                WHERE (dod BETWEEN @startDate AND @endDate) AND (Gust = 1) and Roomno not in (2000,4000,6000,7000,8000,9000) 
                ORDER BY Roomno
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
