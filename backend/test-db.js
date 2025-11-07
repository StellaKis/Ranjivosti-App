import pkg from "pg";
import dotenv from "dotenv";


dotenv.config();
const { Pool } = pkg;


const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('Connected OK, now=', r.rows[0].now);
  } catch (err) {
    console.error('DB connection error:', err.message);
  } finally {
    await pool.end();
  }
}
test();
