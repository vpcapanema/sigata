const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas básicas
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SIGATA Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'SIGATA - Sistema Integrado de Gestão de Atas'
  });
});

// API Routes
app.get('/api/documents', (req, res) => {
  res.json({
    success: true,
    data: {
      data: [], // array de documentos
      total: 0,
      page: 1,
      limit: 10,
      message: 'Sistema SIGATA em desenvolvimento - PLI São Paulo'
    }
  });
});

app.get('/api/documents/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 15,
      por_status: {
        'PENDENTE': 3,
        'PROCESSANDO': 2,
        'CONCLUIDO': 8,
        'ERRO': 2
      },
      por_mes: {
        '2025-07': 15
      },
      taxa_sucesso: 87.5,
      tempo_medio_processamento: 2500
    }
  });
});

app.post('/api/documents/upload', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Upload de documentos em desenvolvimento',
      uploadId: `upload_${Date.now()}`,
      status: 'received'
    }
  });
});

app.get('/api/analysis', (req, res) => {
  res.json({
    success: true,
    data: {
      analyses: [],
      total: 0,
      message: 'Serviços de análise NLP em desenvolvimento'
    }
  });
});

app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    data: {
      reports: [],
      total: 0,
      message: 'Sistema de relatórios em desenvolvimento'
    }
  });
});

// Status geral do sistema
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      system: 'SIGATA',
      status: 'DEVELOPMENT',
      components: {
        api: 'OK',
        database: 'CONFIGURED',
        nlp: 'DEVELOPMENT',
        frontend: 'OK'
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Erro interno do servidor',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Rota não encontrada: ${req.originalUrl}`
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🏛️  =' + '='.repeat(50));
  console.log('🏛️  SIGATA - Sistema Integrado de Gestão de Atas');
  console.log('📋 PLI São Paulo');
  console.log('🚀 Backend rodando na porta ' + PORT);
  console.log('📍 Health: http://localhost:' + PORT + '/health');
  console.log('🌐 API: http://localhost:' + PORT + '/api/');
  console.log('=' + '='.repeat(50));
});

module.exports = app;
