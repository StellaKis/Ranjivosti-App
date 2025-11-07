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

app.post('/getaddress', async (req, res) => {
  const { username = '', password = '', vuln = false } = req.body;

  try {
    if (vuln) {
      const unsafeSql = `SELECT username, address FROM users WHERE username = '${username}' AND password = '${password}'`;
      console.log('[VULN SQL]', unsafeSql);
      const result = await pool.query(unsafeSql);
      const row = result.rows || null;

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

const PORT =  4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
