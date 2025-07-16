import { Router, Request, Response } from 'express';
import { usuarioService } from '../services/usuarioService';

const router = Router();

/**
 * GET /api/usuarios - Lista todos os usuários
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    
    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length,
      message: 'Usuários listados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/usuarios/:id - Busca usuário por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.buscarPorId(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: usuario,
      message: 'Usuário encontrado'
    });
    return;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/usuarios/autenticar - Autentica usuário
 */
router.post('/autenticar', async (req: Request, res: Response) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Login e senha são obrigatórios'
      });
    }

    const usuario = await usuarioService.autenticar(login, senha);
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Remove dados sensíveis da resposta
    const { senha_hash, salt, duplo_fator_chave_secreta, ...usuarioSeguro } = usuario;

    res.json({
      success: true,
      data: usuarioSeguro,
      message: 'Autenticação realizada com sucesso'
    });
    return;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error instanceof Error && error.message === 'Usuário temporariamente bloqueado') {
      return res.status(423).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/usuarios/:id/estatisticas - Estatísticas do usuário
 */
router.get('/:id/estatisticas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verifica se o usuário existe
    const usuario = await usuarioService.buscarPorId(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const estatisticas = await usuarioService.obterEstatisticas(id);
    
    res.json({
      success: true,
      data: estatisticas,
      message: 'Estatísticas obtidas com sucesso'
    });
    return;
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/usuarios/buscar/:termo - Busca usuários por termo
 */
router.get('/buscar/:termo', async (req: Request, res: Response) => {
  try {
    const { termo } = req.params;
    
    // Tenta buscar por username
    let usuario = await usuarioService.buscarPorUsername(termo);
    
    // Se não encontrou, tenta por email
    if (!usuario) {
      usuario = await usuarioService.buscarPorEmail(termo);
    }
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remove dados sensíveis
    const { senha_hash, salt, duplo_fator_chave_secreta, ...usuarioSeguro } = usuario;

    res.json({
      success: true,
      data: usuarioSeguro,
      message: 'Usuário encontrado'
    });
    return;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
