const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Servir arquivos estáticos do diretório frontend_html
app.use(express.static(path.join(__dirname, 'frontend_html')));

// Proxy para a API do backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

// Rota padrão - redirecionar para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_html', 'index.html'));
});

// Middleware para capturar rotas não encontradas e servir index.html (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_html', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend HTML rodando em: http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos de: ${path.join(__dirname, 'frontend_html')}`);
  console.log(`🔗 Proxy API: http://localhost:${PORT}/api -> http://localhost:3001/api`);
});
