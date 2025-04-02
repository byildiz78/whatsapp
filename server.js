const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
// basePath'i doğrudan next.config.js'den alıyor, burada tekrar belirtmeye gerek yok
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3040;

// Doğru basePath'i loglama için alalım
const basePath = process.env.NEXT_PUBLIC_BASEPATH || '/whatsapp';

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Gelen istekleri loglayalım
    console.log(`[Server] Request: ${req.method} ${req.url}`);
    
    // Next.js handler'ına isteği iletelim
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Base path: ${basePath}`);
    console.log(`> Access via: http://localhost:${port}${basePath}`);
  });
});
