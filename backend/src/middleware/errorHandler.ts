import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
  });

  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`) as CustomError;
  error.statusCode = 404;
  next(error);
};
