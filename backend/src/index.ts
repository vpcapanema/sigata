import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
// import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents'; // Certifique-se de que o arquivo existe e o nome está correto
import analysisRoutes from './routes/analysis';
import usuarioRoutes from './routes/usuarios';
// import reportRoutes from './routes/reports';

// Configuração de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analisador de Atas API',
      version: '1.0.0',
      description: 'API para análise de atas de reunião com NLP',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Caminho para os arquivos com documentação
};

const specs = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares globais
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(requestLogger);

// Rate limiting apenas em produção
if (NODE_ENV === 'production') {
  app.use(limiter);
}

// Morgan logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rotas da API
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analysis', analysisRoutes);
// app.use('/api/reports', reportRoutes);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Analisador de Atas API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Iniciando desligamento gracioso...');
  
  try {
    // Fechar conexão Redis
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Conexão Redis fechada');
    }
    
    logger.info('Desligamento concluído');
    process.exit(0);
  } catch (error) {
    logger.error('Erro durante desligamento:', error);
    process.exit(1);
  }
};

// Event listeners para graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📚 Documentação: http://localhost:${PORT}/api-docs`);
  logger.info(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Ambiente: ${NODE_ENV}`);
});

// Error handling para servidor
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requer privilégios elevados`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} já está em uso`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;
