import { Report } from '../types';
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

export class ReportController {
  /**
   * Lista relatórios com filtros avançados e paginação
   */
  async listReports(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        type,
        createdBy,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      logger.info(`Listando relatórios - página ${pageNumber}, limite ${limitNumber}`);

      // Mock de relatórios para demonstração
      const mockReports = [
        {
          id: '1',
          title: 'Relatório de Análises - Janeiro 2025',
          description: 'Compilação das análises realizadas em janeiro',
          type: 'ANALYSIS_SUMMARY',
          status: 'COMPLETED',
          createdBy: req.user?.id || 'user1',
          config: {
            dateRange: {
              start: '2025-01-01',
              end: '2025-01-31'
            },
            includeCharts: true,
            includeDetails: true
          },
          data: {
            totalDocuments: 15,
            totalAnalyses: 25,
            avgConfidence: 0.85,
            topKeywords: ['reunião', 'projeto', 'planejamento']
          },
          filePath: '/reports/relatorio_janeiro_2025.pdf',
          fileSize: 2048000,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user1',
            name: 'João Silva',
            email: 'joao@empresa.com'
          }
        },
        {
          id: '2',
          title: 'Relatório de Métricas - Q4 2024',
          description: 'Métricas consolidadas do quarto trimestre',
          type: 'METRICS',
          status: 'GENERATING',
          createdBy: req.user?.id || 'user1',
          config: {
            dateRange: {
              start: '2024-10-01',
              end: '2024-12-31'
            },
            includeComparison: true
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user1',
            name: 'João Silva',
            email: 'joao@empresa.com'
          }
        }
      ];

