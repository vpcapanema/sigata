import { Request, Response } from 'express';
import { database } from '../config/database';
import { SIGATANLPStorage } from '../services/nlpStorageService';

export class AnalyticsController {
  private nlpStorageService: SIGATANLPStorage;

  constructor() {
    this.nlpStorageService = new SIGATANLPStorage();
  }

  public async basicStats(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      
      // Consultar estatísticas usando view otimizada
      const stats = await database.query(`
        SELECT 
          usuarios_ativos,
          total_documentos,
          total_atas,
          atualizado_em
        FROM sigata.v_stats_basico
      `);
      
      // Estatísticas adicionais de processamento
      const processamento = await database.query(`
        SELECT 
          COUNT(*) as total_processamentos,
          AVG(qualidade_media_geral) as qualidade_media,
          COUNT(CASE WHEN status_geracao = 'CONCLUIDO' THEN 1 END) as relatorios_completos,
          COUNT(CASE WHEN status_geracao = 'PENDENTE' THEN 1 END) as relatorios_pendentes
        FROM sigata.v_relatorios_dashboard
      `);
      
      res.json({
        success: true,
        message: 'Estatísticas do sistema recuperadas com sucesso',
        data: {
          sistema: stats.rows[0] || {
            usuarios_ativos: 0,
            total_documentos: 0,
            total_atas: 0,
            atualizado_em: new Date().toISOString()
          },
          processamento: processamento.rows[0] || {
            total_processamentos: 0,
            qualidade_media: 0,
            relatorios_completos: 0,
            relatorios_pendentes: 0
          },
          consulta_executada: new Date().toISOString(),
          banco_conectado: true,
          versao_sistema: "SIGATA v1.0"
        }
      });
    } catch (error) {
      console.error('Erro ao consultar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar estatísticas do sistema',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async userDashboard(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      const userId = req.params.userId;
      
      // Estatísticas do usuário
      const userStats = await database.query(`
        SELECT 
          COUNT(db.id) as total_documentos,
          COUNT(CASE WHEN db.status_processamento = 'CONCLUIDO' THEN 1 END) as documentos_processados,
          COUNT(CASE WHEN db.status_processamento = 'PENDENTE' THEN 1 END) as documentos_pendentes,
          COUNT(CASE WHEN db.status_processamento = 'ERRO' THEN 1 END) as documentos_erro,
          COALESCE(SUM(da.tamanho_arquivo_bytes), 0) as total_bytes_enviados
        FROM sigata.documento_base db
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        WHERE db.usuario_upload_id = $1 AND db.data_exclusao IS NULL
      `, [userId]);
      
      // Documentos recentes do usuário (últimos 5)
      const recentDocs = await database.query(`
        SELECT 
          db.id,
          db.codigo_documento,
          db.titulo_documento,
          db.tipo_documento,
          db.status_processamento,
          db.data_upload,
          da.nome_arquivo_original,
          da.tamanho_arquivo_bytes
        FROM sigata.documento_base db
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        WHERE db.usuario_upload_id = $1 AND db.data_exclusao IS NULL
        ORDER BY db.data_upload DESC
        LIMIT 5
      `, [userId]);
      
      // Atividades recentes (simulado baseado em documentos)
      const activities = recentDocs.rows.map(doc => ({
        tipo: 'upload',
        descricao: `Upload do arquivo ${doc.nome_arquivo_original}`,
        data: doc.data_upload,
        status: doc.status_processamento
      }));
      
      const stats = userStats.rows[0];
      const totalDocs = parseInt(stats.total_documentos);
      const processedDocs = parseInt(stats.documentos_processados);
      const successRate = totalDocs > 0 ? (processedDocs / totalDocs * 100) : 0;
      
      res.json({
        success: true,
        message: 'Dados do dashboard recuperados com sucesso',
        data: {
          estatisticas: {
            total_documentos: totalDocs,
            documentos_processados: processedDocs,
            documentos_pendentes: parseInt(stats.documentos_pendentes),
            documentos_erro: parseInt(stats.documentos_erro),
            total_bytes_enviados: parseInt(stats.total_bytes_enviados),
            taxa_sucesso: successRate.toFixed(1)
          },
          documentos_recentes: recentDocs.rows,
          atividades_recentes: activities,
          consulta_executada: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dados do dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async reportResults(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      
      // Query otimizada usando a view dashboard
      const relatorios = await database.query(`
        SELECT 
          relatorio_id,
          codigo_relatorio,
          titulo_relatorio,
          data_inicio_periodo,
          data_fim_periodo,
          tipo_periodo,
          escopo_relatorio,
          total_atas_analisadas,
          data_geracao,
          resumo_geral_periodo,
          sentimento_geral_periodo,
          qualidade_media_geral,
          metrica_performance_media,
          tempo_processamento_total_ms,
          formato_relatorio,
          status_geracao,
          periodo_formatado,
          gerado_por_username
        FROM sigata.v_relatorios_dashboard 
        ORDER BY data_geracao DESC 
        LIMIT 20
      `);
      
      res.json({
        success: true,
        message: 'Dados de relatórios recuperados com sucesso',
        data: {
          relatorios: relatorios.rows,
          total_encontrados: relatorios.rows.length,
          consulta_executada: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao consultar relatórios:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar dados de relatórios',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async analysis(req: Request, res: Response): Promise<void> {
    const analyticsData = {
      entities: [
        { type: 'PERSON', value: 'João Silva', count: 15, category: 'person' },
        { type: 'PERSON', value: 'Maria Santos', count: 12, category: 'person' },
        { type: 'ORG', value: 'ACME Corp', count: 8, category: 'org' },
        { type: 'LOCATION', value: 'São Paulo', count: 6, category: 'location' },
        { type: 'DATE', value: '2025-01-15', count: 4, category: 'date' }
      ],
      keywords: [
        { word: 'projeto', frequency: 25, weight: 1.0 },
        { word: 'reunião', frequency: 20, weight: 0.8 },
        { word: 'desenvolvimento', frequency: 15, weight: 0.6 },
        { word: 'equipe', frequency: 12, weight: 0.5 },
        { word: 'prazo', frequency: 10, weight: 0.4 }
      ],
      sentiments: [
        { sentiment: 'positive', count: 15, percentage: 60 },
        { sentiment: 'neutral', count: 8, percentage: 32 },
        { sentiment: 'negative', count: 2, percentage: 8 }
      ],
      topics: [
        { topic: 'Gestão de Projetos', count: 12, percentage: 40 },
        { topic: 'Desenvolvimento', count: 8, percentage: 27 },
        { topic: 'Recursos Humanos', count: 6, percentage: 20 },
        { topic: 'Financeiro', count: 4, percentage: 13 }
      ],
      participants: [
        { name: 'João Silva', mentions: 15, role: 'Gerente' },
        { name: 'Maria Santos', mentions: 12, role: 'Desenvolvedora' },
        { name: 'Pedro Costa', mentions: 8, role: 'Analista' }
      ],
      documents: [
        {
          name: 'Ata_Reunião_01.pdf',
          entities: 8,
          keywords: 12,
          sentiment: 0.7,
          topics: ['Gestão', 'Desenvolvimento'],
          participants: 4,
          relevance: 0.85
        }
      ]
    };

    res.json(analyticsData);
  }

  public async advancedReport(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      
      const report = await this.nlpStorageService.getConsolidatedReport(startDate, endDate);
      
      res.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório avançado'
      });
    }
  }
}
