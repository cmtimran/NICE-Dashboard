import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '15', 10);

        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - days);

        const startDate = pastDate.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        // Helper to format date keys
        const getDateKey = (d: any) => {
            if (!d) return null;
            // Handle mostly standardized Date objects from MSSQL driver
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return null; // Invalid date
            return dt.toISOString().split('T')[0];
        };

        // Initialize daily map
        const dailyData: Record<string, {
            roomRevenue: number,
            fnbRevenue: number,
            otherRevenue: number,
            occupiedRooms: number,
            totalRooms: number
        }> = {};

        // Fill dates
        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            dailyData[d.toISOString().split('T')[0]] = {
                roomRevenue: 0,
                fnbRevenue: 0,
                otherRevenue: 0,
                occupiedRooms: 0,
                totalRooms: 0
            };
        }

        // --- REVENUE DATA ---
        // 1. S1 (Room, HK, Others)
        const s1Sql = `
      SELECT CONVERT(varchar, date, 23) as dateStr, scode, SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat, SUM(credit) as credit
      FROM S1 
      WHERE (date BETWEEN '${startDate}' AND '${endDate}') AND roomno NOT IN ('2000') 
      GROUP BY CONVERT(varchar, date, 23), scode
    `;
        const s1Res = await query(s1Sql);
        s1Res.recordset.forEach((row: any) => {
            const dateKey = row.dateStr;
            if (!dailyData.hasOwnProperty(dateKey)) return;

            const scode = row.scode?.trim();
            const total = (row.amount || 0) + (row.service || 0) + (row.vat || 0);
            const creditTotal = (row.credit || 0) + (row.service || 0) + (row.vat || 0);

            if (['SR001', 'SN001', 'SM003', 'DM003'].includes(scode)) dailyData[dateKey].roomRevenue += total;
            if (['DR001', 'DN001'].includes(scode)) dailyData[dateKey].roomRevenue -= creditTotal;

            if (['SL002', 'SM001'].includes(scode)) dailyData[dateKey].otherRevenue += total;
            if (['DL002', 'DM001'].includes(scode)) dailyData[dateKey].otherRevenue -= creditTotal;

            if (['SR002', 'DR02', 'SP001', 'SP002', 'SP003', 'DP001', 'BC001', 'DBC01', 'JSS06', 'DJS06', 'JSS13', 'JDS13', 'SSW01', 'JSS03', 'JDS03', 'STK01', 'DTK01', 'SM002', 'JSS08'].includes(scode)) {
                dailyData[dateKey].otherRevenue += total;
            }
            if (['DBC01', 'DJS06', 'DJS04', 'DJS01', 'DJS03', 'DJS13', 'DM002', 'DP001', 'DJS04', 'DSW01', 'DR002', 'DJS08'].includes(scode)) {
                dailyData[dateKey].otherRevenue -= creditTotal;
            }

            // F&B Adj
            if (['DRS01', 'DRS02', 'DTA01', 'DRS04', 'DBQ01', 'DCN01', 'DJS05', 'DBR01'].includes(scode)) {
                dailyData[dateKey].fnbRevenue -= creditTotal;
            }
            // Hall Adj -> Other
            if (['DC001', 'DJC01'].includes(scode)) {
                dailyData[dateKey].otherRevenue -= creditTotal;
            }
        });

        // 2. F&B (vwAllSalesTips, vwAllSalesTips_B)
        const tipsSql = `
        SELECT CONVERT(varchar, date, 23) as dateStr, SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat 
        FROM vwAllSalesTips 
        WHERE scode in('SBA01', 'SDA01', 'SLA01', 'SSA01', 'SLA02', 'SDA02', 'SBA04','SLA04','SDA04','SSA04') 
          AND payment not in('Complimentary','Void','House Use','Entertainment') 
          AND (date BETWEEN '${startDate}' AND '${endDate}') 
        GROUP BY CONVERT(varchar, date, 23)
    `;
        const tipsB_Sql = `
        SELECT CONVERT(varchar, date, 23) as dateStr, SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat 
        FROM vwAllSalesTips_B 
        WHERE scode in('SBA02','SLA02','SDA02','SSA02') 
          AND payment not in('Complimentary','Void','House Use','Entertainment') 
          AND (date BETWEEN '${startDate}' AND '${endDate}') 
        GROUP BY CONVERT(varchar, date, 23)
    `;

        // 3. Banquet/Hall (tblfun_dtl_dtl)
        const funSql = `
        SELECT CONVERT(varchar, date, 23) as dateStr, itemtype, BanCon, SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat 
        FROM tblfun_dtl_dtl 
        WHERE credittype not in('Complimentary','VOID','House Use','Entertainment') 
          AND (date BETWEEN '${startDate}' AND '${endDate}') 
        GROUP BY CONVERT(varchar, date, 23), itemtype, BanCon
    `;

        // 4. SPA (vwAllSalesSPA) -> Other
        const spaSql = `
        SELECT CONVERT(varchar, date, 23) as dateStr, SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat 
        FROM vwAllSalesSPA 
        WHERE payment not in('Complimentary','Void','House Use','Entertainment') 
          AND (date BETWEEN '${startDate}' AND '${endDate}') 
        GROUP BY CONVERT(varchar, date, 23)
    `;

        const [tipsRes, tipsBRes, funRes, spaRes] = await Promise.all([
            query(tipsSql), query(tipsB_Sql), query(funSql), query(spaSql)
        ]);

        [...tipsRes.recordset, ...tipsBRes.recordset].forEach((row: any) => {
            const k = row.dateStr;
            if (k && dailyData[k]) dailyData[k].fnbRevenue += (row.amount || 0) + (row.service || 0) + (row.vat || 0);
        });

        funRes.recordset.forEach((row: any) => {
            const k = row.dateStr;
            if (k && dailyData[k]) {
                const total = (row.amount || 0) + (row.service || 0) + (row.vat || 0);

                const banCon = row.BanCon?.trim() || '';
                const itemType = row.itemtype?.trim() || '';

                const isBanqFood = ['BAN', 'VIP', 'CNV'].includes(banCon) && ['FOOD', 'BEVERAGE'].includes(itemType);
                const isConfFood = ['CON', 'BIG', 'HLP', 'MTL', 'SML'].includes(banCon) && ['FOOD', 'BEVERAGE'].includes(itemType);

                if (isBanqFood || isConfFood) {
                    dailyData[k].fnbRevenue += total;
                } else {
                    dailyData[k].otherRevenue += total;
                }
            }
        });

        spaRes.recordset.forEach((row: any) => {
            const k = row.dateStr;
            if (k && dailyData[k]) dailyData[k].otherRevenue += (row.amount || 0) + (row.service || 0) + (row.vat || 0);
        });

        // --- OCCUPANCY DATA ---
        const roomCountSql = `SELECT COUNT(Room_No) as total_room FROM Rlist WHERE Room_Type NOT IN ('FOLIO')`;
        const roomCountRes = await query(roomCountSql);
        const totalRooms = roomCountRes.recordset[0]?.total_room || 0;

        const occSql = `SELECT CONVERT(varchar, date, 23) as dateStr, COUNT(roomtype) AS occupied_rooms FROM tblRoomControlNICE WHERE ([date] BETWEEN '${startDate}' AND '${endDate}') GROUP BY CONVERT(varchar, date, 23)`;
        const occRes = await query(occSql);

        occRes.recordset.forEach((row: any) => {
            const k = row.dateStr;
            if (k && dailyData[k]) {
                dailyData[k].occupiedRooms = row.occupied_rooms;
                dailyData[k].totalRooms = totalRooms;
            }
        });

        // Format
        const chartData = Object.entries(dailyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, d]) => ({
                date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                fullDate: date,
                revenue: Math.round(d.roomRevenue + d.fnbRevenue + d.otherRevenue),
                roomRevenue: Math.round(d.roomRevenue),
                fnbRevenue: Math.round(d.fnbRevenue),
                otherRevenue: Math.round(d.otherRevenue),
                occupiedRooms: d.occupiedRooms,
                adr: d.occupiedRooms > 0 ? Math.round(d.roomRevenue / d.occupiedRooms) : 0
            }));

        return NextResponse.json({ data: chartData });

    } catch (error: any) {
        console.error('Revenue Trend API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
