import logger from '../utils/logger';

export interface NotificationData {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: any;
  read?: boolean;
  createdAt?: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  DOCUMENT_UPLOAD_SUCCESS = 'DOCUMENT_UPLOAD_SUCCESS',
  DOCUMENT_UPLOAD_ERROR = 'DOCUMENT_UPLOAD_ERROR',
  ANALYSIS_COMPLETED = 'ANALYSIS_COMPLETED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_FAILED = 'REPORT_FAILED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  ACCOUNT_ACTIVITY = 'ACCOUNT_ACTIVITY',
  QUOTA_WARNING = 'QUOTA_WARNING',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  browser: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class NotificationService {
  /**
   * Envia uma notificação para um usuário
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      logger.info(`Enviando notificação ${notification.type} para usuário ${notification.userId}`);

      // Verificar preferências do usuário
      const preferences = await this.getUserPreferences(notification.userId);
      if (!this.shouldSendNotification(notification.type, preferences)) {
        logger.info(`Notificação ${notification.type} bloqueada pelas preferências do usuário ${notification.userId}`);
        return;
      }

      // Salvar notificação no banco (simulado)
      const savedNotification = await this.saveNotification(notification);

      // Enviar por diferentes canais baseado nas preferências
      const promises: Promise<void>[] = [];

      if (preferences.browser) {
        promises.push(this.sendBrowserNotification(savedNotification));
      }

      if (preferences.email) {
        promises.push(this.sendEmailNotification(savedNotification));
      }

      await Promise.all(promises);

      logger.info(`Notificação ${savedNotification.id} enviada com sucesso`);
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
      throw new Error('Falha ao enviar notificação');
    }
  }

  /**
   * Envia notificações em lote
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      logger.info(`Enviando ${notifications.length} notificações em lote`);

      const promises = notifications.map(notification => 
        this.sendNotification(notification).catch(error => {
          logger.error(`Erro ao enviar notificação para usuário ${notification.userId}:`, error);
          return null; // Não falha o lote todo por causa de uma notificação
        })
      );

      await Promise.all(promises);

      logger.info('Envio em lote concluído');
    } catch (error) {
      logger.error('Erro no envio em lote:', error);
      throw new Error('Falha no envio em lote de notificações');
    }
  }

  /**
   * Lista notificações de um usuário
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{
    notifications: NotificationData[];
    total: number;
    unreadCount: number;
  }> {
    try {
      logger.info(`Buscando notificações para usuário ${userId}`);

      // Mock de notificações para demonstração
      const mockNotifications: NotificationData[] = [
        {
          id: '1',
          userId,
          type: NotificationType.ANALYSIS_COMPLETED,
          title: 'Análise Concluída',
          message: 'A análise do documento "ata_reuniao_01.pdf" foi concluída com sucesso.',
          priority: NotificationPriority.MEDIUM,
          read: false,
          createdAt: new Date(),
          data: {
            documentId: 'doc1',
            analysisId: 'analysis1',
            confidence: 0.85
          }
        },
        {
          id: '2',
          userId,
          type: NotificationType.REPORT_GENERATED,
          title: 'Relatório Gerado',
          message: 'Seu relatório "Resumo Janeiro 2025" está pronto para download.',
          priority: NotificationPriority.MEDIUM,
          read: true,
          createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
          data: {
            reportId: 'report1',
            fileSize: 2048000
          }
        },
        {
          id: '3',
          userId,
          type: NotificationType.QUOTA_WARNING,
          title: 'Aviso de Cota',
          message: 'Você está usando 85% do seu limite de armazenamento.',
          priority: NotificationPriority.HIGH,
          read: false,
          createdAt: new Date(Date.now() - 7200000), // 2 horas atrás
          data: {
            usedStorage: 858993459, // ~820MB
            totalStorage: 1073741824 // 1GB
          }
        },
        {
          id: '4',
          userId,
          type: NotificationType.DOCUMENT_UPLOAD_ERROR,
          title: 'Erro no Upload',
          message: 'Falha ao processar o documento "documento_corrupto.pdf".',
          priority: NotificationPriority.HIGH,
          read: false,
          createdAt: new Date(Date.now() - 10800000), // 3 horas atrás
          data: {
            documentId: 'doc_error',
            error: 'Arquivo corrompido ou formato inválido'
          }
        },
        {
          id: '5',
          userId,
          type: NotificationType.SYSTEM_MAINTENANCE,
          title: 'Manutenção Programada',
          message: 'Manutenção do sistema será realizada amanhã às 02:00.',
          priority: NotificationPriority.MEDIUM,
          read: true,
          createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
          expiresAt: new Date(Date.now() + 86400000), // expira em 1 dia
          data: {
            maintenanceStart: '2025-01-11T02:00:00Z',
            estimatedDuration: 120 // minutos
          }
        }
      ];

      // Aplicar filtros
      let filtered = mockNotifications;

      if (options.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }

      if (options.types && options.types.length > 0) {
        filtered = filtered.filter(n => options.types!.includes(n.type));
      }

      // Paginação
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = filtered.slice(startIndex, endIndex);

      const unreadCount = mockNotifications.filter(n => !n.read).length;

      return {
        notifications: paginatedNotifications,
        total: filtered.length,
        unreadCount
      };
    } catch (error) {
      logger.error('Erro ao buscar notificações:', error);
      throw new Error('Falha ao buscar notificações');
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      logger.info(`Marcando notificação ${notificationId} como lida para usuário ${userId}`);

      // Simular atualização no banco
      // await updateNotification(notificationId, { read: true });

      logger.info(`Notificação ${notificationId} marcada como lida`);
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      throw new Error('Falha ao marcar notificação como lida');
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      logger.info(`Marcando todas as notificações como lidas para usuário ${userId}`);

      // Simular atualização no banco
      // await updateUserNotifications(userId, { read: true });

      logger.info(`Todas as notificações do usuário ${userId} marcadas como lidas`);
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      throw new Error('Falha ao marcar todas as notificações como lidas');
    }
  }

  /**
   * Exclui uma notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      logger.info(`Excluindo notificação ${notificationId} do usuário ${userId}`);

      // Simular exclusão no banco
      // await deleteNotification(notificationId, userId);

      logger.info(`Notificação ${notificationId} excluída`);
    } catch (error) {
      logger.error('Erro ao excluir notificação:', error);
      throw new Error('Falha ao excluir notificação');
    }
  }

  /**
   * Obtém preferências de notificação do usuário
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Mock de preferências padrão
      const defaultPreferences: NotificationPreferences = {
        userId,
        email: true,
        browser: true,
        types: {
          [NotificationType.DOCUMENT_UPLOAD_SUCCESS]: true,
          [NotificationType.DOCUMENT_UPLOAD_ERROR]: true,
          [NotificationType.ANALYSIS_COMPLETED]: true,
          [NotificationType.ANALYSIS_FAILED]: true,
          [NotificationType.REPORT_GENERATED]: true,
          [NotificationType.REPORT_FAILED]: true,
          [NotificationType.SYSTEM_MAINTENANCE]: true,
          [NotificationType.ACCOUNT_ACTIVITY]: false,
          [NotificationType.QUOTA_WARNING]: true,
          [NotificationType.SECURITY_ALERT]: true
        }
      };

      return defaultPreferences;
    } catch (error) {
      logger.error('Erro ao buscar preferências:', error);
      throw new Error('Falha ao buscar preferências de notificação');
    }
  }

  /**
   * Atualiza preferências de notificação do usuário
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      logger.info(`Atualizando preferências de notificação para usuário ${userId}`);

      // Simular atualização no banco
      // await updateUserPreferences(userId, preferences);

      logger.info(`Preferências do usuário ${userId} atualizadas`);
    } catch (error) {
      logger.error('Erro ao atualizar preferências:', error);
      throw new Error('Falha ao atualizar preferências de notificação');
    }
  }

  /**
   * Cria notificações automáticas baseadas em eventos do sistema
   */
  async createAutomaticNotifications(event: string, data: any): Promise<void> {
    try {
      logger.info(`Criando notificações automáticas para evento: ${event}`);

      switch (event) {
        case 'document.upload.success':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.DOCUMENT_UPLOAD_SUCCESS,
            title: 'Upload Concluído',
            message: `O documento "${data.filename}" foi processado com sucesso.`,
            priority: NotificationPriority.MEDIUM,
            data: {
              documentId: data.documentId,
              filename: data.filename
            }
          });
          break;

        case 'document.upload.error':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.DOCUMENT_UPLOAD_ERROR,
            title: 'Erro no Upload',
            message: `Falha ao processar o documento "${data.filename}": ${data.error}`,
            priority: NotificationPriority.HIGH,
            data: {
              documentId: data.documentId,
              filename: data.filename,
              error: data.error
            }
          });
          break;

