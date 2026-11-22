import pg from 'pg';
import { readFile } from 'node:fs/promises';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try { const sql=await readFile(new URL('../sql/001_init.sql',import.meta.url),'utf8');await pool.query(sql);console.log('Schema aplicado.');} finally {await pool.end();}
