import { AnalysisStatus, Analysis, Document } from '../types';
import logger from '../utils/logger';
import nlpService, { NLPResult } from '../services/nlpService';

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

export class AnalysisController {
  /**
   * Lista análises com filtros avançados e paginação
   */
  async listAnalyses(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        type,
        documentId,
        analyzedBy,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      logger.info(`Listando análises - página ${pageNumber}, limite ${limitNumber}`);

      // Mock de análises para demonstração
      const mockAnalyses = [
        {
          id: '1',
          documentId: 'doc1',
          analyzedBy: req.user?.id || 'user1',
          status: AnalysisStatus.COMPLETED,
          type: 'FULL',
          results: {
            summary: 'Reunião de planejamento com discussão de metas',
            keywords: ['planejamento', 'metas', 'projeto'],
            sentiment: { score: 0.7, label: 'POSITIVE' }
          },
          confidence: 0.85,
          processingTime: 3500,
          createdAt: new Date(),
          updatedAt: new Date(),
          document: {
            id: 'doc1',
            filename: 'ata_reuniao_01.pdf',
            originalName: 'Ata da Reunião - Janeiro 2025.pdf'
          },
          user: {
            id: 'user1',
            name: 'João Silva',
            email: 'joao@empresa.com'
          }
        }
      ];

      const total = mockAnalyses.length;
      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        analyses: mockAnalyses,
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
      logger.error('Erro ao listar análises:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar análises'
      });
    }
  }

  /**
   * Obtém uma análise específica com detalhes completos
   */
  async getAnalysis(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;

      logger.info(`Buscando análise ${id}`);

      // Mock de análise completa
      const mockAnalysis = {
        id,
        documentId: 'doc1',
        analyzedBy: req.user?.id || 'user1',
        status: AnalysisStatus.COMPLETED,
        type: 'FULL',
        results: {
          summary: 'Reunião de planejamento para discussão de metas e objetivos do trimestre. Foram definidas estratégias de crescimento e alocação de recursos.',
          keywords: ['planejamento', 'metas', 'trimestre', 'estratégias', 'crescimento', 'recursos'],
          entities: [
            { text: 'João Silva', label: 'PERSON', confidence: 0.95 },
            { text: 'Projeto Alpha', label: 'PROJECT', confidence: 0.89 },
            { text: '09/01/2025', label: 'DATE', confidence: 0.98 }
          ],
          sentiment: {
            score: 0.7,
            magnitude: 0.8,
            label: 'POSITIVE'
          },
          topics: [
            { topic: 'Planejamento de Projetos', relevance: 0.85 },
            { topic: 'Recursos Humanos', relevance: 0.65 }
          ],
          participants: ['João Silva', 'Maria Santos', 'Carlos Lima'],
          decisions: [
            'Aprovação do orçamento anual para o projeto',
            'Contratação de dois novos desenvolvedores'
          ],
          actionItems: [
            { 
              item: 'Preparar relatório mensal de progresso', 
              responsible: 'João Silva', 
              deadline: '2025-01-15' 
            }
          ],
          meetingData: {
            date: '2025-01-09',
            duration: '2 horas',
            location: 'Sala de Reuniões A',
            attendees: 3
          }
        },
        confidence: 0.85,
        processingTime: 3500,
        createdAt: new Date(),
        updatedAt: new Date(),
        document: {
          id: 'doc1',
          filename: 'ata_reuniao_01.pdf',
          originalName: 'Ata da Reunião - Janeiro 2025.pdf',
          extractedText: 'Texto extraído da reunião...'
        },
        user: {
          id: 'user1',
          name: 'João Silva',
          email: 'joao@empresa.com'
        }
      };

      if (!mockAnalysis) {
        return res.status(404).json({ 
          error: 'Análise não encontrada' 
        });
      }

      res.json(mockAnalysis);
    } catch (error) {
      logger.error('Erro ao buscar análise:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar análise'
      });
    }
  }

  /**
   * Cria uma nova análise
   */
  async createAnalysis(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { documentId, type = 'FULL' } = req.body;
      const userId = req.user?.id;

      if (!documentId) {
        return res.status(400).json({ 
          error: 'ID do documento é obrigatório' 
        });
      }

      if (!this.isValidAnalysisType(type)) {
        return res.status(400).json({ 
          error: 'Tipo de análise inválido. Tipos válidos: FULL, SUMMARY, KEYWORDS, ENTITIES, SENTIMENT, TOPICS, MEETING_DATA' 
        });
      }

      logger.info(`Criando análise do tipo ${type} para documento ${documentId} pelo usuário ${userId}`);

      // Mock de verificação de documento
      const mockDocument = {
        id: documentId,
        filename: 'documento.pdf',
        status: 'COMPLETED',
        extractedText: 'Texto extraído...'
      };

      if (!mockDocument) {
        return res.status(404).json({ 
          error: 'Documento não encontrado' 
        });
      }

      if (mockDocument.status !== 'COMPLETED') {
        return res.status(400).json({ 
          error: 'Documento ainda não foi processado completamente' 
        });
      }

      // Criar nova análise
      const newAnalysis = {
        id: `analysis_${Date.now()}`,
        documentId,
        analyzedBy: userId,
        status: AnalysisStatus.PENDING,
        type,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Iniciar processamento assíncrono
      this.processAnalysisAsync(newAnalysis.id, type, mockDocument);

      logger.info(`Análise ${newAnalysis.id} criada e adicionada à fila de processamento`);

      res.status(201).json({
        message: 'Análise criada com sucesso',
        analysis: newAnalysis
      });
    } catch (error) {
      logger.error('Erro ao criar análise:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao criar análise'
      });
    }
  }

  /**
   * Exclui uma análise
   */
  async deleteAnalysis(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      logger.info(`Tentativa de exclusão da análise ${id} pelo usuário ${userId}`);

      // Mock de verificação de análise
      const mockAnalysis = {
        id,
        analyzedBy: userId, // Para simular permissão
        status: AnalysisStatus.COMPLETED
      };

      if (!mockAnalysis) {
        return res.status(404).json({ 
          error: 'Análise não encontrada' 
        });
      }

      // Verificar permissões
      if (mockAnalysis.analyzedBy !== userId && userRole !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Sem permissão para excluir esta análise' 
        });
      }

      // Verificar se pode ser excluída
      if (mockAnalysis.status === AnalysisStatus.IN_PROGRESS) {
        return res.status(400).json({ 
          error: 'Não é possível excluir análise em processamento' 
        });
      }

      logger.info(`Análise ${id} excluída pelo usuário ${userId}`);

      res.json({ 
        message: 'Análise excluída com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir análise:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir análise'
      });
    }
  }

  /**
   * Reprocessa uma análise
   */
  async reprocessAnalysis(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      logger.info(`Reprocessamento da análise ${id} solicitado pelo usuário ${userId}`);

      // Mock de verificação de análise
      const mockAnalysis = {
        id,
        documentId: 'doc1',
        analyzedBy: userId,
        type: 'FULL',
        status: AnalysisStatus.COMPLETED
      };

      if (!mockAnalysis) {
        return res.status(404).json({ 
          error: 'Análise não encontrada' 
        });
      }

      // Verificar permissões
      if (mockAnalysis.analyzedBy !== userId && userRole !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Sem permissão para reprocessar esta análise' 
        });
      }

      // Verificar se pode ser reprocessada
      if (mockAnalysis.status === AnalysisStatus.IN_PROGRESS) {
        return res.status(400).json({ 
          error: 'Análise já está em processamento' 
        });
      }

      // Mock de documento
      const mockDocument = {
        id: mockAnalysis.documentId,
        extractedText: 'Texto extraído do documento...'
      };

      // Iniciar reprocessamento
      this.processAnalysisAsync(id, mockAnalysis.type, mockDocument);

      logger.info(`Análise ${id} adicionada à fila de reprocessamento`);

      res.json({
        message: 'Análise adicionada à fila de reprocessamento',
        analysis: {
          ...mockAnalysis,
          status: AnalysisStatus.PENDING,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao reprocessar análise:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao reprocessar análise'
      });
    }
  }

  /**
   * Estatísticas de análises do usuário
   */
  async getAnalysisStats(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      logger.info(`Buscando estatísticas de análises para usuário ${userId} (admin: ${isAdmin})`);

      // Mock de estatísticas
      const mockStats = {
        total: 25,
        byStatus: {
          pending: 3,
          in_progress: 2,
          completed: 18,
          failed: 2
        },
        byType: {
          FULL: 15,
          SUMMARY: 5,
          KEYWORDS: 3,
          ENTITIES: 2
        },
        avgProcessingTime: 4200, // em milissegundos
        avgConfidence: 0.82,
        recentAnalyses: [
          {
            id: '1',
            type: 'FULL',
            status: AnalysisStatus.COMPLETED,
            confidence: 0.85,
            processingTime: 3500,
            createdAt: new Date(),
            document: {
              filename: 'ata_reuniao_01.pdf'
            }
          },
          {
            id: '2',
            type: 'SUMMARY',
            status: AnalysisStatus.IN_PROGRESS,
            createdAt: new Date(),
            document: {
              filename: 'ata_reuniao_02.pdf'
            }
          }
        ]
      };

      res.json(mockStats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Compara resultados de múltiplas análises
   */
  async compareAnalyses(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { analysisIds } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(analysisIds) || analysisIds.length < 2 || analysisIds.length > 5) {
        return res.status(400).json({ 
          error: 'Deve fornecer entre 2 e 5 IDs de análises para comparação' 
        });
      }

      logger.info(`Comparando análises ${analysisIds.join(', ')} para usuário ${userId}`);

      // Mock de análises para comparação
      const mockAnalyses = analysisIds.map((id: string, index: number) => ({
        id,
        type: 'FULL',
        results: {
          summary: `Resumo da análise ${index + 1}`,
          keywords: [`keyword${index}1`, `keyword${index}2`, `keyword${index}3`],
          sentiment: {
            score: 0.6 + (index * 0.1),
            label: index % 2 === 0 ? 'POSITIVE' : 'NEUTRAL'
          },
          topics: [
            { topic: 'Planejamento de Projetos', relevance: 0.8 + (index * 0.05) },
            { topic: 'Recursos Humanos', relevance: 0.6 + (index * 0.1) }
          ]
        },
        confidence: 0.8 + (index * 0.05),
        processingTime: 3000 + (index * 500),
        document: {
          filename: `documento_${index + 1}.pdf`
        }
      }));

      // Calcular métricas de comparação
      const comparison = {
        analyses: mockAnalyses,
        comparison: {
          avgConfidence: mockAnalyses.reduce((sum, a) => sum + a.confidence, 0) / mockAnalyses.length,
          avgProcessingTime: mockAnalyses.reduce((sum, a) => sum + a.processingTime, 0) / mockAnalyses.length,
          sentimentDistribution: this.calculateSentimentDistribution(mockAnalyses),
          commonKeywords: this.findCommonKeywords(mockAnalyses),
          topicSimilarity: this.calculateTopicSimilarity(mockAnalyses)
        }
      };

      res.json(comparison);
    } catch (error) {
      logger.error('Erro ao comparar análises:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao comparar análises'
      });
    }
  }

  /**
   * Valida se o tipo de análise é válido
   */
  private isValidAnalysisType(type: string): boolean {
    const validTypes = ['FULL', 'SUMMARY', 'KEYWORDS', 'ENTITIES', 'SENTIMENT', 'TOPICS', 'MEETING_DATA'];
    return validTypes.includes(type);
  }

  /**
   * Processa uma análise de forma assíncrona
   */
  private async processAnalysisAsync(analysisId: string, type: string, document: any): Promise<void> {
    try {
      logger.info(`Iniciando processamento assíncrono da análise ${analysisId}`);
      
      // Simular processamento
      const result = await nlpService.analyzeDocument(analysisId);
      
      logger.info(`Análise ${analysisId} processada com sucesso`);
      
      // Aqui você atualizaria o status no banco
      // await updateAnalysisStatus(analysisId, AnalysisStatus.COMPLETED, result);
    } catch (error) {
      logger.error(`Erro no processamento da análise ${analysisId}:`, error);
      
      // Aqui você atualizaria o status para erro no banco
      // await updateAnalysisStatus(analysisId, AnalysisStatus.FAILED, null, error.message);
    }
  }

  /**
   * Calcula distribuição de sentimentos
   */
  private calculateSentimentDistribution(analyses: any[]): any {
    const sentiments = analyses.map(a => a.results.sentiment?.label).filter(Boolean);
    const distribution: { [key: string]: number } = {};
    
    sentiments.forEach(sentiment => {
      distribution[sentiment] = (distribution[sentiment] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Encontra palavras-chave comuns
   */
  private findCommonKeywords(analyses: any[]): string[] {
    const allKeywords = analyses.flatMap(a => a.results.keywords || []);
    const keywordCount: { [key: string]: number } = {};
    
    allKeywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });

    return Object.entries(keywordCount)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * Calcula similaridade de tópicos
   */
  private calculateTopicSimilarity(analyses: any[]): any {
    const allTopics = analyses.flatMap(a => a.results.topics || []);
    const topicRelevance: { [key: string]: number[] } = {};
    
    allTopics.forEach(topic => {
      if (!topicRelevance[topic.topic]) {
        topicRelevance[topic.topic] = [];
      }
      topicRelevance[topic.topic].push(topic.relevance);
    });

    return Object.entries(topicRelevance)
      .map(([topic, relevances]) => ({
        topic,
        avgRelevance: relevances.reduce((sum, r) => sum + r, 0) / relevances.length,
        frequency: relevances.length
      }))
      .sort((a, b) => b.avgRelevance - a.avgRelevance);
  }
}

export default new AnalysisController();
