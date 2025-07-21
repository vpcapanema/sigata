import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Por enquanto, aceita tokens de teste (MODO DESENVOLVIMENTO)
    if (token.startsWith('test-token-')) {
      // Mock user para desenvolvimento
      req.user = {
        id: 'test-user-1',
        role: 'ADMIN',
        email: 'test@sigata.com'
      };
      return next();
    }

    // TODO: Implementar verificação JWT real
    // const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    // req.user = decoded as any;
    
    // Por enquanto, usuário mock
    req.user = {
      id: 'user-' + Date.now(),
      role: 'ADMIN', 
      email: 'user@sigata.com'
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissão insuficiente'
      });
    }

    return next();
  };
};
