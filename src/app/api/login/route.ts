import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { propertyId, userId, password } = await request.json();

        // Verify Property Code from config (or hardcoded as per legacy)
        const propertyCode = 'KhairulInternational';
        if (propertyId !== propertyCode) {
            return NextResponse.json({ error: 'Property ID does not match!' }, { status: 401 });
        }

        // Query User credentials
        const sql = `Select * from tbluserNICE where user_id='${userId}' and password='${password}'`;
        const result = await query(sql);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            return NextResponse.json({
                success: true,
                user: {
                    id: user.user_id,
                    name: user.user_name,
                    role: user.status
                }
            });
        } else {
            return NextResponse.json({ error: 'User ID or Password does not match!' }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }
}
