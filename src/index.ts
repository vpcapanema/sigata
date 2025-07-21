import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// ✅ NOVA ARQUITETURA MODULAR - Importar rotas centralizadas
import routes from './routes/index';

// Configuração de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança desabilitado temporariamente para debugging
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3001', 'http://localhost:8000', 'http://127.0.0.1:8000', 'vscode-webview://'],
  credentials: true
}));

// Middleware básico
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por IP
});
app.use(limiter);

// ✅ Middleware de parsing JSON (aplicado globalmente)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ NOVA ARQUITETURA MODULAR - Usar rotas centralizadas
app.use('/', routes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend_html')));

// Rota raiz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_html/index.html'));
});

// ✅ HEALTH CHECK - Mantido no index para monitoramento
app.get('/health', async (req, res) => {
  try {
    const { database } = await import('./config/database');
    const dbHealth = await database.healthCheck();
    
    res.json({
      status: 'OK',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      architecture: 'MODULAR',
      database: {
        connected: database.isConnected(),
        health: dbHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Falha no health check',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                          🚀 SIGATA SERVER v2.0                               ║
║                     ✅ ARQUITETURA MODULAR ATIVADA                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🌐 Servidor rodando em: http://localhost:${PORT}                              ║
║  📁 Frontend HTML: http://localhost:${PORT}                                   ║
║  🔧 Health Check: http://localhost:${PORT}/health                            ║
║                                                                              ║
║  📋 ROTAS DISPONÍVEIS:                                                       ║
║  ├── 🔐 /auth/login, /auth/logout                                            ║
║  ├── 📄 /documents/upload, /documents/list                                   ║
║  ├── 📊 /analytics/stats, /analytics/dashboard                               ║
║  └── ⚙️  /admin/database, /admin/reports                                      ║
║                                                                              ║
║  💾 Database: PostgreSQL AWS RDS                                            ║
║  🧠 NLP: Serviços Modularizados                                              ║
║  📦 Upload: Multer + Local Storage                                           ║
║  🏗️  Controllers: Separados por responsabilidade                             ║
║  🛤️  Routes: Organizadas hierarquicamente                                    ║
║  🔧 Middleware: Reutilizável e configurável                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
