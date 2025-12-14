import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const today = new Date().toISOString().split('T')[0];

        const startDate = searchParams.get('startDate') || today;
        const endDate = searchParams.get('endDate') || today;

        // Exact Query from checkin-list.php
        // Note: It uses KHRLINT.dbo.[Master] unlike daily-guest-list that used LVLDHK
        // and filters by Doar (Date of Arrival) between range AND Gust=1
        const sqlStr = `SELECT [date], fname, lname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, [Local], Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room as roomtype, Rate, dis, discount, [Entry], Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, Designation, Upgrade, fldShiftId, [Service], Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus FROM KHRLINT.dbo.[Master] WHERE (Doar BETWEEN '${startDate}' AND '${endDate}') AND (Gust = 1) and Roomno not in (2000) ORDER BY Roomno`;

        const result = await query(sqlStr);

        const guests = result.recordset.map((row: any, index: number) => ({
            id: index + 1,
            roomNo: row.Roomno,
            regNo: row.Rcard,
            roomType: row.roomtype,
            rate: row.Total,
            pax: row.Person,
            guestName: `${row.fname} ${row.lname}`,
            companyName: row.Nameco,
            country: row.Nat,
            passport: row.Passport_No,
            checkInDate: row.Doar ? new Date(row.Doar).toISOString().split('T')[0] : '',
            checkOutDate: row.Dod ? new Date(row.Dod).toISOString().split('T')[0] : '',
            checkOutTime: row.Tod,
            status: row.fldStatus,
            contact: row.Stay,
            email: row.gname1,
            remarks: row.Remarks,
            checkInBy: row.CheckOutBy
        }));

        return NextResponse.json(guests);

    } catch (error: any) {
        console.error('Checkin List API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
