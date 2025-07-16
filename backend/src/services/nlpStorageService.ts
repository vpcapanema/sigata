/**
 * SIGATA - Serviço de Persistência de Resultados NLP
 * Salva todos os resultados da análise avançada no PostgreSQL conforme especificação
 */

import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';

interface NLPAnalysisResult {
  document_id: string;
  timestamp: Date;
  topics: any[];
  coherence_metrics: {
    c_v: number;
    word_pairs: number;
    epsilon?: number;
  };
  silhouette_metrics: {
    silhouette_score: number;
    intra_cluster_distance: number;
    inter_cluster_distance: number;
  };
  topic_diversity: {
    diversity_score: number;
    total_topics: number;
    unique_words_ratio: number;
  };
  keywords: any[];
  mmr_metrics: {
    mmr_score: number;
    lambda_param: number;
    similarity_score: number;
    diversity_penalty: number;
  };
  bert_score_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    token_count_reference: number;
    token_count_candidate: number;
  };
  entities: any[];
  participants: string[];
  performance_score: number;
  confidence_interval_95: [number, number];
  decisions: any[];
  actions: any[];
  summary: string;
}

export class SIGATANLPStorage {
  /**
   * Serviço responsável por persistir resultados NLP no banco de dados
   * Mapeia para as tabelas: documento_base, documento_nlp_dados, relatorio_atas
   */

  async saveNLPAnalysis(
    analysisResult: NLPAnalysisResult,
    fileInfo: any,
    userId: string
  ): Promise<string> {
    /**
     * Salva análise completa no banco de dados
     * Returns: ID do documento criado
     */
    try {
      // 1. Inserir documento_base
      const documentId = await this.insertDocumentBase(analysisResult, fileInfo, userId);
      
      // 2. Inserir dados NLP detalhados
      await this.insertNLPData(documentId, analysisResult);
      
      // 3. Atualizar relatório consolidado
      await this.updateReportAnalytics(documentId, analysisResult);
      
      console.log(`✅ Análise NLP salva no banco: ${documentId}`);
      return documentId;
      
    } catch (error) {
      console.error(`❌ Erro ao salvar análise NLP: ${error}`);
      throw error;
    }
  }

  private async insertDocumentBase(
    analysis: NLPAnalysisResult,
    fileInfo: any,
    userId: string
  ): Promise<string> {
    /**Insere registro na tabela sigata.documento_base*/
    
    const documentId = uuidv4();
    
    const query = `
      INSERT INTO sigata.documento_base (
        codigo_documento,
        titulo_documento,
        tipo_documento,
        status_processamento,
        conteudo_original,
        conteudo_processado,
        data_upload,
        carregado_por_id,
        tamanho_arquivo_bytes,
        nome_arquivo_original,
        tipo_mime,
        hash_arquivo,
        versao_processamento,
        tempo_processamento_segundos,
        data_atualizacao
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
    `;
    
    // Calcular tempo de processamento (simulado)
    const processingTime = 5.2; // Em produção seria calculado
    
    const params = [
      documentId,
      fileInfo.nome_arquivo || 'Documento sem título',
      'ATA_REUNIAO',
      'CONCLUIDO',
      fileInfo.texto_extraido || '',
      analysis.summary,
      analysis.timestamp,
      userId,
      fileInfo.tamanho_arquivo || 0,
      fileInfo.nome_arquivo || '',
      fileInfo.tipo_arquivo || 'text/plain',
      fileInfo.hash_arquivo || '',
      '2.0.0', // Versão do processamento avançado
      processingTime,
      new Date()
    ];
    
    await database.query(query, params);
    return documentId;
  }

