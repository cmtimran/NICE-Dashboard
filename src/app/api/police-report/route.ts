import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT [date], lname, fname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, [Local], Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room, Rate, dis, discount, [Entry], Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, NewRegNo, Designation, Upgrade, fldShiftId, [Service], Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus, fldPakId, fldPakName 
                FROM MasterSub 
                WHERE (Gust = 1) and Nat not in ('BANGLADESH') AND (Roomno NOT IN (2000, 4000, 6000, 7000, 8000, 8001, 8002, 8002, 9000, 9001, 9002, 9003, 9004, 9005)) 
                ORDER BY Doar, Roomno
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
