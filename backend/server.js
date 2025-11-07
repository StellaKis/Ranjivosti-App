import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import bodyParser from 'body-parser';

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());


const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// async function initDb() {
//   await pool.query(`
//     CREATE TABLE IF NOT EXISTS users (
//       id SERIAL PRIMARY KEY,
//       username TEXT UNIQUE NOT NULL,
//       password TEXT NOT NULL,
//       email TEXT
//     )
//   `);

//   // Insert sample users if not present
//   const res = await pool.query("SELECT COUNT(*) AS c FROM users");
//   const c = parseInt(res.rows[0].c, 10);
//   if (c === 0) {
//     await pool.query(
//       "INSERT INTO users (username, password, email) VALUES ($1,$2,$3), ($4,$5,$6)",
//       ['alice', 'secret123', 'alice@example.com', 'bob', 'hunter2', 'bob@example.com']
//     );
//     console.log('Seeded users: alice, bob');
//   }
// }

// initDb().catch(err => {
//   console.error('DB init error:', err);
//   process.exit(1);
// });

// // Utility to run a single-row SELECT
// async function runSingle(sql, params = []) {
//   const r = await pool.query(sql, params);
//   return r.rows[0] || null;
// }


// body: { username, password, vuln } -- vuln: boolean (true = vulnerable)
app.post('/login', async (req, res) => {
  const { username = '', password = '', vuln = false } = req.body;

  try {
    if (vuln) {
      const unsafeSql = `SELECT username, address FROM users WHERE username = '${username}' AND password = '${password}'`;
      console.log('[VULN SQL]', unsafeSql);
      const result = await pool.query(unsafeSql);
      const row = result.rows || null;
    //   if (row) {
    //     res.json({ success: true, user: row, note: 'Logged in (vulnerable path)', executed: unsafeSql });
    //   } else {
    //     res.json({ success: false, user: null, note: 'Invalid credentials (vulnerable path)', executed: unsafeSql });
    //   }
     if (row) {
        res.json({ rezultat: row});
      } else {
        res.json({ rezultat: null});
      }
    } else {
      const safeSql = `SELECT username, address FROM users WHERE username = $1 AND password = $2`;
      console.log('[SAFE SQL]', safeSql, 'params=', [username, password]);
      const result = await pool.query(safeSql, [username, password]);
      const row = result.rows || null;
    //   if (row) {
    //     res.json({ success: true, user: row, note: 'Logged in (safe path)' });
    //   } else {
    //     res.json({ success: false, user: null, note: 'Invalid credentials (safe path)' });
    //   }
        if (row) {
            res.json({ rezultat: row });
        } else {
            res.json({ rezultat: null});
        }
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// GET /users  -> show users list (demo visibility)
// app.get('/users', async (req, res) => {
//   try {
//     const r = await pool.query('SELECT id, username, email FROM users ORDER BY id');
//     res.json({ users: r.rows });
//   } catch (err) {
//     res.status(500).json({ error: String(err) });
//   }
// });

const PORT =  4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
