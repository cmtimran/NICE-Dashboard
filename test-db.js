const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        // instanceName: 'NICOF_BA' // Removed instance name to force direct port connection
    },
};

async function testConnection() {
    console.log('Testing connection to 103.191.178.238:1433...');
    try {
        await sql.connect(config);
        console.log('Connected successfully to MSSQL!');
        const result = await sql.query`SELECT 1 as val`;
        console.log('Test query result:', result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

testConnection();
