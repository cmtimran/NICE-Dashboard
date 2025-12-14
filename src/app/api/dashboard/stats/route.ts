import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Parallel queries for performance
        const [
            inhouseResult,
            expectedArrivalResult,
            expectedDepartureResult,
            outOfOrderResult,
            outOfServiceResult,
            vacantResult
        ] = await Promise.all([
            query("SELECT COUNT(Room_No) AS count FROM Rlist WHERE (Gust='True') and Room_type <> 'FOLIO'"),
            query(`SELECT COUNT(*) AS count FROM vwAdvanceBooking WHERE (Arrival_Date = '${today}') AND (ar = 0) AND (fldCondition = 'Y')`),
            query(`SELECT COUNT(*) AS count FROM KHRLINT.dbo.[Master] WHERE (dod='${today}') AND (Gust = 1) and Roomno not in (2000,4000,6000,7000,8000,9000)`),
            query("SELECT COUNT(Status) AS count FROM Rlist WHERE (Status='Out Of Order')"),
            query("SELECT COUNT(Status) AS count FROM Rlist WHERE (Status='Out Of Service')"),
            query("SELECT COUNT(Status) AS count FROM Rlist WHERE (Status in ('Ok')) and room_type not in ('FOLIO')")
        ]);

        const stats = {
            inhouse: inhouseResult.recordset[0].count,
            expectedArrival: expectedArrivalResult.recordset[0].count,
            expectedDeparture: expectedDepartureResult.recordset[0].count,
            outOfOrder: outOfOrderResult.recordset[0].count,
            outOfService: outOfServiceResult.recordset[0].count,
            vacant: vacantResult.recordset[0].count,
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Dashboard Stats API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
