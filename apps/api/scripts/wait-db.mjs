import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL||process.env.DATABASE_URL,connectionTimeoutMillis:1500});
let connected=false;
for(let attempt=0;attempt<25;attempt++){
  try{await pool.query('SELECT 1');connected=true;break;}
  catch{await new Promise(resolve=>setTimeout(resolve,800));}
}
await pool.end();
if(!connected){console.error('PostgreSQL não ficou disponível.');process.exit(1);}
console.log('PostgreSQL disponível.');
