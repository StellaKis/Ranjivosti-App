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

  async function handleReset() {
    try {
      const r = await fetch('https://ranjivosti-app-backend.onrender.com/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const j = await r.json();
      if (r.ok) {
        fetchUser();
      } else {
        alert('Reset greška: ' + (j.error || JSON.stringify(j)));
      }
    } catch (err) {
      console.error('Reset error', err);
      alert('Greška pri pozivu reset: ' + err.message);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>SQL Injection — tautologija</h1>

      <p><strong>Upute:</strong> Ovo je primjer SQL umetanja. Primjer dohvaća adresu korisnika ako su upisani ispravni korisnički podatci - username i password.</p>
      <p>Kada je ranjivost isključena upisivanjem ' OR 1=1 -- u polje username ili password rezultira praznim ispisom. Kada je ranjivost uključena upisivanje ' OR 1=1 -- u polje username ili password rezultira ispisom svih parova username, address iz tablice users.</p>
      
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
        <p>SQL injection samo dohvaća podatke iz baze za traženog korisnika, korisnik se prijavlljuje tek u CSRF dijelu niže.</p>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#ccc' }} />

      <div>
        <h1>Lažiranje zahtjeva na drugom sjedištu (Cross Site Request Forgery, CSRF)</h1>

        <p><strong>Upute:</strong>Za testiranje ovog dijela stranice potrebno se ulogirati kao jedan od korisnika navedenih u Edgaru. Kada je korisnik prijavljen, potrebno je otići na attack stranicu u posebnoj kartici u pregledniku. Link attack stranice također se nalazi u Edgaru.</p>
        <p>Kada se vratite na web-aplikaciju Ranjivosti, potrebno je napraviti refresh stranice. </p>
        <p>Ako je ranjivost bila uključena prilikom posjete attack stranice, prijavljenom korisniku je promjenjena adresa u Attacker Addr 666. Ako je ranjivost bila isključena tijekom posjete attack stranice, prijavljenom korisniku nije promjenjena adresa.</p>
        <p>Napomena: Ranjivost se prilikom svakog refresha stranice isključuje. Pritiskom na gumb reset, resetiraju se adrese korisnika na početne kako biste mogli ponovno testirati.</p>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <input type="checkbox" checked={vulnCSRF} onChange={onToggleCsrf} />
          {' '}CSRF ranjivost uključena
        </label>

        <div>
          {user ? (
          <div>
            <div><strong>Prijavljeni korisnik:</strong> {user.username}</div>
            <div><strong>Adresa:</strong> {user.address}</div>
            <button onClick={handleLogout} style={{ marginTop: 8 }}>Odjava</button>
            <button onClick={handleReset} style={{ marginTop: 8 }}>Reset</button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div><label>Username: <input value={loginUser} onChange={e => setLoginUser(e.target.value)} /></label></div>
            <div><label>Password: <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} /></label></div>
            <div style={{ marginTop: 8 }}><button type="submit">Prijava</button></div>
          </form>
        )}
        </div>

      </div>
    </div>
  );

}

export default App;
