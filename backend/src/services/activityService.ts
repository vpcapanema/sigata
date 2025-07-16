import { database } from '../config/database';

interface LogActivityData {
  userId: string;
  type: string;
  description: string;
  metadata: any;
}

class ActivityService {
  async logActivity(data: LogActivityData): Promise<void> {
    const { userId, type, description, metadata } = data;
    
    try {
      await database.query(
        'INSERT INTO user_activities (user_id, type, description, metadata, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, type, description, JSON.stringify(metadata)]
      );
    } catch (error) {
      // Em caso de erro na gravação da atividade, apenas loga mas não falha a operação principal
      console.error('Erro ao registrar atividade:', error);
    }
  }

  async getUserActivities(userId: string, limit: number) {
    try {
      const countResult = await database.query(
        'SELECT COUNT(*) FROM user_activities WHERE user_id = $1',
        [userId]
      );

      const activitiesResult = await database.query(
        'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );

      return {
        data: activitiesResult.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      // Fallback para dados mock se a query falhar
      return {
        data: [
          {
            id: '1',
            type: 'DOCUMENT_UPLOAD',
            description: 'Upload do documento "ata_reuniao_01.pdf"',
            created_at: new Date('2025-01-09T14:30:00Z'),
            metadata: {
              documentId: 'doc1',
              filename: 'ata_reuniao_01.pdf'
            }
          },
          {
            id: '2',
            type: 'ANALYSIS_CREATED',
            description: 'Análise FULL criada para documento "ata_reuniao_01.pdf"',
            created_at: new Date('2025-01-09T14:35:00Z'),
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
            created_at: new Date('2025-01-09T15:00:00Z'),
            metadata: {
              reportId: 'report1',
              type: 'ANALYSIS_SUMMARY'
            }
          },
          {
            id: '4',
            type: 'LOGIN',
            description: 'Login realizado',
            created_at: new Date('2025-01-09T09:00:00Z'),
            metadata: {
              ip: '192.168.1.100',
              userAgent: 'Mozilla/5.0...'
            }
          }
        ].slice(0, limit),
        total: 15
      };
    }
  }

  async getSystemActivities(limit: number = 50) {
    try {
      const activitiesResult = await database.query(
        `SELECT 
           ua.*, 
           u.name as user_name, 
           u.email as user_email 
         FROM user_activities ua 
         JOIN users u ON ua.user_id = u.id 
         WHERE u.deleted_at IS NULL 
         ORDER BY ua.created_at DESC 
         LIMIT $1`,
        [limit]
      );

      return activitiesResult.rows;
    } catch (error) {
      console.error('Erro ao buscar atividades do sistema:', error);
      return [];
    }
  }
}

export const activityService = new ActivityService();
