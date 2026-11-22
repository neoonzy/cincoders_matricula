import {createPool} from './db.mjs';
import {createApp} from './app.mjs';
const pool=createPool();
const app=createApp(pool,{logger:true});
const host=process.env.HOST||'127.0.0.1';
const port=Number(process.env.PORT)||3333;
const shutdown=async()=>{await app.close();await pool.end();process.exit(0);};
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
try{await app.listen({host,port});}catch(error){app.log.error(error);await pool.end();process.exit(1);}
