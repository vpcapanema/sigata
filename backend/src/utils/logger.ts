import winston from 'winston';
import path from 'path';

// Criar diretório de logs se não existir
const logDir = 'logs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: { service: 'ata-analyzer' },
  transports: [
    // Arquivo para erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Arquivo para todos os logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Em desenvolvimento, também log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

// Stream para Morgan
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger };

// Utility functions para logging estruturado
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  logger.error(message, {
    error: error?.message || error,
    stack: error?.stack,
    ...meta,
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Logger para requisições HTTP
export const logRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
  };

  if (res.statusCode >= 400) {
    logger.error('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Logger para análises
export const logAnalysis = (analysisId: string, documentId: string, status: string, meta?: any) => {
  logger.info('Analysis Update', {
    analysisId,
    documentId,
    status,
    ...meta,
  });
};

// Logger para upload de documentos
export const logDocumentUpload = (documentId: string, filename: string, userId: string, meta?: any) => {
  logger.info('Document Uploaded', {
    documentId,
    filename,
    userId,
    ...meta,
  });
};

// Logger para autenticação
export const logAuth = (action: string, userId?: string, email?: string, meta?: any) => {
  logger.info('Authentication', {
    action,
    userId,
    email,
    ...meta,
  });
};

// Logger para erros de validação
export const logValidationError = (field: string, value: any, message: string, meta?: any) => {
  logger.warn('Validation Error', {
    field,
    value,
    message,
    ...meta,
  });
};

// Logger para cache
export const logCache = (action: string, key: string, hit?: boolean, meta?: any) => {
  logger.debug('Cache Operation', {
    action,
    key,
    hit,
    ...meta,
  });
};

export default logger;
