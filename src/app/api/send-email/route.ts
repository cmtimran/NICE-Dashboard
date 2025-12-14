import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, subject, data } = body;

        // Check if SMTP credentials are configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            // Construct email content
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4f46e5;">${subject}</h2>
                    <p>Dear Manager,</p>
                    <p>Please find the attached revenue statement summary below.</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <pre style="white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                    <p>Best regards,<br/><strong>Dashboard System</strong></p>
                </div>
            `;

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: subject,
                html: htmlContent,
            });

            console.log(`[Real Email] Sent to: ${email}`);
            return NextResponse.json({ success: true, message: 'Email sent successfully' });

        } else {
            // Mock Email Sending fallback
            console.log(`[Mock Email] (Missing Credentials) Sending to: ${email}, Subject: ${subject}`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({ success: true, message: 'Email queued successfully (Mock Mode - Configure SMTP to send real emails)' });
        }

    } catch (error: any) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 });
    }
}