      const total = mockReports.length;
      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        reports: mockReports,
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
      logger.error('Erro ao listar relatórios:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar relatórios'
      });
    }
  }

  /**
   * Obtém um relatório específico
   */
  async getReport(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;

      logger.info(`Buscando relatório ${id}`);

      // Mock de relatório completo
      const mockReport = {
        id,
        title: 'Relatório de Análises - Janeiro 2025',
        description: 'Compilação detalhada das análises realizadas durante o mês de janeiro de 2025',
        type: 'ANALYSIS_SUMMARY',
        status: 'COMPLETED',
        createdBy: req.user?.id || 'user1',
        config: {
          dateRange: {
            start: '2025-01-01',
            end: '2025-01-31'
          },
          includeCharts: true,
          includeDetails: true,
          documentIds: ['doc1', 'doc2', 'doc3'],
          analysisTypes: ['FULL', 'SUMMARY']
        },
        data: {
          summary: {
            totalDocuments: 15,
            totalAnalyses: 25,
            totalSize: 51200000,
            avgConfidence: 0.85,
            avgProcessingTime: 3500
          },
          byStatus: {
            completed: 22,
            failed: 3
          },
          byType: {
            FULL: 15,
            SUMMARY: 8,
            KEYWORDS: 2
          },
          topKeywords: [
            { keyword: 'reunião', frequency: 18 },
            { keyword: 'projeto', frequency: 15 },
            { keyword: 'planejamento', frequency: 12 }
          ],
          sentimentDistribution: {
            POSITIVE: 15,
            NEUTRAL: 8,
            NEGATIVE: 2
          },
          topTopics: [
            { topic: 'Planejamento de Projetos', avgRelevance: 0.85 },
            { topic: 'Recursos Humanos', avgRelevance: 0.72 }
          ],
          timelineData: [
            { date: '2025-01-01', analyses: 3 },
            { date: '2025-01-02', analyses: 5 },
            { date: '2025-01-03', analyses: 2 }
          ],
          participantStats: {
            mostActive: ['João Silva', 'Maria Santos'],
            totalUnique: 25
          }
        },
        filePath: '/reports/relatorio_janeiro_2025.pdf',
        fileSize: 2048000,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user1',
          name: 'João Silva',
          email: 'joao@empresa.com'
        }
      };

      if (!mockReport) {
        return res.status(404).json({ 
          error: 'Relatório não encontrado' 
        });
      }

      res.json(mockReport);
    } catch (error) {
      logger.error('Erro ao buscar relatório:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar relatório'
      });
    }
  }

  /**
   * Cria um novo relatório
   */
  async createReport(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { 
        title, 
        description, 
        type, 
        config = {} 
      } = req.body;
      const userId = req.user?.id;

      // Validações
      if (!title || !type) {
        return res.status(400).json({ 
          error: 'Título e tipo são obrigatórios' 
        });
      }

      if (!this.isValidReportType(type)) {
        return res.status(400).json({ 
          error: 'Tipo de relatório inválido. Tipos válidos: ANALYSIS_SUMMARY, DOCUMENT_SUMMARY, METRICS, COMPARISON, TIMELINE' 
        });
      }

      // Validar configuração específica do tipo
      const configValidation = this.validateReportConfig(type, config);
      if (!configValidation.valid) {
        return res.status(400).json({ 
          error: configValidation.error 
        });
      }

      logger.info(`Criando relatório do tipo ${type} pelo usuário ${userId}`);

      // Criar novo relatório
      const newReport = {
        id: `report_${Date.now()}`,
        title,
        description: description || `Relatório ${type} gerado automaticamente`,
        type,
        status: 'GENERATING',
        createdBy: userId,
        config: this.normalizeReportConfig(type, config),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Iniciar geração assíncrona
      this.generateReportAsync(newReport.id, newReport);

      logger.info(`Relatório ${newReport.id} criado e adicionado à fila de geração`);

      res.status(201).json({
        message: 'Relatório criado com sucesso',
        report: newReport
      });
    } catch (error) {
      logger.error('Erro ao criar relatório:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao criar relatório'
      });
    }
  }

  /**
   * Exclui um relatório
   */
  async deleteReport(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      logger.info(`Tentativa de exclusão do relatório ${id} pelo usuário ${userId}`);

      // Mock de verificação de relatório
      const mockReport = {
        id,
        createdBy: userId, // Para simular permissão
        status: 'COMPLETED',
        filePath: '/reports/relatorio.pdf'
      };

      if (!mockReport) {
        return res.status(404).json({ 
          error: 'Relatório não encontrado' 
        });
      }

      // Verificar permissões
      if (mockReport.createdBy !== userId && userRole !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Sem permissão para excluir este relatório' 
        });
      }

      // Verificar se pode ser excluído
      if (mockReport.status === 'GENERATING') {
        return res.status(400).json({ 
          error: 'Não é possível excluir relatório em geração' 
        });
      }

      // Simular exclusão do arquivo físico
      if (mockReport.filePath) {
        try {
          logger.info(`Simulando exclusão do arquivo: ${mockReport.filePath}`);
        } catch (fileError) {
          logger.warn(`Arquivo físico não encontrado: ${mockReport.filePath}`, fileError);
        }
      }

      logger.info(`Relatório ${id} excluído pelo usuário ${userId}`);

      res.json({ 
        message: 'Relatório excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir relatório:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir relatório'
      });
    }
  }

  /**
   * Baixa um relatório em PDF
   */
  async downloadReport(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      logger.info(`Download do relatório ${id} solicitado pelo usuário ${userId}`);

      // Mock de verificação de relatório
      const mockReport = {
        id,
        status: 'COMPLETED',
        filePath: '/reports/relatorio.pdf',
        fileSize: 2048000,
        title: 'Relatório de Análises'
      };

      if (!mockReport) {
        return res.status(404).json({ 
          error: 'Relatório não encontrado' 
        });
      }

      if (mockReport.status !== 'COMPLETED') {
        return res.status(400).json({ 
          error: 'Relatório ainda não foi gerado completamente' 
        });
      }

      if (!mockReport.filePath) {
        return res.status(404).json({ 
          error: 'Arquivo do relatório não encontrado' 
        });
      }

      // Simular download
      logger.info(`Simulando download do arquivo: ${mockReport.filePath}`);

      res.json({
        message: 'Download iniciado',
        report: {
          id: mockReport.id,
          title: mockReport.title,
          fileSize: mockReport.fileSize,
          downloadUrl: `http://localhost:3001/api/reports/${id}/download`
        }
      });
    } catch (error) {
      logger.error('Erro no download do relatório:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha no download do relatório'
      });
    }
  }

  /**
   * Estatísticas de relatórios
   */
  async getReportStats(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      logger.info(`Buscando estatísticas de relatórios para usuário ${userId} (admin: ${isAdmin})`);

      // Mock de estatísticas
      const mockStats = {
        total: 12,
        byStatus: {
          completed: 8,
          generating: 2,
          failed: 1,
          pending: 1
        },
        byType: {
          ANALYSIS_SUMMARY: 5,
          DOCUMENT_SUMMARY: 3,
          METRICS: 2,
          COMPARISON: 1,
          TIMELINE: 1
        },
        totalFileSize: 24576000, // ~24MB
        avgGenerationTime: 15000, // 15 segundos
        recentReports: [
          {
            id: '1',
            title: 'Relatório de Análises - Janeiro 2025',
            type: 'ANALYSIS_SUMMARY',
            status: 'COMPLETED',
            fileSize: 2048000,
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'Métricas Consolidadas',
            type: 'METRICS',
            status: 'GENERATING',
            createdAt: new Date()
          }
        ]
      };

      res.json(mockStats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de relatórios:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Obtém templates de relatório disponíveis
   */
  async getReportTemplates(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      logger.info('Buscando templates de relatório disponíveis');

      const templates = [
        {
          type: 'ANALYSIS_SUMMARY',
          name: 'Resumo de Análises',
          description: 'Compilação das análises realizadas em um período',
          fields: [
            { name: 'dateRange', type: 'dateRange', required: true, label: 'Período' },
            { name: 'documentIds', type: 'multiselect', required: false, label: 'Documentos específicos' },
            { name: 'analysisTypes', type: 'multiselect', required: false, label: 'Tipos de análise' },
            { name: 'includeCharts', type: 'boolean', default: true, label: 'Incluir gráficos' },
            { name: 'includeDetails', type: 'boolean', default: false, label: 'Incluir detalhes' }
          ]
        },
        {
          type: 'DOCUMENT_SUMMARY',
          name: 'Resumo de Documentos',
          description: 'Visão geral dos documentos processados',
          fields: [
            { name: 'dateRange', type: 'dateRange', required: true, label: 'Período' },
            { name: 'status', type: 'select', options: ['ALL', 'COMPLETED', 'ERROR'], default: 'ALL', label: 'Status' },
            { name: 'includeMetadata', type: 'boolean', default: true, label: 'Incluir metadados' }
          ]
        },
        {
          type: 'METRICS',
          name: 'Métricas Consolidadas',
          description: 'Indicadores de desempenho e uso do sistema',
          fields: [
            { name: 'dateRange', type: 'dateRange', required: true, label: 'Período' },
            { name: 'includeComparison', type: 'boolean', default: false, label: 'Incluir comparação com período anterior' },
            { name: 'groupBy', type: 'select', options: ['DAY', 'WEEK', 'MONTH'], default: 'DAY', label: 'Agrupar por' }
          ]
        },
        {
          type: 'COMPARISON',
          name: 'Comparação de Análises',
          description: 'Comparação entre múltiplas análises ou períodos',
          fields: [
            { name: 'analysisIds', type: 'multiselect', required: true, label: 'Análises para comparar' },
            { name: 'compareBy', type: 'multiselect', options: ['SENTIMENT', 'KEYWORDS', 'TOPICS', 'ENTITIES'], required: true, label: 'Comparar por' }
          ]
        },
        {
          type: 'TIMELINE',
          name: 'Timeline de Atividades',
          description: 'Linha do tempo das atividades e análises',
          fields: [
            { name: 'dateRange', type: 'dateRange', required: true, label: 'Período' },
            { name: 'granularity', type: 'select', options: ['HOUR', 'DAY', 'WEEK'], default: 'DAY', label: 'Granularidade' },
            { name: 'includeEvents', type: 'boolean', default: true, label: 'Incluir eventos importantes' }
          ]
        }
      ];

      res.json({ templates });
    } catch (error) {
      logger.error('Erro ao buscar templates:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar templates'
      });
    }
  }

  /**
   * Valida se o tipo de relatório é válido
   */
  private isValidReportType(type: string): boolean {
    const validTypes = ['ANALYSIS_SUMMARY', 'DOCUMENT_SUMMARY', 'METRICS', 'COMPARISON', 'TIMELINE'];
    return validTypes.includes(type);
  }

  /**
   * Valida configuração do relatório
   */
  private validateReportConfig(type: string, config: any): { valid: boolean; error?: string } {
    switch (type) {
      case 'ANALYSIS_SUMMARY':
      case 'DOCUMENT_SUMMARY':
      case 'METRICS':
      case 'TIMELINE':
        if (!config.dateRange || !config.dateRange.start || !config.dateRange.end) {
          return { valid: false, error: 'Período (dateRange) é obrigatório para este tipo de relatório' };
        }
        break;
      
      case 'COMPARISON':
        if (!config.analysisIds || !Array.isArray(config.analysisIds) || config.analysisIds.length < 2) {
          return { valid: false, error: 'Pelo menos 2 análises são necessárias para comparação' };
        }
        if (!config.compareBy || !Array.isArray(config.compareBy) || config.compareBy.length === 0) {
          return { valid: false, error: 'Critérios de comparação são obrigatórios' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Normaliza configuração do relatório
   */
  private normalizeReportConfig(type: string, config: any): any {
    const normalized = { ...config };

    // Configurações padrão por tipo
    switch (type) {
      case 'ANALYSIS_SUMMARY':
        normalized.includeCharts = normalized.includeCharts !== false;
        normalized.includeDetails = normalized.includeDetails === true;
        break;
      
      case 'DOCUMENT_SUMMARY':
        normalized.includeMetadata = normalized.includeMetadata !== false;
        break;
      
      case 'METRICS':
        normalized.includeComparison = normalized.includeComparison === true;
        normalized.groupBy = normalized.groupBy || 'DAY';
        break;
      
      case 'TIMELINE':
        normalized.granularity = normalized.granularity || 'DAY';
        normalized.includeEvents = normalized.includeEvents !== false;
        break;
    }

    return normalized;
  }

  /**
   * Gera um relatório de forma assíncrona
   */
  private async generateReportAsync(reportId: string, reportData: any): Promise<void> {
    try {
      logger.info(`Iniciando geração assíncrona do relatório ${reportId}`);
      
      // Simular processamento de geração
      await this.mockReportGeneration(reportData);
      
      logger.info(`Relatório ${reportId} gerado com sucesso`);
      
      // Aqui você atualizaria o status no banco
      // await updateReportStatus(reportId, 'COMPLETED', generatedData);
    } catch (error) {
      logger.error(`Erro na geração do relatório ${reportId}:`, error);
      
      // Aqui você atualizaria o status para erro no banco
      // await updateReportStatus(reportId, 'FAILED', null, error.message);
    }
  }

  /**
   * Simula geração de relatório
   */
  private async mockReportGeneration(reportData: any): Promise<any> {
    // Simular tempo de processamento
    await new Promise(resolve => {
      // Simular processamento sem usar setTimeout
      logger.info(`Processando relatório: ${reportData.title}`);
      resolve(null);
    });

    // Retornar dados mock do relatório gerado
    return {
      filePath: `/reports/${reportData.id}.pdf`,
      fileSize: 2048000,
      generatedAt: new Date()
    };
  }
}

export default new ReportController();
