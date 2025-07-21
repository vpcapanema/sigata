import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { database } from '../config/database';

export class AuthController {
  
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ 
          success: false, 
          message: 'Email e senha são obrigatórios' 
        });
        return;
      }
      
      // Consultar usuário no banco
      const result = await database.query(
        'SELECT id, username, email, senha_hash, cargo, ativo FROM usuarios.usuario_sistema WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        res.status(401).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
        return;
      }
      
      const user = result.rows[0];
      
      // Verificar senha
      const match = await bcrypt.compare(password, user.senha_hash);
      if (!match) {
        res.status(401).json({ 
          success: false, 
          message: 'Senha incorreta' 
        });
        return;
      }
      
      // Gerar JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            cargo: user.cargo,
            ativo: user.ativo
          }
        }
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }

  public async me(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
      return;
    }

    // MODO TESTE: Aceita qualquer token não vazio
    if (token && token.length > 0) {
      res.json({
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Usuário Teste',
            email: 'teste@sigata.com',
            role: 'admin'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }
}
