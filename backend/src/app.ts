import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Configuração de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Middleware básico
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por IP
});
app.use(limiter);

// Rotas básicas
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SIGATA Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Rotas da API
app.get('/api/documents', (req, res) => {
  res.json({
    success: true,
    data: {
      documents: [],
      total: 0,
      message: 'Sistema em desenvolvimento'
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
      uploadId: `upload_${Date.now()}`
    }
  });
});

app.get('/api/analysis', (req, res) => {
  res.json({
    success: true,
    data: {
      analyses: [],
      total: 0,
      message: 'Análises NLP em desenvolvimento'
    }
  });
});

app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    data: {
      reports: [],
      total: 0,
      message: 'Relatórios em desenvolvimento'
    }
  });
});

// Middleware de erro
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Erro interno do servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
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
  console.log(`🚀 SIGATA Backend rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API: http://localhost:${PORT}/api/`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
