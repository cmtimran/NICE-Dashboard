const sql = require('mssql');

const config = {
    user: 'NICE',
    password: '#NIniAll@h#r@sulceCE!',
    server: '103.191.178.238',
    port: 1433,
    database: 'KHRLINT',
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
