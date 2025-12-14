import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const today = new Date().toISOString().split('T')[0];
        const next15Days = new Date();
        next15Days.setDate(next15Days.getDate() + 15);
        const next15DaysStr = next15Days.toISOString().split('T')[0];

        const startDate = searchParams.get('startDate') || today;
        const endDate = searchParams.get('endDate') || next15DaysStr;

        // Query 1: Total Rooms
        const totalRoomsResult = await query("SELECT COUNT(Room_No) as total_room FROM Rlist WHERE Room_Type <> 'FOLIO'");
        const totalRooms = totalRoomsResult.recordset[0].total_room;

        // Query 2: Forecast Main Data
        const forecastSql = `SELECT [date], occ, arr, dpr, com, hou, ocp, rev, avr, dur, nsr, ooo, pax FROM vwForecastMain WHERE (date BETWEEN '${startDate}' AND '${endDate}') order by [date]`;
        const forecastResult = await query(forecastSql);

        // Process rows and run Query 3 (Reservations) for each date
        // We use Promise.all to run these efficiently while keeping the query "unchanged" in logic
        const detailedData = await Promise.all(forecastResult.recordset.map(async (row: any) => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];

            // Exact Query 3 logic
            const resQuery = `SELECT COUNT(*) as total_expected_dep_reservation_room FROM vwAdvanceBooking WHERE (Departure_Date='${dateStr}') and ar=0 and fldcondition='Y'`;
            const resResult = await query(resQuery);
            const reservationDeps = resResult.recordset[0].total_expected_dep_reservation_room;

            return {
                date: dateStr,
                fullDate: row.date, // Keep original for reference
                totalRooms,
                expectedArrival: row.arr,
                departureReg: row.dpr,
                departureRes: reservationDeps,
                totalDeparture: reservationDeps + row.dpr,
                trainRooms: row.occ, // 'occ' column seems to be occupied rooms
                occupiedRooms: row.occ,
                occupiedRoomsDisplay: row.occ - row.ooo, // Logic from legacy: OccupiedRooms - OutoforderRooms
                outOfOrder: row.ooo,
                vacantRooms: totalRooms - row.occ - row.ooo, // Logic from legacy: total_room - OccupiedRooms - OutoforderRooms
                occupancyPercent: row.ocp
            };
        }));

        return NextResponse.json(detailedData);
    } catch (error: any) {
        console.error('Forecast API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
