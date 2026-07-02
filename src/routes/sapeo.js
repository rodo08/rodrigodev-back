const express = require('express');
const ChatLog = require('../models/ChatLog');
const Visit = require('../models/Visit');
const ContactMessage = require('../models/ContactMessage');
const CvDownload = require('../models/CvDownload');

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const password = req.headers['x-sapeo-password'];
  if (password !== process.env.SAPEO_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ createdAt: -1 }).limit(500);
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(500);
    const total = await ChatLog.countDocuments();
    const visits = await Visit.countDocuments();
    const messagesTotal = await ContactMessage.countDocuments();
    const cvDownloads = await CvDownload.countDocuments();
    res.json({ total, visits, logs, messages, messagesTotal, cvDownloads });
  } catch (error) {
    console.error('Sapeo error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>rodrigoDev — sapeo 👀</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, sans-serif;
      background: #0a0a0a;
      color: #f0f0f0;
      min-height: 100vh;
      padding: 2rem;
    }

    h1 { font-size: 2rem; margin-bottom: 0.4rem; }
    .subtitle { color: #888; margin-bottom: 2rem; font-size: 0.9rem; }

    .login {
      max-width: 360px;
      margin: 10vh auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    input, button {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 1rem;
      border: none;
    }

    input {
      background: #1a1a1a;
      color: #f0f0f0;
      border: 1px solid #333;
      outline: none;
    }

    input:focus { border-color: #ffa600; }

    button {
      background: #ffa600;
      color: #000;
      font-weight: bold;
      cursor: pointer;
    }

    button:hover { background: #ffb833; }

    .error { color: #ff4d4d; font-size: 0.9rem; }

    #dashboard { display: none; }

    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .stat {
      background: #1a1a1a;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 1rem 1.5rem;
    }

    .stat-value { font-size: 2rem; font-weight: bold; color: #ffa600; }
    .stat-label { font-size: 0.8rem; color: #888; margin-top: 0.2rem; }

    .table-wrap { overflow-x: auto; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    th {
      background: #111;
      text-align: left;
      padding: 0.75rem 1rem;
      color: #ffa600;
      border-bottom: 1px solid #222;
      white-space: nowrap;
    }

    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #1a1a1a;
      vertical-align: top;
      max-width: 300px;
    }

    tr:hover td { background: #111; }

    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
      display: block;
      cursor: pointer;
    }

    .truncate:hover { white-space: normal; word-break: break-word; }

    .tag {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .loading { color: #888; text-align: center; padding: 3rem; }
  </style>
</head>
<body>

  <div class="login" id="loginView">
    <h1>rodrigoDev 👀</h1>
    <p class="subtitle">Panel de administración</p>
    <input type="password" id="passInput" placeholder="Contraseña" />
    <button id="loginBtn">Entrar</button>
    <p class="error" id="loginError"></p>
  </div>

  <div id="dashboard">
    <h1 style="margin-bottom:0.4rem">rodrigoDev — sapeo 👀</h1>
    <p class="subtitle" id="lastUpdated"></p>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="visitsCount">—</div>
        <div class="stat-label">visitas únicas</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="totalCount">—</div>
        <div class="stat-label">mensajes totales</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="countries">—</div>
        <div class="stat-label">países</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="messagesCount">—</div>
        <div class="stat-label">mensajes de contacto</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="cvCount">—</div>
        <div class="stat-label">descargas de CV</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>País / Ciudad</th>
            <th>Mensaje</th>
            <th>Respuesta</th>
          </tr>
        </thead>
        <tbody id="logsBody">
          <tr><td colspan="5" class="loading">Cargando...</td></tr>
        </tbody>
      </table>
    </div>

    <h2 style="margin:2rem 0 1rem">Mensajes de contacto</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Asunto</th>
            <th>Mensaje</th>
          </tr>
        </thead>
        <tbody id="messagesBody">
          <tr><td colspan="6" class="loading">Cargando...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    let savedPassword = '';

    const loginBtn = document.getElementById('loginBtn');
    const passInput = document.getElementById('passInput');
    const loginError = document.getElementById('loginError');

    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });

    loginBtn.addEventListener('click', async () => {
      const password = passInput.value.trim();
      if (!password) return;

      loginBtn.textContent = '...';
      loginBtn.disabled = true;

      try {
        const res = await fetch('/sapeo/logs', {
          headers: { 'x-sapeo-password': password },
        });

        if (res.status === 401) {
          loginError.textContent = 'Contraseña incorrecta.';
          loginBtn.textContent = 'Entrar';
          loginBtn.disabled = false;
          return;
        }

        const data = await res.json();
        savedPassword = password;
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        renderDashboard(data);
      } catch {
        loginError.textContent = 'Error de conexión.';
        loginBtn.textContent = 'Entrar';
        loginBtn.disabled = false;
      }
    });

    function renderDashboard({ total, visits, logs, messages = [], messagesTotal = 0, cvDownloads = 0 }) {
      document.getElementById('visitsCount').textContent = visits ?? '—';
      document.getElementById('totalCount').textContent = total;
      document.getElementById('countries').textContent = new Set(logs.map(l => l.country)).size;
      document.getElementById('messagesCount').textContent = messagesTotal;
      document.getElementById('cvCount').textContent = cvDownloads;
      document.getElementById('lastUpdated').textContent =
        'Última actualización: ' + new Date().toLocaleString('es-ES');

      const tbody = document.getElementById('logsBody');
      tbody.innerHTML = logs.length
        ? logs.map((log, i) => \`
        <tr>
          <td>\${i + 1}</td>
          <td><span class="tag">\${new Date(log.createdAt).toLocaleString('es-ES')}</span></td>
          <td>\${log.country ?? '—'}<br><small style="color:#888">\${log.city ?? ''}</small></td>
          <td><span class="truncate" title="\${log.message}">\${log.message}</span></td>
          <td><span class="truncate" title="\${log.response ?? ''}">\${log.response ?? '—'}</span></td>
        </tr>
      \`).join('')
        : '<tr><td colspan="5" class="loading">Sin registros aún.</td></tr>';

      const msgBody = document.getElementById('messagesBody');
      msgBody.innerHTML = messages.length
        ? messages.map((m, i) => \`
        <tr>
          <td>\${i + 1}</td>
          <td><span class="tag">\${new Date(m.createdAt).toLocaleString('es-ES')}</span></td>
          <td>\${m.name || '—'}</td>
          <td>\${m.email}</td>
          <td><span class="truncate" title="\${m.subject}">\${m.subject}</span></td>
          <td><span class="truncate" title="\${m.message}">\${m.message}</span></td>
        </tr>
      \`).join('')
        : '<tr><td colspan="6" class="loading">Sin mensajes aún.</td></tr>';
    }
  </script>
</body>
</html>`);
});

module.exports = router;
