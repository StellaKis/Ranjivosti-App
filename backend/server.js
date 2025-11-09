import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import session from "express-session";
import crypto from "crypto";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  origin: 'https://ranjivosti-app-frontend.onrender.com',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24*60*60*1000 // 1 dan
  }
}));

let vulnCSRF = false;  

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

app.post('/vuln/csrf', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') return res.status(400).json({ success: false, error: 'enabled boolean required' });
  if (enabled){
    vulnCSRF = true;
  }
  else {
    vulnCSRF = false;
  }
  return res.json({ success: true, vulnCSRF });
});

app.post('/login', async (req, res) => {
  const { username = '', password = '' } = req.body;
  console.log(username);
  try {
    const q = 'SELECT id, username, password, address FROM users WHERE username=$1 LIMIT 1';
    const r = await pool.query(q, [username]);
    const user = r.rows[0];
    if (!user || user.password !== password) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    // CSFR token
    const token = crypto.randomBytes(16).toString('hex');
    req.session.csrfToken = token;

    return res.json({ success: true, user: { id: user.id, username: user.username, address: user.address}, csrfToken: token });
  } catch (err) {
    console.error('/login error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/user', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const q = 'SELECT id, username, address FROM users WHERE id=$1 LIMIT 1';
    const r = await pool.query(q, [req.session.userId]);
    return res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error('/user error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/change-address', async (req, res) => {
    const { address = ''} = req.body;
    console.log('Change address to:', address);

  if (!req.session.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

  //usporedba sa CSRF tokenom
  if (!vulnCSRF) {
    const headerToken = req.get('x-csrf-token') || req.body._csrf;
    if (!headerToken || headerToken !== req.session.csrfToken) {
      return res.status(403).json({ success: false, message: 'CSRF token missing or invalid' });
    }
  }

  try {
    await pool.query('UPDATE users SET address=$1 WHERE id=$2', [address, req.session.userId]);
    return res.json({ success: true, newAddress: address });
  } catch (err) {
    console.error('/change-address error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/change-address', async (req, res) => {
  const address = typeof req.query.address === 'string' ? req.query.address : '';


    // usporedba sa CSRF tokenom 
  if (!vulnCSRF) {
    const headerToken = req.get('x-csrf-token');
    const queryToken = req.query._csrf; 
    const token = headerToken || queryToken;

    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ success: false, message: 'CSRF token missing or invalid' });
    }
  }


  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    await pool.query('UPDATE users SET address=$1 WHERE id=$2', [address, req.session.userId]);
    return res.json({ success: true, newAddress: address });
  } catch (err) {
    console.error('/change-address error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

const PORT =  4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