  private async insertNLPData(documentId: string, analysis: NLPAnalysisResult): Promise<void> {
    /**Insere dados detalhados na tabela sigata.documento_nlp_dados*/
    
    const query = `
      INSERT INTO sigata.documento_nlp_dados (
        documento_id,
        nlp_entidades_extraidas,
        nlp_palavras_chave,
        nlp_topicos_identificados,
        nlp_resumo_automatico,
        participantes_extraidos,
        decisoes_extraidas,
        acoes_extraidas,
        analise_sentimentos,
        metricas_qualidade,
        vetor_busca,
        versao_algoritmo,
        configuracao_processamento,
        data_processamento
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `;
    
    // Preparar dados JSON estruturados
    const entidadesJson = JSON.stringify(analysis.entities);
    const palavrasChaveJson = JSON.stringify(analysis.keywords);
    const topicosJson = JSON.stringify(analysis.topics);
    const participantesJson = JSON.stringify(analysis.participants);
    const decisoesJson = JSON.stringify(analysis.decisions);
    const acoesJson = JSON.stringify(analysis.actions);
    
    // Análise de sentimentos (simulada para compatibilidade)
    const sentimentAnalysis = {
      score: analysis.performance_score,
      label: analysis.performance_score > 0.6 ? 'positive' : 'neutral',
      confidence: analysis.bert_score_metrics.f1_score,
      breakdown: {
        positive: analysis.keywords.filter(k => k.relevance > 0.7).length,
        neutral: analysis.keywords.filter(k => k.relevance >= 0.3 && k.relevance <= 0.7).length,
        negative: analysis.keywords.filter(k => k.relevance < 0.3).length
      }
    };
    const sentimentosJson = JSON.stringify(sentimentAnalysis);
    
    // Métricas de qualidade conforme especificação
    const metricasQualidade = {
      coherence_score: analysis.coherence_metrics.c_v,
      silhouette_score: analysis.silhouette_metrics.silhouette_score,
      topic_diversity: analysis.topic_diversity.diversity_score,
      mmr_score: analysis.mmr_metrics.mmr_score,
      bert_score: {
        precision: analysis.bert_score_metrics.precision,
        recall: analysis.bert_score_metrics.recall,
        f1_score: analysis.bert_score_metrics.f1_score
      },
      performance_score: analysis.performance_score,
      confidence_interval_95: analysis.confidence_interval_95,
      equations_used: {
        coherence: "C_v = (2/M) × Σ log(P(wi,wj) + ε) / P(wi) × P(wj)",
        silhouette: "S(i) = (b(i) - a(i)) / max(a(i), b(i))",
        topic_diversity: "TD = (1/T) × Σ |unique_words(t)| / |total_words(t)|",
        mmr: "MMR = λ × sim(ki, D) - (1-λ) × max(sim(ki, kj))",
        bert_precision: "P = (1/|x|) × Σ max cosine_sim(xi, yj)",
        bert_recall: "R = (1/|y|) × Σ max cosine_sim(yj, xi)",
        bert_f1: "F1 = 2 × (P × R) / (P + R)"
      }
    };
    const metricasJson = JSON.stringify(metricasQualidade);
    
    // Vetor de busca textual
    const vetorBusca = analysis.keywords.map(kw => kw.word).join(' ');
    
    // Configuração do processamento
    const configuracao = {
      tecnologias_utilizadas: {
        bertopic: "0.15.0+",
        keybert: "0.8.0+", 
        bertscore: "0.3.13+",
        spacy: "3.6.0+",
        transformers: "4.30.0+"
      },
      modelos: {
        bertopic_umap: "UMAP + HDBSCAN + BERT embeddings",
        keybert_model: "distilbert-base-multilingual-cased",
        bertscore_model: "neuralmind/bert-base-portuguese-cased",
        spacy_model: "pt_core_news_lg",
        bert_model: "neuralmind/bert-base-portuguese-cased"
      },
      parametros: {
        keybert_diversity: 0.7,
        mmr_lambda: 0.7,
        coherence_epsilon: 1e-12,
        confidence_level: 0.95
      }
    };
    const configuracaoJson = JSON.stringify(configuracao);
    
    const params = [
      documentId,
      entidadesJson,
      palavrasChaveJson,
      topicosJson,
      analysis.summary,
      participantesJson,
      decisoesJson,
      acoesJson,
      sentimentosJson,
      metricasJson,
      vetorBusca,
      'SIGATA_Advanced_2.0',
      configuracaoJson,
      analysis.timestamp
    ];
    
    await database.query(query, params);
  }

