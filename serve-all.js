const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Start Sync API Server on Port 5000
require('./backend/sync-server.js');

// 2. Static File Server Helper
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.webmanifest': 'application/manifest+json',
};

function createStaticAppServer(appDir, port, appName) {
  const distPath = path.join(__dirname, appDir, 'dist');

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distPath, reqUrl);

    // If requesting directory, look for index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // SPA fallback: if file doesn't exist, serve /index.html
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distPath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ [${appName}] Running on http://localhost:${port}`);
  });

  return server;
}

// Start all static apps
createStaticAppServer('developer', 8080, 'Developer & Admin Console');
createStaticAppServer('customer', 8081, 'Customer Storefront App');
createStaticAppServer('shopkeeper', 8082, 'Shopkeeper Merchant App');
createStaticAppServer('delivery', 8083, 'Delivery Partner App');

console.log('\n🚀 LocalMart Unified Testing Suite is active on your Local Network!');
