const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.SYNC_PORT || 5000;
const DB_FILE = path.join(__dirname, 'shared_database.json');

// Default initial database state
const defaultDb = {
  shops: [],
  products: [],
  orders: [],
  lastUpdated: Date.now()
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return defaultDb;
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  writeDb(defaultDb);
}

// Connected SSE clients for live event streaming
let clients = [];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. SSE Live Stream for Real-Time Instant Push
  if (req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: {"type":"CONNECTED"}\n\n');

    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // 2. GET /api/sync — Fetch latest snapshot
  if (req.method === 'GET' && req.url === '/api/sync') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  // 3. POST /api/sync — Push update & broadcast to all connected apps
  if (req.method === 'POST' && req.url === '/api/sync') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let db = readDb();

        if (payload.snapshot) {
          if (payload.snapshot.shops !== undefined) db.shops = payload.snapshot.shops;
          if (payload.snapshot.products !== undefined) db.products = payload.snapshot.products;
          if (payload.snapshot.orders !== undefined) db.orders = payload.snapshot.orders;
        }

        db.lastUpdated = Date.now();
        writeDb(db);

        // Broadcast to all connected clients
        const eventData = JSON.stringify({
          type: payload.type || 'SYNC_UPDATE',
          snapshot: db,
          timestamp: Date.now()
        });

        clients.forEach(client => {
          client.write(`data: ${eventData}\n\n`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. POST /api/reset — Wipe database
  if (req.method === 'POST' && req.url === '/api/reset') {
    const freshDb = { shops: [], products: [], orders: [], lastUpdated: Date.now() };
    writeDb(freshDb);
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify({ type: 'DATA_RELOAD', snapshot: freshDb })}\n\n`);
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, db: freshDb }));
    return;
  }

  // Health check
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'LocalMart Sync Server Online', port: PORT }));
});

server.listen(PORT, () => {
  console.log(`[LocalMart Sync Bridge] Running on http://localhost:${PORT}`);
});