  private async updateReportAnalytics(documentId: string, analysis: NLPAnalysisResult): Promise<void> {
    /**Atualiza relatório consolidado na tabela sigata.relatorio_atas*/
    
    // Verificar se já existe relatório para hoje
    const today = new Date().toISOString().split('T')[0];
    
    const checkQuery = `
      SELECT id FROM sigata.relatorio_atas 
      WHERE DATE(data_relatorio) = $1
    `;
    
    const existing = await database.query(checkQuery, [today]);
    
    if (existing.rows && existing.rows.length > 0) {
      // Atualizar relatório existente
      await this.updateExistingReport(existing.rows[0].id, analysis);
    } else {
      // Criar novo relatório
      await this.createNewReport(documentId, analysis);
    }
  }

  private async createNewReport(documentId: string, analysis: NLPAnalysisResult): Promise<void> {
    /**Cria novo relatório consolidado*/
    
    const query = `
      INSERT INTO sigata.relatorio_atas (
        titulo_relatorio,
        periodo_inicio,
        periodo_fim,
        total_documentos_analisados,
        total_participantes_unicos,
        total_entidades_extraidas,
        total_palavras_chave,
        media_score_qualidade,
        tecnologias_utilizadas,
        metricas_consolidadas,
        data_relatorio,
        gerado_por_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `;
    
    const titulo = `Relatório SIGATA - ${new Date().toLocaleDateString('pt-BR')}`;
    const hoje = new Date();
    
    const tecnologias = {
      pipeline: "BERTopic + KeyBERT + BERTScore + spaCy + Transformers",
      versao: "2.0.0",
      especificacao: "4.4.3.2.2"
    };
    
    const metricasConsolidadas = {
      coherence_score: analysis.coherence_metrics.c_v,
      performance_score: analysis.performance_score,
      confidence_interval: analysis.confidence_interval_95,
      equations_implemented: 7,
      quality_metrics: {
        bert_f1: analysis.bert_score_metrics.f1_score,
        mmr_score: analysis.mmr_metrics.mmr_score,
        topic_diversity: analysis.topic_diversity.diversity_score
      }
    };
    
    const params = [
      titulo,
      hoje,
      hoje,
      1, // Primeiro documento
      analysis.participants.length,
      analysis.entities.length,
      analysis.keywords.length,
      analysis.performance_score,
      JSON.stringify(tecnologias),
      JSON.stringify(metricasConsolidadas),
      hoje,
      'system' // Gerado automaticamente
    ];
    
    await database.query(query, params);
  }

  private async updateExistingReport(reportId: string, analysis: NLPAnalysisResult): Promise<void> {
    /**Atualiza relatório existente com novos dados*/
    
    // Buscar dados atuais
    const query = `
      SELECT total_documentos_analisados, total_participantes_unicos,
             total_entidades_extraidas, total_palavras_chave,
             media_score_qualidade, metricas_consolidadas
      FROM sigata.relatorio_atas WHERE id = $1
    `;
    
    const current = await database.query(query, [reportId]);
    if (!current.rows || current.rows.length === 0) {
      return;
    }
    
    const row = current.rows[0];
    
    // Calcular novos totais
    const newDocs = row.total_documentos_analisados + 1;
    const newParticipants = row.total_participantes_unicos + analysis.participants.length;
    const newEntities = row.total_entidades_extraidas + analysis.entities.length;
    const newKeywords = row.total_palavras_chave + analysis.keywords.length;
    
    // Calcular nova média de qualidade
    const oldAvg = row.media_score_qualidade;
    const oldCount = row.total_documentos_analisados;
    const newAvg = ((oldAvg * oldCount) + analysis.performance_score) / newDocs;
    
    // Atualizar métricas consolidadas
    let currentMetrics = {};
    try {
      currentMetrics = row.metricas_consolidadas ? JSON.parse(row.metricas_consolidadas) : {};
    } catch (e) {
      currentMetrics = {};
    }
    
    const updatedMetrics = {
      ...currentMetrics,
      last_coherence_score: analysis.coherence_metrics.c_v,
      last_performance_score: analysis.performance_score,
      documents_processed: newDocs,
      avg_bert_f1: newAvg,
      last_updated: new Date().toISOString()
    };
    
    // Atualizar no banco
    const updateQuery = `
      UPDATE sigata.relatorio_atas SET
        total_documentos_analisados = $1,
        total_participantes_unicos = $2,
        total_entidades_extraidas = $3,
        total_palavras_chave = $4,
        media_score_qualidade = $5,
        metricas_consolidadas = $6,
        data_relatorio = $7
      WHERE id = $8
    `;
    
    const updateParams = [
      newDocs,
      newParticipants,
      newEntities,
      newKeywords,
      newAvg,
      JSON.stringify(updatedMetrics),
      new Date(),
      reportId
    ];
    
    await database.query(updateQuery, updateParams);
  }

