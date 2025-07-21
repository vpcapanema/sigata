const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 5000;

// MIME types para diferentes extensões
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

// Função para fazer proxy das requisições da API
function proxyRequest(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Erro no proxy:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro interno do servidor');
  });

  req.pipe(proxy);
}

// Função para servir arquivos estáticos
function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado');
      return;
    }

    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

// Criar servidor
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy para API do backend
  if (pathname.startsWith('/api')) {
    proxyRequest(req, res);
    return;
  }

  // Servir arquivos estáticos
  let filePath;
  
  if (pathname === '/') {
    filePath = path.join(__dirname, 'frontend_html', 'index.html');
  } else {
    filePath = path.join(__dirname, 'frontend_html', pathname);
  }

  // Verificar se o arquivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Se não existir, servir index.html (SPA behavior)
      filePath = path.join(__dirname, 'frontend_html', 'index.html');
    }
    serveStaticFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`🌐 Frontend HTML rodando em: http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos de: ${path.join(__dirname, 'frontend_html')}`);
  console.log(`🔗 Proxy API: http://localhost:${PORT}/api -> http://localhost:${BACKEND_PORT}/api`);
  console.log(`✨ Acesse as páginas:`);
  console.log(`   - http://localhost:${PORT} (Página inicial)`);
  console.log(`   - http://localhost:${PORT}/login.html (Login)`);
  console.log(`   - http://localhost:${PORT}/upload.html (Upload)`);
  console.log(`   - http://localhost:${PORT}/documents.html (Documentos)`);
  console.log(`   - http://localhost:${PORT}/reports.html (Relatórios)`);
  console.log(`   - http://localhost:${PORT}/analytics.html (Analytics)`);
  console.log(`   - http://localhost:${PORT}/dashboard.html (Dashboard)`);
});
