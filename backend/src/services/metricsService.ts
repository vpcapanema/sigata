import logger from '../utils/logger';

export interface MetricsData {
  // Métricas de documentos
  documents: {
    total: number;
    byStatus: {
      pending: number;
      processing: number;
      completed: number;
      error: number;
    };
    byType: {
      [mimetype: string]: number;
    };
    totalSize: number;
    avgSize: number;
    uploadTrends: Array<{
      date: string;
      count: number;
    }>;
  };

  // Métricas de análises
  analyses: {
    total: number;
    byStatus: {
      pending: number;
      in_progress: number;
      completed: number;
      failed: number;
    };
    byType: {
      [type: string]: number;
    };
    avgConfidence: number;
    avgProcessingTime: number;
    successRate: number;
    processingTrends: Array<{
      date: string;
      count: number;
      avgTime: number;
    }>;
  };

  // Métricas de usuários
  users: {
    total: number;
    active: number;
    byRole: {
      [role: string]: number;
    };
    loginActivity: Array<{
      date: string;
      logins: number;
      uniqueUsers: number;
    }>;
  };

  // Métricas de sistema
  system: {
    storageUsed: number;
    storageLimit: number;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueSize: number;
  };

  // Métricas de NLP
  nlp: {
    totalTextsProcessed: number;
    avgTextLength: number;
    topKeywords: Array<{
      keyword: string;
      frequency: number;
    }>;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topTopics: Array<{
      topic: string;
      relevance: number;
      frequency: number;
    }>;
    entityStats: Array<{
      type: string;
      count: number;
      avgConfidence: number;
    }>;
  };
}