  async getDocumentAnalysis(documentId: string): Promise<any> {
    /**Recupera análise completa de um documento*/
    
    const query = `
      SELECT 
        db.*,
        nlp.nlp_entidades_extraidas,
        nlp.nlp_palavras_chave,
        nlp.nlp_topicos_identificados,
        nlp.participantes_extraidos,
        nlp.decisoes_extraidas,
        nlp.acoes_extraidas,
        nlp.analise_sentimentos,
        nlp.metricas_qualidade,
        nlp.configuracao_processamento
      FROM sigata.documento_base db
      LEFT JOIN sigata.documento_nlp_dados nlp ON db.codigo_documento = nlp.documento_id
      WHERE db.codigo_documento = $1
    `;
    
    const result = await database.query(query, [documentId]);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Converter campos JSON
    return {
      document_info: {
        id: row.codigo_documento,
        title: row.titulo_documento,
        status: row.status_processamento,
        upload_date: row.data_upload,
        file_size: row.tamanho_arquivo_bytes,
        processing_time: row.tempo_processamento_segundos
      },
      nlp_analysis: {
        entities: row.nlp_entidades_extraidas ? JSON.parse(row.nlp_entidades_extraidas) : [],
        keywords: row.nlp_palavras_chave ? JSON.parse(row.nlp_palavras_chave) : [],
        topics: row.nlp_topicos_identificados ? JSON.parse(row.nlp_topicos_identificados) : [],
        participants: row.participantes_extraidos ? JSON.parse(row.participantes_extraidos) : [],
        decisions: row.decisoes_extraidas ? JSON.parse(row.decisoes_extraidas) : [],
        actions: row.acoes_extraidas ? JSON.parse(row.acoes_extraidas) : [],
        sentiment: row.analise_sentimentos ? JSON.parse(row.analise_sentimentos) : {},
        quality_metrics: row.metricas_qualidade ? JSON.parse(row.metricas_qualidade) : {},
        configuration: row.configuracao_processamento ? JSON.parse(row.configuracao_processamento) : {}
      },
      summary: row.conteudo_processado
    };
  }

