import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer'; // Requires installation

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, subject, data } = body;

        // Mock Email Sending since we cannot install packages without permission and don't have SMTP credentials
        // In a real scenario:
        /*
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true', 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: 'system@hotel.com',
            to: email,
            subject: subject,
            text: JSON.stringify(data, null, 2), // Or generate HTML/PDF
        });
        */

        console.log(`[Mock Email] Sending to: ${email}, Subject: ${subject}`);

        // Improve simulation
        await new Promise(resolve => setTimeout(resolve, 1500));

        return NextResponse.json({ success: true, message: 'Email queued successfully (Mock)' });
    } catch (error: any) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
