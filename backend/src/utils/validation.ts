import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';

// Esquemas de validação

// Auth schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória',
  }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório',
  }),
  role: Joi.string().valid('ADMIN', 'USER', 'VIEWER').optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
    'any.required': 'Nova senha é obrigatória',
  }),
});

// Document schemas
export const documentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('createdAt', 'filename', 'size', 'status').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  search: Joi.string().max(100).optional(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR').optional(),
  uploadedBy: Joi.string().guid().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
});

export const documentIdSchema = Joi.object({
  id: Joi.string().guid().required().messages({
    'string.guid': 'ID do documento deve ser um UUID válido',
    'any.required': 'ID do documento é obrigatório',
  }),
});

// Analysis schemas
export const analysisRequestSchema = Joi.object({
  documentId: Joi.string().guid().required().messages({
    'string.guid': 'ID do documento deve ser um UUID válido',
    'any.required': 'ID do documento é obrigatório',
  }),
  type: Joi.string().valid('meeting_minutes', 'full_analysis', 'summary').optional().default('meeting_minutes'),
  options: Joi.object({
    includeEntities: Joi.boolean().optional().default(true),
    includeTopics: Joi.boolean().optional().default(true),
    includeSentiment: Joi.boolean().optional().default(true),
    language: Joi.string().valid('pt', 'en', 'es').optional().default('pt'),
    minConfidence: Joi.number().min(0).max(1).optional().default(0.7),
  }).optional(),
});

export const analysisQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('createdAt', 'confidence', 'processingTime', 'status').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED').optional(),
  type: Joi.string().optional(),
  documentId: Joi.string().guid().optional(),
  analyzedBy: Joi.string().guid().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
});

export const analysisIdSchema = Joi.object({
  id: Joi.string().guid().required().messages({
    'string.guid': 'ID da análise deve ser um UUID válido',
    'any.required': 'ID da análise é obrigatório',
  }),
});

// Report schemas
export const reportRequestSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Título deve ter pelo menos 3 caracteres',
    'string.max': 'Título deve ter no máximo 200 caracteres',
    'any.required': 'Título é obrigatório',
  }),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('analysis_summary', 'metrics_report', 'custom').required().messages({
    'any.required': 'Tipo do relatório é obrigatório',
  }),
  template: Joi.string().optional(),
  filters: Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    documentIds: Joi.array().items(Joi.string().guid()).optional(),
    analysisIds: Joi.array().items(Joi.string().guid()).optional(),
    userIds: Joi.array().items(Joi.string().guid()).optional(),
    status: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

export const reportQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('createdAt', 'title', 'type', 'status').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  search: Joi.string().max(100).optional(),
  type: Joi.string().optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
  generatedBy: Joi.string().guid().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
});

export const reportIdSchema = Joi.object({
  id: Joi.string().guid().required().messages({
    'string.guid': 'ID do relatório deve ser um UUID válido',
    'any.required': 'ID do relatório é obrigatório',
  }),
});

// Middleware de validação
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors,
      });
    }

    // Substituir os dados validados
    req[property] = value;
    next();
  };
};

// Validações personalizadas
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum arquivo foi enviado',
    });
  }

  const allowedTypes = ['application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de arquivo não permitido. Apenas PDF é aceito.',
    });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'Arquivo muito grande. Tamanho máximo: 10MB',
    });
  }

  next();
};

// Validação de UUID
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Sanitização de dados
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Validação de paginação
export const validatePagination = (page?: number, limit?: number) => {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 10));
  return { page: validPage, limit: validLimit };
};

// Validação de ordenação
export const validateSorting = (sortBy?: string, sortOrder?: string, allowedFields: string[] = []) => {
  const validSortBy = allowedFields.includes(sortBy || '') ? sortBy : 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder || '') ? sortOrder : 'desc';
  return { sortBy: validSortBy, sortOrder: validSortOrder };
};

// Validação de filtros de data
export const validateDateFilters = (dateFrom?: string, dateTo?: string) => {
  let validDateFrom: Date | undefined;
  let validDateTo: Date | undefined;

  if (dateFrom) {
    validDateFrom = new Date(dateFrom);
    if (isNaN(validDateFrom.getTime())) {
      throw new ValidationError('Data inicial inválida');
    }
  }

  if (dateTo) {
    validDateTo = new Date(dateTo);
    if (isNaN(validDateTo.getTime())) {
      throw new ValidationError('Data final inválida');
    }
  }

  if (validDateFrom && validDateTo && validDateFrom > validDateTo) {
    throw new ValidationError('Data inicial deve ser anterior à data final');
  }

  return { dateFrom: validDateFrom, dateTo: validDateTo };
};

// Middleware para limpar dados de entrada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Recursivamente limpar strings no body
    const cleanObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }
      if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = cleanObject(value);
        }
        return cleaned;
      }
      return obj;
    };

    req.body = cleanObject(req.body);
  }

  next();
};
