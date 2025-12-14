import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                CASE 
                    WHEN Birth IS NULL THEN 'Unknown'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) < 18 THEN 'Under 18'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 18 AND 29 THEN '18-29'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 30 AND 39 THEN '30-39'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 40 AND 49 THEN '40-49'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 50 AND 59 THEN '50-59'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) >= 60 THEN '60+'
                    ELSE 'Unknown'
                END as ageGroup,
                COUNT(*) as value
            FROM KHRLINT.dbo.[Master]
            WHERE Gust = 1
            GROUP BY 
                CASE 
                    WHEN Birth IS NULL THEN 'Unknown'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) < 18 THEN 'Under 18'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 18 AND 29 THEN '18-29'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 30 AND 39 THEN '30-39'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 40 AND 49 THEN '40-49'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) BETWEEN 50 AND 59 THEN '50-59'
                    WHEN DATEDIFF(year, CAST(Birth as DATE), GETDATE()) >= 60 THEN '60+'
                    ELSE 'Unknown'
                END
        `);

        // Sort roughly by age
        const order = { 'Under 18': 1, '18-29': 2, '30-39': 3, '40-49': 4, '50-59': 5, '60+': 6, 'Unknown': 7 };
        const sorted = result.recordset.sort((a: any, b: any) => (order[a.ageGroup as keyof typeof order] || 99) - (order[b.ageGroup as keyof typeof order] || 99));

        return NextResponse.json(sorted);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
