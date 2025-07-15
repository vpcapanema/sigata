import { User, UserRole } from '../types';
import logger from '../utils/logger';

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
      
      if (userRole !== 'ADMIN') {
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

      // Mock de usuários para demonstração
      const mockUsers = [
        {
          id: '1',
          email: 'admin@empresa.com',
          name: 'Administrador Sistema',
          role: UserRole.ADMIN,
          isActive: true,
          lastLogin: new Date('2025-01-09T10:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date(),
          stats: {
            documentsUploaded: 0,
            analysesCreated: 0,
            reportsGenerated: 2
          }
        },
        {
          id: '2',
          email: 'joao@empresa.com',
          name: 'João Silva',
          role: UserRole.USER,
          isActive: true,
          lastLogin: new Date('2025-01-09T14:30:00Z'),
          createdAt: new Date('2024-06-15T00:00:00Z'),
          updatedAt: new Date(),
          stats: {
            documentsUploaded: 15,
            analysesCreated: 25,
            reportsGenerated: 5
          }
        },
        {
          id: '3',
          email: 'maria@empresa.com',
          name: 'Maria Santos',
          role: UserRole.USER,
          isActive: true,
          lastLogin: new Date('2025-01-08T16:45:00Z'),
          createdAt: new Date('2024-08-20T00:00:00Z'),
          updatedAt: new Date(),
          stats: {
            documentsUploaded: 8,
            analysesCreated: 12,
            reportsGenerated: 3
          }
        },
        {
          id: '4',
          email: 'carlos@empresa.com',
          name: 'Carlos Lima',
          role: UserRole.VIEWER,
          isActive: false,
          lastLogin: new Date('2024-12-15T09:00:00Z'),
          createdAt: new Date('2024-10-01T00:00:00Z'),
          updatedAt: new Date(),
          stats: {
            documentsUploaded: 0,
            analysesCreated: 0,
            reportsGenerated: 1
          }
        }
      ];

      // Aplicar filtros
      let filteredUsers = mockUsers;

      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      if (isActive !== undefined) {
        const activeFilter = isActive === 'true';
        filteredUsers = filteredUsers.filter(user => user.isActive === activeFilter);
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      const total = filteredUsers.length;
      const totalPages = Math.ceil(total / limitNumber);
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      res.json({
        users: paginatedUsers,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1
        }
      });
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

      // Mock de usuário atual
      const mockUser = {
        id: userId,
        email: 'joao@empresa.com',
        name: 'João Silva',
        role: UserRole.USER,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-06-15T00:00:00Z'),
        updatedAt: new Date(),
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          emailNotifications: true,
          theme: 'light'
        },
        stats: {
          documentsUploaded: 15,
          analysesCreated: 25,
          reportsGenerated: 5,
          storageUsed: 51200000, // 50MB
          storageLimit: 1073741824 // 1GB
        }
      };

      res.json(mockUser);
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

      // Simular atualização
      const updatedUser = {
        id: userId,
        email: 'joao@empresa.com', // Email não pode ser alterado aqui
        name: name || 'João Silva',
        role: UserRole.USER,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2024-06-15T00:00:00Z'),
        updatedAt: new Date(),
        preferences: {
          language: preferences?.language || 'pt-BR',
          timezone: preferences?.timezone || 'America/Sao_Paulo',
          emailNotifications: preferences?.emailNotifications !== false,
          theme: preferences?.theme || 'light'
        }
      };

      logger.info(`Perfil do usuário ${userId} atualizado com sucesso`);

      res.json({
        message: 'Perfil atualizado com sucesso',
        user: updatedUser
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

      // Simular verificação da senha atual
      // Em produção, você compararia com o hash armazenado
      const isCurrentPasswordValid = true; // Mock

      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          error: 'Senha atual incorreta' 
        });
      }

      // Simular alteração da senha
      // Em produção, você geraria um novo hash
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

      // Simular verificação da senha
      const isPasswordValid = true; // Mock

      if (!isPasswordValid) {
        return res.status(400).json({ 
          error: 'Senha incorreta' 
        });
      }

      // Simular desativação da conta
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
      const { id } = req.params;
      const { name, role, isActive } = req.body;

      if (adminRole !== 'ADMIN') {
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

      logger.info(`Admin atualizando usuário ${id}`);

      // Mock de atualização
      const updatedUser = {
        id,
        email: 'usuario@empresa.com',
        name: name || 'Usuário Atualizado',
        role: role || UserRole.USER,
        isActive: isActive !== false,
        lastLogin: new Date('2025-01-08T10:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date()
      };

      logger.info(`Usuário ${id} atualizado pelo admin ${req.user?.id}`);

      res.json({
        message: 'Usuário atualizado com sucesso',
        user: updatedUser
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

      if (adminRole !== 'ADMIN') {
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

      // Mock de verificação de usuário
      const userExists = true; // Simulação

      if (!userExists) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado' 
        });
      }

      // Simular exclusão (soft delete - manter dados mas marcar como excluído)
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

      if (userRole !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem ver estatísticas de usuários.' 
        });
      }

      logger.info('Admin buscando estatísticas de usuários');

      // Mock de estatísticas
      const mockStats = {
        total: 25,
        active: 22,
        inactive: 3,
        byRole: {
          ADMIN: 2,
          USER: 20,
          VIEWER: 3
        },
        recentRegistrations: [
          {
            id: '5',
            name: 'Ana Costa',
            email: 'ana@empresa.com',
            role: UserRole.USER,
            createdAt: new Date('2025-01-05T00:00:00Z')
          },
          {
            id: '6',
            name: 'Pedro Oliveira',
            email: 'pedro@empresa.com',
            role: UserRole.VIEWER,
            createdAt: new Date('2025-01-03T00:00:00Z')
          }
        ],
        topUsers: [
          {
            id: '2',
            name: 'João Silva',
            documentsUploaded: 15,
            analysesCreated: 25,
            reportsGenerated: 5
          },
          {
            id: '3',
            name: 'Maria Santos',
            documentsUploaded: 8,
            analysesCreated: 12,
            reportsGenerated: 3
          }
        ],
        loginActivity: {
          today: 8,
          thisWeek: 18,
          thisMonth: 22
        }
      };

      res.json(mockStats);
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

      // Mock de atividades
      const mockActivities = [
        {
          id: '1',
          type: 'DOCUMENT_UPLOAD',
          description: 'Upload do documento "ata_reuniao_01.pdf"',
          timestamp: new Date('2025-01-09T14:30:00Z'),
          metadata: {
            documentId: 'doc1',
            filename: 'ata_reuniao_01.pdf'
          }
        },
        {
          id: '2',
          type: 'ANALYSIS_CREATED',
          description: 'Análise FULL criada para documento "ata_reuniao_01.pdf"',
          timestamp: new Date('2025-01-09T14:35:00Z'),
          metadata: {
            analysisId: 'analysis1',
            documentId: 'doc1',
            type: 'FULL'
          }
        },
        {
          id: '3',
          type: 'REPORT_GENERATED',
          description: 'Relatório "Resumo Janeiro 2025" gerado',
          timestamp: new Date('2025-01-09T15:00:00Z'),
          metadata: {
            reportId: 'report1',
            type: 'ANALYSIS_SUMMARY'
          }
        },
        {
          id: '4',
          type: 'LOGIN',
          description: 'Login realizado',
          timestamp: new Date('2025-01-09T09:00:00Z'),
          metadata: {
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
          }
        }
      ];

      const limitNumber = parseInt(limit as string);
      const limitedActivities = mockActivities.slice(0, limitNumber);

      res.json({
        activities: limitedActivities,
        total: mockActivities.length
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