        case 'analysis.completed':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.ANALYSIS_COMPLETED,
            title: 'Análise Concluída',
            message: `A análise ${data.type} do documento "${data.documentName}" foi concluída com ${Math.round(data.confidence * 100)}% de confiança.`,
            priority: NotificationPriority.MEDIUM,
            data: {
              analysisId: data.analysisId,
              documentId: data.documentId,
              type: data.type,
              confidence: data.confidence
            }
          });
          break;

        case 'analysis.failed':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.ANALYSIS_FAILED,
            title: 'Falha na Análise',
            message: `A análise do documento "${data.documentName}" falhou: ${data.error}`,
            priority: NotificationPriority.HIGH,
            data: {
              analysisId: data.analysisId,
              documentId: data.documentId,
              error: data.error
            }
          });
          break;

        case 'report.generated':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.REPORT_GENERATED,
            title: 'Relatório Pronto',
            message: `Seu relatório "${data.title}" está pronto para download.`,
            priority: NotificationPriority.MEDIUM,
            data: {
              reportId: data.reportId,
              title: data.title,
              fileSize: data.fileSize
            }
          });
          break;

        case 'quota.warning':
          await this.sendNotification({
            userId: data.userId,
            type: NotificationType.QUOTA_WARNING,
            title: 'Aviso de Cota',
            message: `Você está usando ${data.percentage}% do seu limite de armazenamento.`,
            priority: NotificationPriority.HIGH,
            data: {
              usedStorage: data.usedStorage,
              totalStorage: data.totalStorage,
              percentage: data.percentage
            }
          });
          break;

        default:
          logger.warn(`Evento não reconhecido para notificação automática: ${event}`);
      }
    } catch (error) {
      logger.error('Erro ao criar notificações automáticas:', error);
    }
  }

  /**
   * Limpa notificações expiradas
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      logger.info('Limpando notificações expiradas');

      const now = new Date();
      // Em produção: await deleteExpiredNotifications(now);

      logger.info('Limpeza de notificações expiradas concluída');
    } catch (error) {
      logger.error('Erro ao limpar notificações expiradas:', error);
    }
  }

  /**
   * Verifica se deve enviar notificação baseado nas preferências
   */
  private shouldSendNotification(type: NotificationType, preferences: NotificationPreferences): boolean {
    return preferences.types[type] || false;
  }

  /**
   * Salva notificação no banco de dados (simulado)
   */
  private async saveNotification(notification: NotificationData): Promise<NotificationData> {
    const savedNotification: NotificationData = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date()
    };

    logger.info(`Notificação ${savedNotification.id} salva no banco`);
    return savedNotification;
  }

  /**
   * Envia notificação via browser/push (simulado)
   */
  private async sendBrowserNotification(notification: NotificationData): Promise<void> {
    logger.info(`Enviando notificação browser para usuário ${notification.userId}`);
    // Em produção, você usaria Web Push API ou WebSockets
  }

  /**
   * Envia notificação via email (simulado)
   */
  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    try {
      logger.info(`Enviando email para usuário ${notification.userId}`);

      const template = this.getEmailTemplate(notification.type, notification);
      
      // Em produção, você usaria um serviço de email como SendGrid, AWS SES, etc.
      // await emailService.send({
      //   to: userEmail,
      //   subject: template.subject,
      //   html: template.htmlBody,
      //   text: template.textBody
      // });

      logger.info(`Email enviado para usuário ${notification.userId}`);
    } catch (error) {
      logger.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Obtém template de email para um tipo de notificação
   */
  private getEmailTemplate(type: NotificationType, notification: NotificationData): EmailTemplate {
    const baseTemplate = {
      subject: notification.title,
      htmlBody: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><small>Recebido em: ${notification.createdAt?.toLocaleString('pt-BR')}</small></p>
      `,
      textBody: `${notification.title}\n\n${notification.message}\n\nRecebido em: ${notification.createdAt?.toLocaleString('pt-BR')}`
    };

    // Personalizar template baseado no tipo
    switch (type) {
      case NotificationType.ANALYSIS_COMPLETED:
        return {
          ...baseTemplate,
          subject: `✅ ${baseTemplate.subject}`,
          htmlBody: baseTemplate.htmlBody + `<p><a href="/analysis/${notification.data?.analysisId}">Ver Resultado da Análise</a></p>`
        };

      case NotificationType.REPORT_GENERATED:
        return {
          ...baseTemplate,
          subject: `📊 ${baseTemplate.subject}`,
          htmlBody: baseTemplate.htmlBody + `<p><a href="/reports/${notification.data?.reportId}/download">Download do Relatório</a></p>`
        };

      case NotificationType.QUOTA_WARNING:
        return {
          ...baseTemplate,
          subject: `⚠️ ${baseTemplate.subject}`,
          htmlBody: baseTemplate.htmlBody + `<p><a href="/profile">Gerenciar Armazenamento</a></p>`
        };

      default:
        return baseTemplate;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
