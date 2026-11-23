import pg from 'pg';
export function createPool(connectionString = process.env.DATABASE_URL) {
    if (!connectionString)
        throw new Error('DATABASE_URL não configurada');
    return new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000 });
}
export async function transaction(pool, work) {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const data = await work(db);
        await db.query('COMMIT');
        return data;
    }
    catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
    finally {
        db.release();
    }
}
export const first = async (db, sql, params = []) => (await db.query(sql, params)).rows[0];
