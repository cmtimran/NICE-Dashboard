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

        // Query from legacy checkout-list.php
        // Roomno 2000 excluded as per legacy code
        const sql = `SELECT [date], fname, lname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, [Local], Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room as roomtype, Rate, dis, discount, [Entry], Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, Designation, Upgrade, fldShiftId, [Service], Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus FROM [Master] WHERE (dod BETWEEN '${startDate}' AND '${endDate}') AND (Gust = 0) and Roomno not in (2000) ORDER BY Roomno`;

        const result = await query(sql);

        const data = result.recordset.map((row: any) => ({
            roomNo: row.Roomno,
            registrationNo: row.Rcard,
            roomType: row.roomtype,
            rate: row.Total,
            pax: row.Person,
            guestName: `${row.fname || ''} ${row.lname || ''}`.trim(),
            companyName: row.Nameco,
            country: row.Nat,
            passport: row.Passport_No,
            checkInDate: row.Doar ? new Date(row.Doar).toISOString().split('T')[0] : '',
            checkOutDate: row.Dod ? new Date(row.Dod).toISOString().split('T')[0] : '',
            checkOutTime: row.Tod,
            status: row.fldStatus,
            contactNo: row.Stay, // Legacy maps Stay to Phone
            email: row.gname1,    // Legacy maps gname1 to Email
            remarks: row.Remarks,
            checkOutBy: row.CheckOutBy
        }));

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Checkout List API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