export interface MetricsFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  documentIds?: string[];
  analysisTypes?: string[];
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export class MetricsService {
  /**
   * Obtém métricas consolidadas do sistema
   */
  async getSystemMetrics(filters: MetricsFilters = {}): Promise<MetricsData> {
    try {
      logger.info('Calculando métricas do sistema', filters);

      // Em produção, estas consultas seriam feitas no banco de dados
      // Por enquanto, retornamos dados mock realistas
      const metrics: MetricsData = {
        documents: await this.getDocumentMetrics(filters),
        analyses: await this.getAnalysisMetrics(filters),
        users: await this.getUserMetrics(filters),
        system: await this.getSystemResourceMetrics(),
        nlp: await this.getNLPMetrics(filters)
      };

      logger.info('Métricas calculadas com sucesso');
      return metrics;
    } catch (error) {
      logger.error('Erro ao calcular métricas do sistema:', error);
      throw new Error('Falha ao obter métricas do sistema');
    }
  }

  /**
   * Obtém métricas específicas de documentos
   */
  async getDocumentMetrics(filters: MetricsFilters = {}): Promise<MetricsData['documents']> {
    try {
      // Mock de dados de documentos
      const documentMetrics = {
        total: 150,
        byStatus: {
          pending: 5,
          processing: 3,
          completed: 135,
          error: 7
        },
        byType: {
          'application/pdf': 120,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25,
          'text/plain': 5
        },
        totalSize: 2147483648, // 2GB
        avgSize: 14316558, // ~14MB
        uploadTrends: this.generateTrendData('uploads', filters)
      };

      return documentMetrics;
    } catch (error) {
      logger.error('Erro ao calcular métricas de documentos:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas específicas de análises
   */
  async getAnalysisMetrics(filters: MetricsFilters = {}): Promise<MetricsData['analyses']> {
    try {
      // Mock de dados de análises
      const completed = 245;
      const failed = 15;
      const total = completed + failed + 8; // incluindo pending e in_progress

      const analysisMetrics = {
        total,
        byStatus: {
          pending: 5,
          in_progress: 3,
          completed,
          failed
        },
        byType: {
          FULL: 180,
          SUMMARY: 50,
          KEYWORDS: 25,
          ENTITIES: 8,
          SENTIMENT: 5
        },
        avgConfidence: 0.847,
        avgProcessingTime: 4250, // ms
        successRate: (completed / (completed + failed)) * 100,
        processingTrends: this.generateProcessingTrends(filters)
      };

      return analysisMetrics;
    } catch (error) {
      logger.error('Erro ao calcular métricas de análises:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas específicas de usuários
   */
  async getUserMetrics(filters: MetricsFilters = {}): Promise<MetricsData['users']> {
    try {
      // Mock de dados de usuários
      const userMetrics = {
        total: 45,
        active: 38,
        byRole: {
          ADMIN: 3,
          USER: 35,
          VIEWER: 7
        },
        loginActivity: this.generateLoginActivity(filters)
      };

      return userMetrics;
    } catch (error) {
      logger.error('Erro ao calcular métricas de usuários:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas de recursos do sistema
   */
  async getSystemResourceMetrics(): Promise<MetricsData['system']> {
    try {
      // Em produção, você obteria estas métricas do sistema operacional
      const systemMetrics = {
        storageUsed: 2684354560, // ~2.5GB
        storageLimit: 107374182400, // 100GB
        cpuUsage: 25.5, // percentual
        memoryUsage: 68.2, // percentual
        activeConnections: 12,
        queueSize: 3 // itens na fila de processamento
      };

      return systemMetrics;
    } catch (error) {
      logger.error('Erro ao obter métricas de sistema:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas específicas de NLP
   */
  async getNLPMetrics(filters: MetricsFilters = {}): Promise<MetricsData['nlp']> {
    try {
      // Mock de dados de NLP
      const nlpMetrics = {
        totalTextsProcessed: 245,
        avgTextLength: 2847, // caracteres
        topKeywords: [
          { keyword: 'reunião', frequency: 189 },
          { keyword: 'projeto', frequency: 156 },
          { keyword: 'planejamento', frequency: 134 },
          { keyword: 'equipe', frequency: 98 },
          { keyword: 'desenvolvimento', frequency: 87 },
          { keyword: 'cronograma', frequency: 76 },
          { keyword: 'orçamento', frequency: 65 },
          { keyword: 'recursos', frequency: 54 },
          { keyword: 'meta', frequency: 43 },
          { keyword: 'entrega', frequency: 38 }
        ],
        sentimentDistribution: {
          positive: 156,
          neutral: 67,
          negative: 22
        },
        topTopics: [
          { topic: 'Planejamento de Projetos', relevance: 0.85, frequency: 145 },
          { topic: 'Recursos Humanos', relevance: 0.73, frequency: 98 },
          { topic: 'Financeiro', relevance: 0.68, frequency: 76 },
          { topic: 'Desenvolvimento', relevance: 0.62, frequency: 65 },
          { topic: 'Reuniões e Comunicação', relevance: 0.58, frequency: 54 }
        ],
        entityStats: [
          { type: 'PERSON', count: 1247, avgConfidence: 0.91 },
          { type: 'DATE', count: 456, avgConfidence: 0.96 },
          { type: 'PROJECT', count: 234, avgConfidence: 0.87 },
          { type: 'ORGANIZATION', count: 189, avgConfidence: 0.83 },
          { type: 'LOCATION', count: 123, avgConfidence: 0.89 }
        ]
      };

      return nlpMetrics;
    } catch (error) {
      logger.error('Erro ao calcular métricas de NLP:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas comparativas entre períodos
   */
  async getComparativeMetrics(currentFilters: MetricsFilters, previousFilters: MetricsFilters): Promise<{
    current: MetricsData;
    previous: MetricsData;
    comparison: {
      documents: {
        totalChange: number;
        completionRateChange: number;
        avgSizeChange: number;
      };
      analyses: {
        totalChange: number;
        successRateChange: number;
        avgTimeChange: number;
        confidenceChange: number;
      };
      users: {
        totalChange: number;
        activeChange: number;
        loginActivityChange: number;
      };
    };
  }> {
    try {
      logger.info('Calculando métricas comparativas');

      const [current, previous] = await Promise.all([
        this.getSystemMetrics(currentFilters),
        this.getSystemMetrics(previousFilters)
      ]);

      const comparison = {
        documents: {
          totalChange: this.calculatePercentageChange(previous.documents.total, current.documents.total),
          completionRateChange: this.calculatePercentageChange(
            previous.documents.byStatus.completed / previous.documents.total,
            current.documents.byStatus.completed / current.documents.total
          ),
          avgSizeChange: this.calculatePercentageChange(previous.documents.avgSize, current.documents.avgSize)
        },
        analyses: {
          totalChange: this.calculatePercentageChange(previous.analyses.total, current.analyses.total),
          successRateChange: this.calculatePercentageChange(previous.analyses.successRate, current.analyses.successRate),
          avgTimeChange: this.calculatePercentageChange(previous.analyses.avgProcessingTime, current.analyses.avgProcessingTime),
          confidenceChange: this.calculatePercentageChange(previous.analyses.avgConfidence, current.analyses.avgConfidence)
        },
        users: {
          totalChange: this.calculatePercentageChange(previous.users.total, current.users.total),
          activeChange: this.calculatePercentageChange(previous.users.active, current.users.active),
          loginActivityChange: this.calculatePercentageChange(
            previous.users.loginActivity.reduce((sum, day) => sum + day.logins, 0),
            current.users.loginActivity.reduce((sum, day) => sum + day.logins, 0)
          )
        }
      };

      return { current, previous, comparison };
    } catch (error) {
      logger.error('Erro ao calcular métricas comparativas:', error);
      throw new Error('Falha ao obter métricas comparativas');
    }
  }

  /**
   * Exporta métricas para diferentes formatos
   */
  async exportMetrics(
    metrics: MetricsData,
    format: 'json' | 'csv' | 'excel'
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      logger.info(`Exportando métricas no formato ${format}`);

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(metrics, null, 2),
            filename: `metricas_${this.formatDate(new Date())}.json`,
            mimeType: 'application/json'
          };

        case 'csv':
          const csvData = this.convertMetricsToCSV(metrics);
          return {
            data: csvData,
            filename: `metricas_${this.formatDate(new Date())}.csv`,
            mimeType: 'text/csv'
          };

        case 'excel':
          // Em produção, você usaria uma biblioteca como xlsx
          const excelData = this.convertMetricsToExcel(metrics);
          return {
            data: excelData,
            filename: `metricas_${this.formatDate(new Date())}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };

        default:
          throw new Error(`Formato de exportação não suportado: ${format}`);
      }
    } catch (error) {
      logger.error('Erro ao exportar métricas:', error);
      throw new Error('Falha ao exportar métricas');
    }
  }

  /**
   * Gera dados de tendência baseados nos filtros
   */
  private generateTrendData(type: string, filters: MetricsFilters): Array<{ date: string; count: number }> {
    const days = 30;
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: this.formatDate(date),
        count: Math.floor(Math.random() * 10) + 1 // Mock data
      });
    }

    return trends;
  }

  /**
   * Gera dados de tendência de processamento
   */
  private generateProcessingTrends(filters: MetricsFilters): Array<{ date: string; count: number; avgTime: number }> {
    const days = 30;
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: this.formatDate(date),
        count: Math.floor(Math.random() * 15) + 1,
        avgTime: Math.floor(Math.random() * 2000) + 3000 // 3-5 segundos
      });
    }

    return trends;
  }

  /**
   * Gera dados de atividade de login
   */
  private generateLoginActivity(filters: MetricsFilters): Array<{ date: string; logins: number; uniqueUsers: number }> {
    const days = 30;
    const activity = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const logins = Math.floor(Math.random() * 25) + 5;
      activity.push({
        date: this.formatDate(date),
        logins,
        uniqueUsers: Math.floor(logins * 0.8) // Assume 80% de usuários únicos
      });
    }

    return activity;
  }

  /**
   * Calcula mudança percentual entre dois valores
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Converte métricas para formato CSV
   */
  private convertMetricsToCSV(metrics: MetricsData): string {
    // Implementação simplificada para demonstração
    const lines = [
      'Categoria,Métrica,Valor',
      `Documentos,Total,${metrics.documents.total}`,
      `Documentos,Concluídos,${metrics.documents.byStatus.completed}`,
      `Documentos,Tamanho Total (MB),${Math.round(metrics.documents.totalSize / 1024 / 1024)}`,
      `Análises,Total,${metrics.analyses.total}`,
      `Análises,Taxa de Sucesso,${metrics.analyses.successRate}%`,
      `Análises,Confiança Média,${metrics.analyses.avgConfidence}`,
      `Usuários,Total,${metrics.users.total}`,
      `Usuários,Ativos,${metrics.users.active}`,
      `Sistema,Uso de Storage (MB),${Math.round(metrics.system.storageUsed / 1024 / 1024)}`,
      `Sistema,CPU (%),${metrics.system.cpuUsage}`,
      `NLP,Textos Processados,${metrics.nlp.totalTextsProcessed}`,
      `NLP,Sentimento Positivo,${metrics.nlp.sentimentDistribution.positive}`
    ];

    return lines.join('\n');
  }

  /**
   * Converte métricas para formato Excel (mock)
   */
  private convertMetricsToExcel(metrics: MetricsData): string {
    // Em produção, você usaria uma biblioteca como xlsx
    // Por enquanto, retorna dados em formato simplificado
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Formata data para string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export const metricsService = new MetricsService();
export default metricsService;
