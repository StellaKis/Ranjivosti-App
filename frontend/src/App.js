import React, { useState, useEffect } from 'react';

function App() {
  const [vuln, setVuln] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState('');

  async function handleLogin(e) {
    e && e.preventDefault();
    try {
      const r = await fetch(`http://localhost:4000/login`, {
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



  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>SQL Injection — tautologija</h1>

      <label style={{ display: 'block', marginBottom: 12 }}>
        <input type="checkbox" checked={vuln} onChange={e => setVuln(e.target.checked)} />
        {' '}Ranjivost uključena
      </label>

      <form onSubmit={handleLogin} style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Username:{' '}
            <input value={username} onChange={e => setUsername(e.target.value)} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Password:{' '}
            <input value={password} onChange={e => setPassword(e.target.value)} />
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
    </div>
  );

}

export default App;
