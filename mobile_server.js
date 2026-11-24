/**
 * EEYES PRO Mobile - Preview & LAN Broadcast Server
 * Serves the Mobile Application for Android & iOS browser / PWA / native webview testing.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.MOBILE_PORT || 3001;
const WWW_DIR = path.resolve(__dirname, 'www');

// Find Local LAN IPv4 address for mobile device access
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let relPath = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, '');

  if (!relPath || relPath === '') {
    relPath = 'index.html';
  }

  const filePath = path.resolve(WWW_DIR, relPath);

  // Security check - prevent path traversal
  if (!filePath.startsWith(WWW_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Access Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${relPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // CORS & PWA Headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('📱 EEYES PRO - Mobile Application Server Running');
  console.log('================================================================');
  console.log(`• Localhost (PC Preview):  http://localhost:${PORT}`);
  console.log(`• Mobile (Android & iOS):  http://${localIp}:${PORT}`);
  console.log('----------------------------------------------------------------');
  console.log('💡 To use on Android or iPhone:');
  console.log(`   1. Connect phone to the same Wi-Fi network.`);
  console.log(`   2. Open Chrome/Safari and visit: http://${localIp}:${PORT}`);
  console.log(`   3. Tap "Add to Home Screen" to install as a Native Mobile App!`);
  console.log('================================================================\n');
});
