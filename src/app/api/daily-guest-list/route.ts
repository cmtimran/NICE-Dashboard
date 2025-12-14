import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Exact Big Query from daily-guest-list.php
        // Note: Legacy code ignored date filters and just showed "Gust=1" (In House)
        const sqlStr = `SELECT [date], fname, lname, Passport_No, Dpi, Place, Nat, Birth, Occuption, Haddr, Nameco, [Local], Doar, Fromc, Dod, Tod, Purpose, Payment, Roomno, Roomc, Person, Room as roomtype, Rate, dis, discount, [Entry], Stay, Toar, Ptotal, Total, Rcard, Gust, Gtype, Todp, Checko, Remarks, Extra, [Close], Taka, no_of_night, [user], utime, gname1, gname2, VisaNo, VisaIssuePlace, VisaIssueDate, PickupDrop, DropTime, Designation, Upgrade, fldShiftId, [Service], Tax, NewType, MFC, DD, MM, YYYY, TravelAgency, CheckOutBy, RegReference, NoPost, fldID, fldStatus FROM LVLDHK.dbo.[Master] WHERE (Gust = 1) and Roomno not in (2000) ORDER BY Roomno,Doar`;

        // Note: If LVLDHK fails, we might need to change it to KHRLINT or remove the prefix if it's the same DB.
        // Given the user constraint "kono quary change korte parbe na", I must try the exact string first.
        // However, if the legacy app was connecting to KHRLINT and querying LVLDHK, it implies cross-db access is set up.

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
            contact: row.Stay, // Mapped to 'Stay' in legacy code 'phone = $row["Stay"]'
            email: row.gname1,
            remarks: row.Remarks,
            checkInBy: row.CheckOutBy // Legacy maps 'CheckOutBy' to 'Check-IN By' column label?! Wait, legacy says: `<td><?php echo $checkoutby; ?></td>` where `$checkoutby = $row["CheckOutBy"];`. But the table header says "Check-IN By". Secure/Crazy legacy logic preserved.
        }));

        return NextResponse.json(guests);

    } catch (error: any) {
        console.error('Daily Guest List API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