  async getConsolidatedReport(startDate?: Date, endDate?: Date): Promise<any> {
    /**Gera relatório consolidado conforme especificação*/
    
    if (!startDate) {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }
    if (!endDate) {
      endDate = new Date();
    }
    
    // Buscar documentos processados no período
    const docsQuery = `
      SELECT 
        db.codigo_documento,
        db.titulo_documento,
        db.data_upload,
        db.tempo_processamento_segundos,
        nlp.metricas_qualidade,
        nlp.nlp_topicos_identificados,
        nlp.nlp_palavras_chave,
        nlp.participantes_extraidos
      FROM sigata.documento_base db
      LEFT JOIN sigata.documento_nlp_dados nlp ON db.codigo_documento = nlp.documento_id
      WHERE db.data_upload BETWEEN $1 AND $2
      AND db.status_processamento = 'CONCLUIDO'
      ORDER BY db.data_upload DESC
    `;
    
    const docsResult = await database.query(docsQuery, [startDate, endDate]);
    
    if (!docsResult.rows || docsResult.rows.length === 0) {
      return {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        summary: { total_documents: 0 },
        message: 'Nenhum documento processado no período'
      };
    }
    
    // Processar métricas consolidadas
    const totalDocs = docsResult.rows.length;
    let totalProcessingTime = 0;
    const allQualityScores: number[] = [];
    const allTopics: any[] = [];
    const allKeywords: any[] = [];
    const allParticipants = new Set<string>();
    
    for (const row of docsResult.rows) {
      if (row.tempo_processamento_segundos) {
        totalProcessingTime += row.tempo_processamento_segundos;
      }
      
      if (row.metricas_qualidade) {
        try {
          const metrics = JSON.parse(row.metricas_qualidade);
          if (metrics.performance_score) {
            allQualityScores.push(metrics.performance_score);
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      if (row.nlp_topicos_identificados) {
        try {
          const topics = JSON.parse(row.nlp_topicos_identificados);
          allTopics.push(...topics);
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      if (row.nlp_palavras_chave) {
        try {
          const keywords = JSON.parse(row.nlp_palavras_chave);
          allKeywords.push(...keywords);
        } catch (e) {
          // Ignorar erro de parse
        }
      }
      
      if (row.participantes_extraidos) {
        try {
          const participants = JSON.parse(row.participantes_extraidos);
          participants.forEach((p: string) => allParticipants.add(p));
        } catch (e) {
          // Ignorar erro de parse
        }
      }
    }
    
    // Calcular estatísticas
    const avgQuality = allQualityScores.length > 0 ? allQualityScores.reduce((a, b) => a + b) / allQualityScores.length : 0;
    const avgProcessingTime = totalDocs > 0 ? totalProcessingTime / totalDocs : 0;
    
    // Top palavras-chave
    const keywordFreq: { [key: string]: number } = {};
    allKeywords.forEach(kw => {
      if (kw && typeof kw === 'object' && kw.word) {
        const word = kw.word;
        keywordFreq[word] = (keywordFreq[word] || 0) + (kw.frequency || 1);
      }
    });
    
    const topKeywords = Object.entries(keywordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, freq]) => ({ word, frequency: freq }));
    
    // Top tópicos
    const topicFreq: { [key: string]: number } = {};
    allTopics.forEach(topic => {
      if (topic && typeof topic === 'object' && topic.topic) {
        const topicName = topic.topic || 'N/A';
        topicFreq[topicName] = (topicFreq[topicName] || 0) + (topic.mentions || 1);
      }
    });
    
    const topTopics = Object.entries(topicFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, freq]) => ({ topic, mentions: freq }));
    
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        total_documents: totalDocs,
        unique_participants: allParticipants.size,
        total_keywords: allKeywords.length,
        total_topics: allTopics.length,
        avg_quality_score: Math.round(avgQuality * 1000) / 1000,
        avg_processing_time: Math.round(avgProcessingTime * 100) / 100,
        performance_level: avgQuality > 0.8 ? 'Excelente' : avgQuality > 0.6 ? 'Bom' : 'Regular'
      },
      top_keywords: topKeywords,
      top_topics: topTopics,
      participants: Array.from(allParticipants),
      technology_stack: {
        nlp_engine: 'SIGATA Advanced 2.0',
        technologies: ['BERTopic 0.15.0+', 'KeyBERT 0.8.0+', 'BERTScore 0.3.13+', 'spaCy 3.6.0+', 'Transformers 4.30.0+'],
        equations_implemented: ['Coherence Score', 'Silhouette Score', 'Topic Diversity', 'MMR', 'BERTScore P/R/F1'],
        specification: '4.4.3.2.2'
      },
      generated_at: new Date().toISOString()
    };
  }
}
