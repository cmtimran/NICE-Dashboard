import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const today = new Date().toISOString().split('T')[0];
        const dateStr = searchParams.get('date') || today;

        // Calculate Month Start
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const monthStart = `${year}-${month}-01`;

        // --- 1. DAILY COLLECTION ---
        const collectionSql = `SELECT isnull(sum(cheque),0) as chequetotal, isnull(sum(cash),0) as cashtotal, isnull(sum([Card]),0) as cardtotal, isnull(sum(Com),0) as Comtotal, isnull(sum(bKash),0) as bKashtotal From vwDailyCollection WHERE payment not in ( 'Adjustment') and ([date] BETWEEN '${dateStr}' AND '${dateStr}')`;

        // --- 2. REVENUE (Today & MTD) ---
        // We will define helper functions to construct the massive batches of queries

        const getRevenueQueries = (start: string, end: string) => {
            return [
                // Room
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SR001', 'SN001') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`,
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SM003', 'DM003') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Extrabed
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('DR001','DM003','DN001') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Adjustment

                // F&B
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from vwAllSalesTips where scode in('SBA01', 'SDA01', 'SLA01', 'SSA01', 'SLA02', 'SDA02') and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Restaurant
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from vwAllSalesTips_B where scode in('SBA02','SLA02','SDA02','SSA02') and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Room Service
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from vwAllSalesTips where scode in('SBA04','SLA04','SDA04','SSA04') and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Outside
                `select isnull(sum(amount), 0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from tblfun_dtl_dtl where BanCon In('BAN','VIP','CNV') and itemtype in('FOOD','BEVERAGE') and credittype not in('Complimentary','VOID','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Banquet F&B
                `select isnull(sum(amount), 0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from tblfun_dtl_dtl where BanCon In('CON','BIG','HLP','MTL','SML') and itemtype in('FOOD','BEVERAGE') and credittype not in('Complimentary','VOID','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Conf F&B
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in ('DRS01','DRS02','DTA01','DRS04','DBQ01','DCN01','DJS05','DBR01','DJS05') and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // F&B Adj

                // Hall & Equip
                `select isnull(sum(Amount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from tblfun_dtl_dtl where itemtype='BANQUET HALL' and credittype not in('Complimentary','VOID') and (date BETWEEN '${start}' AND '${end}')`,
                `select isnull(sum(Amount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from tblfun_dtl_dtl where itemtype='CONFERENCE HALL' and credittype not in('Complimentary','VOID') and (date BETWEEN '${start}' AND '${end}')`,
                `select isnull(sum(Amount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from tblfun_dtl_dtl where itemtype='EQUIPEMENT' and credittype not in('Complimentary','VOID') and (date BETWEEN '${start}' AND '${end}')`,
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in ('DC001','DJC01', 'DJS01') and roomno not in('2000') and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Adj

                // HK (Laundry/Minibar)
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from S1 where scode in('SL002') and (date BETWEEN '${start}' AND '${end}')`, // Laundry
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode='DL002' and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Laundry Adj
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from S1 where scode ='SM001' and (date BETWEEN '${start}' AND '${end}')`, // Minibar
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode='DM001' and payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // Minibar Adj

                // Others
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SR002', 'DR02') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Transport
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SP001','SP002','SP003', 'DP001') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Telephone
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('BC001', 'DBC01') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Business Center
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('JSS06', 'DJS06') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Driver
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('JSS13', 'JDS13') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Health Club
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SSW01') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Pool
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from vwAllSalesSPA where payment not in('Complimentary','Void','House Use','Entertainment') and (date BETWEEN '${start}' AND '${end}')`, // SPA
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('JSS03', 'JDS03') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Gift Shop
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('STK01', 'DTK01') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Ticketing
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('SM002') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Misc
                `select isnull(sum(ammount),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('JSS08') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Damage
                `select isnull(sum(credit),0) as val, isnull(sum(service),0) as svc, isnull(sum(tax),0) as tax from s1 where scode in('DBC01','DJS06','DJS04','DJS01','DJS03','DJS13','DM002', 'DP001', 'DJS04', 'DSW01', 'DR002', 'DJS08') and roomno not in('2000') and (date BETWEEN '${start}' AND '${end}')`, // Others Adj
            ];
        };

        const calculateGrandTotal = (results: any[]) => {
            let total = 0;

            // Helper to get total from a row (val + svc + tax)
            const getSum = (idx: number) => {
                if (!results[idx] || !results[idx].recordset[0]) return 0;
                const r = results[idx].recordset[0];
                return (r.val || 0) + (r.svc || 0) + (r.tax || 0);
            };

            // Room
            const room = getSum(0) + getSum(1) - getSum(2);

            // F&B
            const fnb = (getSum(3) + getSum(4) + getSum(5) + getSum(6) + getSum(7)) - getSum(8);

            // Hall
            const hall = (getSum(9) + getSum(10) + getSum(11)) - getSum(12);

            // HK
            const hk = (getSum(13) + getSum(15)) - (getSum(14) + getSum(16)); // (Lan + Mini) - (LanAdj + MiniAdj)

            // Others
            const others = (getSum(17) + getSum(18) + getSum(19) + getSum(20) + getSum(21) + getSum(22) + getSum(23) + getSum(24) + getSum(25) + getSum(26) + getSum(27)) - getSum(28);

            return room + fnb + hall + hk + others;
        };

        const todayQueries = getRevenueQueries(dateStr, dateStr);
        const mtdQueries = getRevenueQueries(monthStart, dateStr);

        const [collectionRes, ...allRevenueRes] = await Promise.all([
            query(collectionSql),
            ...todayQueries.map(q => query(q)),
            ...mtdQueries.map(q => query(q))
        ]);

        // Process Collection
        const colRow = collectionRes.recordset[0];
        const dailyCollection = colRow ?
            (colRow.chequetotal + colRow.cashtotal + colRow.cardtotal + colRow.Comtotal + colRow.bKashtotal) : 0;

        // Split results
        const todayResults = allRevenueRes.slice(0, 29);
        const mtdResults = allRevenueRes.slice(29, 58);

        const todayRevenue = calculateGrandTotal(todayResults);
        const mtdRevenue = calculateGrandTotal(mtdResults);

        return NextResponse.json({
            dailyCollection,
            todayRevenue,
            mtdRevenue,
            monthlyTarget: 5000000
        });

    } catch (error: any) {
        console.error('Revenue API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
