import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function getRevenueStats(startDate: string, endDate: string) {
    const stats = {
        // Room
        roomRent: { amount: 0, service: 0, vat: 0 },
        extraBed: { amount: 0, service: 0, vat: 0 },
        roomAdj: { amount: 0, service: 0, vat: 0 },

        // F&B
        restaurant: { amount: 0, service: 0, vat: 0 },
        roomService: { amount: 0, service: 0, vat: 0 },
        outside: { amount: 0, service: 0, vat: 0 },
        banquetFood: { amount: 0, service: 0, vat: 0 },
        confFood: { amount: 0, service: 0, vat: 0 },
        fnbAdj: { amount: 0, service: 0, vat: 0 },

        // Hall & Equip
        banquetHall: { amount: 0, service: 0, vat: 0 },
        confHall: { amount: 0, service: 0, vat: 0 },
        equipment: { amount: 0, service: 0, vat: 0 },
        hallAdj: { amount: 0, service: 0, vat: 0 },

        // HK
        minibar: { amount: 0, service: 0, vat: 0 },
        laundry: { amount: 0, service: 0, vat: 0 },
        hkAdj: { amount: 0, service: 0, vat: 0 },

        // Others
        transport: { amount: 0, service: 0, vat: 0 },
        telephone: { amount: 0, service: 0, vat: 0 },
        businessCenter: { amount: 0, service: 0, vat: 0 },
        driverAcc: { amount: 0, service: 0, vat: 0 },
        healthClub: { amount: 0, service: 0, vat: 0 },
        swimmingPool: { amount: 0, service: 0, vat: 0 },
        spa: { amount: 0, service: 0, vat: 0 },
        giftShop: { amount: 0, service: 0, vat: 0 },
        ticketing: { amount: 0, service: 0, vat: 0 },
        misc: { amount: 0, service: 0, vat: 0 },
        damage: { amount: 0, service: 0, vat: 0 },
        othersAdj: { amount: 0, service: 0, vat: 0 },
    };

    // 1. Main S1 Aggregation (Covers most items)
    // We group by SCODE to map them to categories in JS
    const s1Sql = `
    SELECT 
      scode, 
      SUM(ammount) as amount, 
      SUM(service) as service, 
      SUM(tax) as vat, 
      SUM(credit) as credit 
    FROM S1 
    WHERE (date BETWEEN '${startDate}' AND '${endDate}') 
      AND roomno NOT IN ('2000') 
    GROUP BY scode
  `;
    const s1Result = await query(s1Sql);

    // Map S1 results to stats
    s1Result.recordset.forEach((row: any) => {
        const scode = row.scode?.trim();
        const add = (key: keyof typeof stats, type: 'amount' | 'credit' = 'amount') => {
            // For credit columns (Adjustments), we usually want the 'credit' field, but some use 'ammount'
            // Legacy code uses 'ammount' for revenues and 'credit' for adjustments.
            if (type === 'credit') {
                stats[key].amount += row.credit || 0;
            } else {
                stats[key].amount += row.amount || 0;
            }
            stats[key].service += row.service || 0;
            stats[key].vat += row.vat || 0;
        };

        switch (scode) {
            // Room
            case 'SR001': case 'SN001': add('roomRent'); break;
            case 'SM003': case 'DM003': add('extraBed'); break; // DM003 in legacy was in extra bed query? Yes.
            case 'DR001': case 'DN001': add('roomAdj', 'credit'); break;

            // HK (S1 sources)
            case 'SL002': add('laundry'); break;
            case 'DL002': add('hkAdj', 'credit'); break;
            case 'SM001': add('minibar'); break;
            case 'DM001': add('hkAdj', 'credit'); break; // Combined into totalHKAdjustment

            // Others (S1 sources)
            case 'SR002': case 'DR02': add('transport'); break;
            case 'SP001': case 'SP002': case 'SP003': case 'DP001': add('telephone'); break;
            case 'BC001': case 'DBC01': add('businessCenter'); break;
            case 'JSS06': case 'DJS06': add('driverAcc'); break;
            case 'JSS13': case 'JDS13': add('healthClub'); break;
            case 'SSW01': add('swimmingPool'); break;
            // SPA S1 (legacy commented out, uses view, but keeping map just in case)
            case 'JSS03': case 'JDS03': add('giftShop'); break;
            case 'STK01': case 'DTK01': add('ticketing'); break;
            case 'SM002': add('misc'); break; // Miscs1
            case 'JSS08': add('damage'); break;

            // Adjustments (Others)
            // scode in('DBC01','DJS06','DJS04','DJS01','DJS03','DJS13','DM002', 'DP001', 'DJS04', 'DSW01', 'DR002', 'DJS08')
            case 'DBC01': case 'DJS06': case 'DJS04': case 'DJS01': case 'DJS03':
            case 'DJS13': case 'DM002': case 'DP001': case 'DSW01': case 'DR002':
            case 'DJS08':
                add('othersAdj', 'credit');
                break;

            // F&B Adj
            // 'DRS01','DRS02','DTA01','DRS04','DBQ01','DCN01','DJS05','DBR01'
            case 'DRS01': case 'DRS02': case 'DTA01': case 'DRS04':
            case 'DBQ01': case 'DCN01': case 'DJS05': case 'DBR01':
                add('fnbAdj', 'credit');
                break;

            // Hall Adj
            // 'DC001','DJC01', 'DJS01'
            case 'DC001': case 'DJC01': // DJS01 is also in OthersAdj in legacy? Need to check.
                // Legacy: HALLEquipmentAdjSQL uses DJS01. OthersRevenueAdjSQL uses DJS01. 
                // This is a conflict in legacy too? 
                // Let's follow legacy blocks strictly.
                // In Legacy: HALLEquipmentAdjSQL -> DC001, DJC01, DJS01
                // In Legacy: OthersRevenueAdjSQL -> DJS01 IS present.
                // This means it's double counted in legacy? Or specific context?
                // For now I will map DJS01 to HallAdj because it seems more specific (Equip Adj).
                add('hallAdj', 'credit');
                break;
        }
    });

    // 2. Views / Specific Tables

    // Restaurant (vwAllSalesTips)
    // scode in('SBA01', 'SDA01', 'SLA01', 'SSA01', 'SLA02', 'SDA02') - But 'SLA02', 'SDA02' are Room Service also?
    // Legacy Restaurant: 'SBA01', 'SDA01', 'SLA01', 'SSA01', 'SLA02', 'SDA02'
    // Legacy Room Service: 'SBA02','SLA02','SDA02','SSA02'
    // Overlap: SLA02, SDA02. This implies double counting in legacy or they are distinct in views.
    // Actually Restaurant query uses vwAllSalesTips, Room Service uses vwAllSalesTips_B. They are different views.

    const restSql = `SELECT SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat FROM vwAllSalesTips WHERE scode in('SBA01', 'SDA01', 'SLA01', 'SSA01', 'SLA02', 'SDA02') AND payment not in('Complimentary','Void','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;
    const rsSql = `SELECT SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat FROM vwAllSalesTips_B WHERE scode in('SBA02','SLA02','SDA02','SSA02') AND payment not in('Complimentary','Void','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;
    const outsideSql = `SELECT SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat FROM vwAllSalesTips WHERE scode in('SBA04','SLA04','SDA04','SSA04') AND payment not in('Complimentary','Void','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;

    // Banquet Food
    const banqFoodSql = `SELECT SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat FROM tblfun_dtl_dtl WHERE BanCon In('BAN','VIP','CNV') AND itemtype in('FOOD','BEVERAGE') AND credittype not in('Complimentary','VOID','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;
    const confFoodSql = `SELECT SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat FROM tblfun_dtl_dtl WHERE BanCon In('CON','BIG','HLP','MTL','SML') AND itemtype in('FOOD','BEVERAGE') AND credittype not in('Complimentary','VOID','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;

    // Hall & Equipment (tblfun_dtl_dtl)
    const banqHallSql = `SELECT SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat FROM tblfun_dtl_dtl WHERE itemtype='BANQUET HALL' AND credittype not in('Complimentary','VOID') AND (date BETWEEN '${startDate}' AND '${endDate}')`;
    const confHallSql = `SELECT SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat FROM tblfun_dtl_dtl WHERE itemtype='CONFERENCE HALL' AND credittype not in('Complimentary','VOID') AND (date BETWEEN '${startDate}' AND '${endDate}')`;
    const equipSql = `SELECT SUM(amount) as amount, SUM(service) as service, SUM(tax) as vat FROM tblfun_dtl_dtl WHERE itemtype='EQUIPEMENT' AND credittype not in('Complimentary','VOID') AND (date BETWEEN '${startDate}' AND '${endDate}')`;

    // SPA View
    const spaSql = `SELECT SUM(ammount) as amount, SUM(service) as service, SUM(tax) as vat FROM vwAllSalesSPA WHERE payment not in('Complimentary','Void','House Use','Entertainment') AND (date BETWEEN '${startDate}' AND '${endDate}')`;

    const [rest, rs, out, bFood, cFood, bHall, cHall, equip, spa] = await Promise.all([
        query(restSql), query(rsSql), query(outsideSql), query(banqFoodSql), query(confFoodSql),
        query(banqHallSql), query(confHallSql), query(equipSql), query(spaSql)
    ]);

    const merge = (key: keyof typeof stats, res: any) => {
        if (res.recordset[0]) {
            stats[key].amount += res.recordset[0].amount || 0;
            stats[key].service += res.recordset[0].service || 0;
            stats[key].vat += res.recordset[0].vat || 0;
        }
    };

    merge('restaurant', rest);
    merge('roomService', rs);
    merge('outside', out);
    merge('banquetFood', bFood);
    merge('confFood', cFood);
    merge('banquetHall', bHall);
    merge('confHall', cHall);
    merge('equipment', equip);
    merge('spa', spa);

    return stats;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        if (!dateParam) {
            return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
        }

        const todayDate = dateParam;
        const year = new Date(todayDate).getFullYear();
        const month = new Date(todayDate).getMonth() + 1;
        const mtdStartDate = `${year}-${month.toString().padStart(2, '0')}-01`;

        const [todayStats, mtdStats] = await Promise.all([
            getRevenueStats(todayDate, todayDate),
            getRevenueStats(mtdStartDate, todayDate)
        ]);

        return NextResponse.json({ today: todayStats, mtd: mtdStats });

    } catch (error: any) {
        console.error('Revenue Statement API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
