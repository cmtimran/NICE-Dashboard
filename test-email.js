const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('Testing Email Sending...');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: 'imran527166@gmail.com', // Updated recipient
            subject: 'Test Email from Local Dashboard',
            text: 'This is a test email to verify SMTP configuration.',
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
