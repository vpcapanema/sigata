const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend_html')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'SIGATA Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rota de upload simplificada para teste
app.post('/api/documents/upload', (req, res) => {
  console.log('📁 Upload recebido');
  
  // Resposta simulada para teste
  res.json({
    success: true,
    message: 'Documento processado com sucesso (modo teste)',
    data: {
      id: 'test-' + Date.now(),
      nome_arquivo: 'documento_teste.pdf',
      status: 'processado',
      analise_nlp: {
        entities: [
          { value: 'João Silva', type: 'PERSON' },
          { value: 'Maria Santos', type: 'PERSON' }
        ],
        keywords: [
          { word: 'reunião', relevance: 0.95 },
          { word: 'projeto', relevance: 0.87 },
          { word: 'desenvolvimento', relevance: 0.82 }
        ],
        participants: ['João Silva', 'Maria Santos'],
        sentiment: {
          label: 'positive',
          score: 0.85
        },
        confidence: 0.89
      }
    }
  });
});

// Endpoint para relatórios
app.get('/api/reports/html', (req, res) => {
  const htmlReport = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>SIGATA - Relatório de Teste</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .report-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark report-header">
        <div class="container">
            <span class="navbar-brand">🧠 SIGATA Advanced 2.0 - Relatório de Teste</span>
            <span class="navbar-text">Modo de Desenvolvimento</span>
        </div>
    </nav>
    
    <div class="container mt-4">
        <div class="alert alert-success">
            <h4><i class="fas fa-check-circle"></i> Sistema Funcionando!</h4>
            <p>O SIGATA está rodando em modo de teste. Todas as funcionalidades básicas estão operacionais.</p>
        </div>
        
        <div class="row">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <h3>✅</h3>
                        <p>Backend Ativo</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body text-center">
                        <h3>✅</h3>
                        <p>Frontend Conectado</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body text-center">
                        <h3>⚙️</h3>
                        <p>NLP Simulado</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body text-center">
                        <h3>📊</h3>
                        <p>Relatórios OK</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <h5>Status do Sistema:</h5>
            <ul>
                <li>✅ Servidor Express rodando na porta ${PORT}</li>
                <li>✅ CORS configurado para frontend</li>
                <li>✅ Endpoint de upload funcionando</li>
                <li>✅ Relatórios HTML sendo gerados</li>
                <li>⚙️ Aguardando implementação completa do NLP</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlReport);
});

// Catch-all para servir frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  } else {
    res.sendFile(path.join(__dirname, '../../frontend_html/index.html'));
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 SIGATA Backend iniciado com sucesso!');
  console.log(`📊 API: http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Relatório: http://localhost:${PORT}/api/reports/html`);
  console.log('✨ Sistema pronto para uso!');
});
