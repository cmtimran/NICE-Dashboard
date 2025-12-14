// @ts-ignore
import sql from 'mssql';

const config: sql.config = {
    user: process.env.DB_USER || 'NICE',
    password: process.env.DB_PASSWORD || '#NIniAll@h#r@sulceCE!',
    server: process.env.DB_SERVER || '103.191.178.238',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE || 'KHRLINT',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

console.log('DB Config Loaded (Masked):', {
    ...config,
    password: config.password ? '****' : 'MISSING'
});

// Singleton connection pool
let pool: sql.ConnectionPool | null = null;

export const getPool = async () => {
    if (pool) return pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to MSSQL');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

export async function query(q: string) {
    const p = await getPool();
    return p.request().query(q);
}
