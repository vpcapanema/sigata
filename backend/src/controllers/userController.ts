import { User, UserRole } from '../types';
// import { userService } from '../services/userService';
// import { activityService } from '../services/activityService';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';

// Mock services para desenvolvimento
const userService = {
  async findUsers(params: any) {
    return {
      users: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@empresa.com',
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };
  },
  async findById(id: string) {
    return {
      id,
      name: 'João Silva',
      email: 'joao@empresa.com',
      password: '$2b$12$hash...',
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  async updateProfile(id: string, data: any) {
    return {
      id,
      name: data.name || 'João Silva',
      email: 'joao@empresa.com',
      role: 'USER',
      isActive: true,
      preferences: data.preferences,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  async updatePassword(id: string, hashedPassword: string) {
    return true;
  },
  async deactivateUser(id: string, reason?: string) {
    return true;
  },
  async updateUser(id: string, data: any) {
    return {
      id,
      name: data.name || 'Usuário',
      email: 'user@empresa.com',
      role: data.role || 'USER',
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  async deleteUser(id: string) {
    return true;
  },
  async getUserStatistics() {
    return {
      total: 25,
      active: 22,
      inactive: 3,
      byRole: {
        ADMIN: 2,
        USER: 20,
        VIEWER: 3
      },
      recentRegistrations: [],
      topUsers: [],
      loginActivity: {
        today: 8,
        thisWeek: 18,
        thisMonth: 22
      }
    };
  }
};

const activityService = {
  async logActivity(data: any) {
    console.log('Activity logged:', data);
  },
  async getUserActivities(userId: string, limit: number) {
    return {
      data: [
        {
          id: '1',
          type: 'LOGIN',
          description: 'Login realizado',
          created_at: new Date(),
          metadata: {}
        }
      ],
      total: 1
    };
  }
};

// Interface para Request estendido com user
interface AuthenticatedRequest {
  user?: {
    id: string;
    role: string;
  };
  params: { [key: string]: string };
  query: { [key: string]: any };
  body: any;
}

interface ApiResponse {
  json: (data: any) => void;
  status: (code: number) => ApiResponse;
}

export class UserController {
  /**
   * Lista usuários (apenas para admins)
   */
  async listUsers(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userRole = req.user?.role || 'USER';
      
      if (userRole !== UserRole.ADMIN) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem listar usuários.' 
        });
      }

      const {
        page = '1',
        limit = '10',
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      logger.info(`Admin listando usuários - página ${pageNumber}, limite ${limitNumber}`);

      const result = await userService.findUsers({
        page: pageNumber,
        limit: limitNumber,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar usuários'
      });
    }
  }

  /**
   * Obtém perfil do usuário atual
   */
  async getCurrentUser(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      logger.info(`Buscando perfil do usuário ${userId}`);

      const user = await userService.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      // Remove senha e outros dados sensíveis
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro ao buscar usuário atual:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar dados do usuário'
      });
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const { name, preferences } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      // Validações
      if (name && (typeof name !== 'string' || name.trim().length < 2)) {
        return res.status(400).json({ 
          error: 'Nome deve ter pelo menos 2 caracteres' 
        });
      }

      if (preferences && typeof preferences !== 'object') {
        return res.status(400).json({ 
          error: 'Preferências devem ser um objeto válido' 
        });
      }

      logger.info(`Atualizando perfil do usuário ${userId}`);

      const updatedUser = await userService.updateProfile(userId, {
        name,
        preferences
      });

      if (!updatedUser) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      // Registrar atividade
      await activityService.logActivity({
        userId,
        type: 'PROFILE_UPDATE',
        description: 'Perfil atualizado',
        metadata: { updatedFields: Object.keys(req.body) }
      });

      logger.info(`Perfil do usuário ${userId} atualizado com sucesso`);

      // Remove senha do retorno (se existir)
      const userWithoutPassword = updatedUser;

      res.json({
        message: 'Perfil atualizado com sucesso',
        user: userWithoutPassword
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar perfil'
      });
    }
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      // Validações
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: 'Nova senha deve ter pelo menos 8 caracteres' 
        });
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número' 
        });
      }

      logger.info(`Alteração de senha solicitada pelo usuário ${userId}`);

      // Buscar usuário e verificar senha atual
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          error: 'Senha atual incorreta' 
        });
      }

      // Alterar senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await userService.updatePassword(userId, hashedNewPassword);

      // Registrar atividade
      await activityService.logActivity({
        userId,
        type: 'PASSWORD_CHANGE',
        description: 'Senha alterada',
        metadata: {}
      });

      logger.info(`Senha do usuário ${userId} alterada com sucesso`);

      res.json({
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao alterar senha'
      });
    }
  }

  /**
   * Desativa conta do usuário
   */
  async deactivateAccount(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const { password, reason } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      // Validações
      if (!password) {
        return res.status(400).json({ 
          error: 'Senha é obrigatória para desativar a conta' 
        });
      }

      logger.info(`Desativação de conta solicitada pelo usuário ${userId}. Motivo: ${reason || 'Não informado'}`);

      // Verificar senha
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ 
          error: 'Senha incorreta' 
        });
      }

      // Desativar conta
      await userService.deactivateUser(userId, reason);

      // Registrar atividade
      await activityService.logActivity({
        userId,
        type: 'ACCOUNT_DEACTIVATION',
        description: 'Conta desativada',
        metadata: { reason }
      });

      logger.info(`Conta do usuário ${userId} desativada com sucesso`);

      res.json({
        message: 'Conta desativada com sucesso. Você será desconectado em breve.'
      });
    } catch (error) {
      logger.error('Erro ao desativar conta:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao desativar conta'
      });
    }
  }

  /**
   * Atualiza usuário (apenas para admins)
   */
  async updateUser(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const adminRole = req.user?.role || 'USER';
      const adminId = req.user?.id;
      const { id } = req.params;
      const { name, role, isActive } = req.body;

      if (adminRole !== UserRole.ADMIN) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem atualizar usuários.' 
        });
      }

      // Validações
      if (role && !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ 
          error: 'Role inválido' 
        });
      }

      logger.info(`Admin ${adminId} atualizando usuário ${id}`);

      const updatedUser = await userService.updateUser(id, {
        name,
        role,
        isActive
      });

      if (!updatedUser) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      // Registrar atividade
      await activityService.logActivity({
        userId: adminId!,
        type: 'USER_UPDATE',
        description: `Usuário ${id} atualizado por admin`,
        metadata: { targetUserId: id, updatedFields: Object.keys(req.body) }
      });

      logger.info(`Usuário ${id} atualizado pelo admin ${adminId}`);

      // Remove senha do retorno (se existir)
      const userWithoutPassword = updatedUser;

      res.json({
        message: 'Usuário atualizado com sucesso',
        user: userWithoutPassword
      });
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar usuário'
      });
    }
  }

  /**
   * Exclui usuário (apenas para admins)
   */
  async deleteUser(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const adminRole = req.user?.role || 'USER';
      const adminId = req.user?.id;
      const { id } = req.params;

      if (adminRole !== UserRole.ADMIN) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem excluir usuários.' 
        });
      }

      if (id === adminId) {
        return res.status(400).json({ 
          error: 'Não é possível excluir sua própria conta' 
        });
      }

      logger.info(`Admin ${adminId} excluindo usuário ${id}`);

      const deleted = await userService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      // Registrar atividade
      await activityService.logActivity({
        userId: adminId!,
        type: 'USER_DELETION',
        description: `Usuário ${id} excluído por admin`,
        metadata: { targetUserId: id }
      });

      logger.info(`Usuário ${id} excluído pelo admin ${adminId}`);

      res.json({ 
        message: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir usuário:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir usuário'
      });
    }
  }

  /**
   * Estatísticas de usuários (apenas para admins)
   */
  async getUserStats(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userRole = req.user?.role || 'USER';

      if (userRole !== UserRole.ADMIN) {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem ver estatísticas de usuários.' 
        });
      }

      logger.info('Admin buscando estatísticas de usuários');

      const stats = await userService.getUserStatistics();

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de usuários:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Obtém atividade recente do usuário
   */
  async getUserActivity(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const { limit = '10' } = req.query;

      if (!userId) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      logger.info(`Buscando atividade recente do usuário ${userId}`);

      const limitNumber = parseInt(limit as string);
      const activities = await activityService.getUserActivities(userId, limitNumber);

      res.json({
        activities: activities.data,
        total: activities.total
      });
    } catch (error) {
      logger.error('Erro ao buscar atividade do usuário:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar atividade'
      });
    }
  }
}

export default new UserController();
