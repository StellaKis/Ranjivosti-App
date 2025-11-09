import React, { useState, useEffect } from 'react';

function App() {
  // SQL Injection
  const [vuln, setVuln] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState('');

  // CSRF
  const [vulnCSRF, setVulnCSRF] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function handleGetAddress(e) {
    e && e.preventDefault();
    try {
      const r = await fetch(`https://ranjivosti-app-backend.onrender.com/getaddress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, vuln })
      });
      const text = await r.text();
      console.log('Raw response:', text); 
      setResponse(text); 
    } catch (err) {

      console.error('Login error:', err.message);
      setResponse('Error: ' + err.message);
    }
  }

  async function onToggleCsrf(e) {
    const enabled = e.target.checked;
    // setVulnCSRF(enabled);
    try {
      const r = await fetch(`https://ranjivosti-app-backend.onrender.com/vuln/csrf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const j = await r.json();
      console.log('CSRF vuln toggle response:', j);
      if (j.success) setVulnCSRF(j.vulnCSRF);
    } catch (err) {
      console.error('Error toggling CSRF vuln', err);
    }
  }

  async function handleLogin(e) {
    e && e.preventDefault();
    // setCsrfMsg('');
    try {
      const r = await fetch(`https://ranjivosti-app-backend.onrender.com/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const j = await r.json();
      if (j.success) {
        setUser(j.user);
        setCsrfToken(j.csrfToken);
      } else {
        alert(j.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  }

  async function handleLogout() {
    try {
      const r = await fetch(`https://ranjivosti-app-backend.onrender.com/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      const j = await r.json();
      if (j.success) {
        setUser(null);
        // setCsrfMsg('Logged out');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUser() {
    try {
      const r = await fetch(`https://ranjivosti-app-backend.onrender.com/user`, { credentials: 'include' });
      if (r.ok) {
        const j = await r.json();
        if (j.success) {
          setUser(j.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setUser(null);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>SQL Injection — tautologija</h1>

      <label style={{ display: 'block', marginBottom: 12 }}>
        <input type="checkbox" checked={vuln} onChange={e => setVuln(e.target.checked)} />
        {' '}Ranjivost uključena
      </label>

      <form onSubmit={handleGetAddress} style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Username:{' '}
            <input value={username} onChange={e => setUsername(e.target.value)} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Password:{' '}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        </div>

        <div>
          <button type="submit">Dohvati adresu</button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h3>Rezultat</h3>
        <div>{response}</div>
      </div>
      <hr style={{ margin: '20px 0', borderColor: '#ccc' }} />

      <div>
        <h1>Lažiranje zahtjeva na drugom sjedištu (Cross Site Request Forgery, CSRF)</h1>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <input type="checkbox" checked={vulnCSRF} onChange={onToggleCsrf} />
          {' '}Global CSRF vulnerability (server-side flag)
        </label>

        <div>
          {user ? (
          <div>
            <div><strong>Logged in as:</strong> {user.username}</div>
            <div><strong>Address:</strong> {user.address}</div>
            <button onClick={handleLogout} style={{ marginTop: 8 }}>Logout</button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div><label>Username: <input value={loginUser} onChange={e => setLoginUser(e.target.value)} /></label></div>
            <div><label>Password: <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} /></label></div>
            <div style={{ marginTop: 8 }}><button type="submit">Login (creates session)</button></div>
            <div style={{ fontSize:12, color:'#666', marginTop:6 }}>Use seeded users</div>
          </form>
        )}
        </div>

      </div>
    </div>
  );

}

export default App;
