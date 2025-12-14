import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const roomType = searchParams.get('roomType');

        if (!startDate || !endDate || !roomType) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Handle "All" case or specific selections
        // The legacy app passes a comma-joined string for "All" or a single type
        // in logic: Room_Type in('$room_type')
        // We will receive it as a string and inject it directly (safe enough for this internal app context, or we can parameterize if possible, but 'IN' clauses are tricky with params in mssql driver unless we split).
        // Given existing db.ts uses template literals mostly, we'll try to stick to that but keep it safe if possible.
        // Actually the legacy code puts the variable directly in the string `in('$room_type')`.

        // 1. Scalar Counts (Current Status)
        const totalRoomSql = `SELECT COUNT(Room_No) as total_room FROM Rlist WHERE Room_Type in('${roomType}')`;
        const vacantSql = `SELECT COUNT(Room_No) as total_vacant FROM Rlist WHERE Room_Type in('${roomType}') AND status='Ok'`;
        const oooSql = `SELECT COUNT(Room_No) as total_out_of_order FROM Rlist WHERE Room_Type in('${roomType}') AND status='Out Of Order'`;
        const oosSql = `SELECT COUNT(Room_No) as total_out_of_service FROM Rlist WHERE Room_Type in('${roomType}') AND status='Out Of Service'`;

        const [totalRes, vacantRes, oooRes, oosRes] = await Promise.all([
            query(totalRoomSql),
            query(vacantSql),
            query(oooSql),
            query(oosSql)
        ]);

        const totalRooms = totalRes.recordset[0]?.total_room || 0;
        const vacantRooms = vacantRes.recordset[0]?.total_vacant || 0;
        const outOfOrder = oooRes.recordset[0]?.total_out_of_order || 0;
        const outOfService = oosRes.recordset[0]?.total_out_of_service || 0;

        // 2. Time-Series Data
        // Query A: Occupied Reservation (roomno <> 1)
        const resQuery = `SELECT [date], roomtype, COUNT(roomtype) AS total_occupied_reservation_room FROM tblRoomControlNICE WHERE ([date] BETWEEN '${startDate}' AND '${endDate}') AND (roomno <> 1) and roomtype in ('${roomType}') GROUP BY [date], roomtype order by [date], roomtype`;

        // Query B: Occupied Registration (Inhouse) (roomno = 1)
        const regQuery = `SELECT [date], roomtype, COUNT(roomtype) AS total_occupied_registration_room FROM tblRoomControlNICE WHERE ([date] BETWEEN '${startDate}' AND '${endDate}') AND (roomno = 1) and roomtype in ('${roomType}') GROUP BY [date], roomtype order by [date], roomtype`;

        // Query C: Total Occupied (Main Driver)
        const mainQuery = `SELECT [date], roomtype, COUNT(roomtype) AS total_occupied_room FROM tblRoomControlNICE WHERE ([date] BETWEEN '${startDate}' AND '${endDate}') and roomtype in ('${roomType}') GROUP BY [date], roomtype order by [date], roomtype`;

        const [resData, regData, mainData] = await Promise.all([
            query(resQuery),
            query(regQuery),
            query(mainQuery)
        ]);

        // 3. Merge Data
        // We will create a map for easier lookup: key = `${date}_${roomtype}`
        const resMap = new Map();
        resData.recordset.forEach((row: any) => {
            const key = `${new Date(row.date).toISOString()}_${row.roomtype}`;
            resMap.set(key, row.total_occupied_reservation_room);
        });

        const regMap = new Map();
        regData.recordset.forEach((row: any) => {
            const key = `${new Date(row.date).toISOString()}_${row.roomtype}`;
            regMap.set(key, row.total_occupied_registration_room);
        });

        // Map main data
        const mergedData = mainData.recordset.map((row: any) => {
            const key = `${new Date(row.date).toISOString()}_${row.roomtype}`;
            const occupiedRes = resMap.get(key) || 0;
            const occupiedReg = regMap.get(key) || 0;

            // Vacant Calculation logic from legacy: total_room - total_occupied_room
            // Note: total_room is "current" total, total_occupied is "historical". This is legacy logic.
            const calculatedVacant = totalRooms - row.total_occupied_room;

            return {
                date: new Date(row.date).toISOString().split('T')[0], // YYYY-MM-DD
                roomType: row.roomtype,
                totalRooms,
                occupiedRes,
                occupiedReg,
                totalOccupied: row.total_occupied_room,
                outOfOrder,
                outOfService,
                vacant: calculatedVacant
            };
        });

        return NextResponse.json({
            data: mergedData,
            meta: {
                totalRooms,
                vacantRooms, // Current vacant (not historical) - not used in per-row calculation in legacy (Line 284 uses total_room - occupied)
                outOfOrder,
                outOfService
            }
        });

    } catch (error: any) {
        console.error('Control Chart API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
