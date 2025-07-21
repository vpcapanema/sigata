/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import logger from '../utils/logger';

// Interface para resultado NLP (compatível com sistema atual)
export interface NLPResult {
  entities: any[];
  keywords: any[];
  sentiment: any;
  participants: string[];
  decisions: any[];
  actions: any[];
  summary: string;
  topics: any[];
  confidence: number;
  actionItems?: any[]; // Propriedade adicional para compatibilidade
  [key: string]: any; // Permitir propriedades adicionais
}

// ==========================================
// INTERFACES PARA DADOS NLP SIGATA AVANÇADO
// ==========================================

export interface BERTopicMetrics {
  coherence_score: number;       // Equação 1: C_v
  silhouette_score: number;      // Equação 2: S(i)
  topic_diversity: number;       // Equação 3: TD
  total_topics: number;
  dominant_topic_id: number;
  topic_distribution: Array<{
    topic_id: number;
    probability: number;
    words: string[];
  }>;
}

export interface KeyBERTMetrics {
  mmr_diversity: number;         // Parâmetro λ da Equação 4
  keyword_relevance_scores: Array<{
    keyword: string;
    similarity_score: number;    // sim(ki, D)
    mmr_score: number;          // Equação 4: MMR
    ngram_relevance: number;
  }>;
  total_keywords_extracted: number;
  avg_relevance_score: number;
}

export interface BERTScoreMetrics {
  precision: number;             // Equação 5: P
  recall: number;               // Equação 6: R
  f1_score: number;             // Equação 7: F1
  confidence_interval: {
    lower: number;
    upper: number;
  };
  token_level_scores: Array<{
    token: string;
    precision: number;
    recall: number;
    f1: number;
  }>;
}

export interface SpaCyAnalysis {
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  pos_tags: Array<{
    token: string;
    pos: string;
    lemma: string;
    is_stop: boolean;
  }>;
  dependency_parse: Array<{
    token: string;
    dep: string;
    head: string;
    children: string[];
  }>;
  language_detected: string;
  complexity_metrics: {
    avg_sentence_length: number;
    lexical_diversity: number;
    formality_score: number;
  };
}

export interface AdvancedNLPResult {
  // Dados básicos para frontend
  basic_analysis: NLPResult;
  
  // Métricas avançadas para banco
  bertopic_metrics: BERTopicMetrics;
  keybert_metrics: KeyBERTMetrics;
  bertscore_metrics: BERTScoreMetrics;
  spacy_analysis: SpaCyAnalysis;
  
  // Dados para tabelas SIGATA
  documento_nlp_dados: {
    idioma_detectado: string;
    palavras_chave_extraidas: any;
    entidades_nomeadas: any;
    topicos_principais: any;
    resumo_automatico: string;
    sentimento_geral: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    pontuacao_sentimento: number;
    nivel_formalidade: 'FORMAL' | 'INFORMAL' | 'TECNICO';
    complexidade_linguistica: 'BAIXA' | 'MEDIA' | 'ALTA';
  };
  
  documento_nlp_metricas: {
    densidade_palavras_chave: number;
    diversidade_lexical: number;
    coesao_textual: number;
    indice_legibilidade: number;
    frequencia_termos_tecnicos: number;
    pontuacao_objetividade: number;
    indice_redundancia: number;
    metricas_adicionais: any;
  };
  
  documento_ata_dados: {
    titulo_reuniao?: string;
    data_reuniao?: string;
    local_reuniao?: string;
    organizacao_responsavel?: string;
    tipo_reuniao?: 'ORDINARIA' | 'EXTRAORDINARIA' | 'EMERGENCIAL';
    status_reuniao?: 'REALIZADA' | 'CANCELADA' | 'ADIADA';
    numero_participantes?: number;
    duracao_estimada_minutos?: number;
    observacoes_gerais?: string;
  };
  
  // Metadados de processamento
  processing_metadata: {
    processing_time_ms: number;
    models_used: {
      bertopic_version: string;
      keybert_version: string;
      bertscore_model: string;
      spacy_model: string;
      transformers_version: string;
    };
    document_hash: string;
    processing_date: string;
  };
}

// ==========================================
// CLASSE PRINCIPAL DO SERVIÇO NLP AVANÇADO
// ==========================================

export class SigataAdvancedNLPService {
  private pythonServicePath: string;
  private modelsConfig: any;

  constructor() {
    this.pythonServicePath = path.join(__dirname, '..', 'python', 'sigata_nlp_service.py');
    this.modelsConfig = {
      bertopic: {
        version: '0.15.0+',
        language: 'portuguese',
        calculate_probabilities: true,
        umap_n_neighbors: 15,
        hdbscan_min_cluster_size: 2
      },
      keybert: {
        version: '0.8.0+',
        model: 'distilbert-base-multilingual-cased',
        diversity: 0.7,
        use_maxsum: true,
        stop_words: 'portuguese'
      },
      bertscore: {
        version: '0.3.13+',
        model: 'neuralmind/bert-base-portuguese-cased',
        lang: 'pt',
        use_fast_tokenizer: true
      },
      spacy: {
        version: '3.6.0+',
        model: 'pt_core_news_lg',
        disable: []
      }
    };
  }

  /**
   * Método principal para processamento completo de documentos
   */
  async processDocument(
    documentText: string, 
    documentTitle?: string, 
    documentId?: string
  ): Promise<AdvancedNLPResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`🔍 Iniciando processamento NLP avançado para documento: ${documentTitle || documentId || 'Sem título'}`);
      
      // Gerar hash do documento
      const documentHash = crypto.createHash('sha256').update(documentText).digest('hex');
      
      // Executar análise Python
      const pythonResult = await this.executePythonAnalysis(documentText, documentTitle);
      
      // Processar resultados e estruturar dados
      const result = await this.structureResults(pythonResult, documentText, documentTitle, documentHash, startTime);
      
      const processingTime = Date.now() - startTime;
      logger.info(`✅ Processamento NLP concluído em ${processingTime}ms - Tópicos: ${result.bertopic_metrics.total_topics}, Keywords: ${result.keybert_metrics.total_keywords_extracted}`);
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Erro no processamento NLP: ${error}`);
      throw new Error(`Falha no processamento NLP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Executa o script Python com todas as análises
   */
  private async executePythonAnalysis(documentText: string, documentTitle?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['-c', `
import sys
import json
sys.path.append('${path.dirname(this.pythonServicePath).replace(/\\/g, '/')}')

try:
    from sigata_nlp_service import SigataAdvancedNLP
    
    # Receber dados do stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    
    document_text = data['document_text']
    document_title = data.get('document_title', None)
    models_config = data['models_config']
    
    # Inicializar serviço NLP
    nlp_service = SigataAdvancedNLP(models_config)
    
    # Executar análise completa
    results = nlp_service.analyze_document(document_text, document_title)
    
    # Retornar resultados
    print(json.dumps(results, ensure_ascii=False, indent=2))
    
except Exception as e:
    import traceback
    error_info = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "type": "python_execution_error"
    }
    print(json.dumps(error_info))
    sys.exit(1)
      `]);
      
      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: any) => {
        errorOutput += data.toString();
        logger.warn(`Python stderr: ${data.toString()}`);
      });

      pythonProcess.on('close', (code: any) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            if (result.error) {
              logger.error(`Erro no script Python: ${result.error}`);
              reject(new Error(`Python script error: ${result.error}`));
            } else {
              resolve(result);
            }
          } catch (error) {
            logger.error(`Erro ao parsear saída do Python: ${error}`);
            logger.error(`Python output: ${output}`);
            reject(new Error(`Failed to parse Python output: ${error}`));
          }
        } else {
          logger.error(`Script Python falhou com código ${code}: ${errorOutput}`);
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error: any) => {
        logger.error(`Erro ao executar Python: ${error}`);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      // Enviar dados para o script Python
      const inputData = {
        document_text: documentText,
        document_title: documentTitle,
        models_config: this.modelsConfig
      };
      
      try {
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
      } catch (error) {
        logger.error(`Erro ao enviar dados para Python: ${error}`);
        reject(new Error(`Failed to send data to Python script: ${error}`));
      }
    });
  }

  /**
   * Estrutura os resultados Python no formato SIGATA
   */
  private async structureResults(
    pythonResult: any, 
    documentText: string, 
    documentTitle?: string, 
    documentHash?: string, 
    startTime?: number
  ): Promise<AdvancedNLPResult> {
    
    // Extrair dados básicos para frontend
    const basicAnalysis: NLPResult = {
      summary: pythonResult.summary || 'Resumo não disponível',
      keywords: pythonResult.keywords || [],
      entities: pythonResult.entities || [],
      sentiment: pythonResult.sentiment || { score: 0.5, magnitude: 0.5, label: 'NEUTRAL' },
      topics: pythonResult.topics || [],
      participants: pythonResult.participants || [],
      decisions: pythonResult.decisions || [],
      actions: pythonResult.action_items || [], // Mapeamento correto
      actionItems: pythonResult.action_items || [],
      confidence: pythonResult.confidence || 0.75,
      meetingData: pythonResult.meeting_data || {
        date: new Date().toISOString().split('T')[0],
        duration: 'Não informado',
        location: 'Não informado',
        attendees: 0
      }
    };

    // Estruturar dados para tabela documento_nlp_dados
    const documentoNlpDados = {
      idioma_detectado: pythonResult.spacy_analysis?.language_detected || 'pt',
      palavras_chave_extraidas: {
        keywords: pythonResult.keywords || [],
        keybert_metrics: pythonResult.keybert_metrics || {},
        extraction_method: 'KeyBERT + MMR'
      },
      entidades_nomeadas: {
        entities: pythonResult.entities || [],
        spacy_entities: pythonResult.spacy_analysis?.entities || [],
        extraction_method: 'spaCy + BERT'
      },
      topicos_principais: {
        topics: pythonResult.topics || [],
        bertopic_metrics: pythonResult.bertopic_metrics || {},
        clustering_method: 'BERTopic + UMAP + HDBSCAN'
      },
      resumo_automatico: pythonResult.summary || '',
      sentimento_geral: pythonResult.sentiment?.label || 'NEUTRAL',
      pontuacao_sentimento: pythonResult.sentiment?.score || 0.5,
      nivel_formalidade: this.calculateFormalityLevel(pythonResult.spacy_analysis),
      complexidade_linguistica: this.calculateComplexityLevel(pythonResult.spacy_analysis)
    };

    // Estruturar dados para tabela documento_nlp_metricas
    const documentoNlpMetricas = {
      densidade_palavras_chave: pythonResult.keybert_metrics?.avg_relevance_score || 0,
      diversidade_lexical: pythonResult.bertopic_metrics?.topic_diversity || 0,
      coesao_textual: pythonResult.bertopic_metrics?.coherence_score || 0,
      indice_legibilidade: pythonResult.spacy_analysis?.complexity_metrics?.lexical_diversity || 0,
      frequencia_termos_tecnicos: this.calculateTechnicalTermsFrequency(pythonResult.keywords),
      pontuacao_objetividade: pythonResult.sentiment?.magnitude || 0,
      indice_redundancia: this.calculateRedundancyIndex(documentText, pythonResult.keywords),
      metricas_adicionais: {
        bertscore: pythonResult.bertscore_metrics || {},
        processing_details: {
          bertopic_silhouette: pythonResult.bertopic_metrics?.silhouette_score || 0,
          keybert_mmr_diversity: pythonResult.keybert_metrics?.mmr_diversity || 0,
          bert_f1_score: pythonResult.bertscore_metrics?.f1_score || 0
        }
      }
    };

    // Estruturar dados para tabela documento_ata_dados
    const documentoAtaDados = {
      titulo_reuniao: this.extractMeetingTitle(documentTitle, pythonResult),
      data_reuniao: this.extractMeetingDate(pythonResult),
      local_reuniao: this.extractMeetingLocation(pythonResult),
      organizacao_responsavel: this.extractResponsibleOrganization(pythonResult),
      tipo_reuniao: this.classifyMeetingType(pythonResult),
      status_reuniao: 'REALIZADA' as const,
      numero_participantes: pythonResult.participants?.length || 0,
      duracao_estimada_minutos: this.estimateMeetingDuration(documentText, pythonResult),
      observacoes_gerais: this.extractGeneralObservations(pythonResult)
    };

    return {
      basic_analysis: basicAnalysis,
      bertopic_metrics: pythonResult.bertopic_metrics || {},
      keybert_metrics: pythonResult.keybert_metrics || {},
      bertscore_metrics: pythonResult.bertscore_metrics || {},
      spacy_analysis: pythonResult.spacy_analysis || {},
      documento_nlp_dados: documentoNlpDados,
      documento_nlp_metricas: documentoNlpMetricas,
      documento_ata_dados: documentoAtaDados,
      processing_metadata: {
        processing_time_ms: startTime ? Date.now() - startTime : 0,
        models_used: {
          bertopic_version: this.modelsConfig.bertopic.version,
          keybert_version: this.modelsConfig.keybert.version,
          bertscore_model: this.modelsConfig.bertscore.model,
          spacy_model: this.modelsConfig.spacy.model,
          transformers_version: '4.30.0+'
        },
        document_hash: documentHash || '',
        processing_date: new Date().toISOString()
      }
    };
  }

  // ==========================================
  // MÉTODOS AUXILIARES DE EXTRAÇÃO
  // ==========================================

  private calculateFormalityLevel(spacyAnalysis: any): 'FORMAL' | 'INFORMAL' | 'TECNICO' {
    if (!spacyAnalysis?.complexity_metrics) return 'FORMAL';
    
    const formalityScore = spacyAnalysis.complexity_metrics.formality_score || 0.5;
    if (formalityScore > 0.8) return 'TECNICO';
    if (formalityScore > 0.6) return 'FORMAL';
    return 'INFORMAL';
  }

  private calculateComplexityLevel(spacyAnalysis: any): 'BAIXA' | 'MEDIA' | 'ALTA' {
    if (!spacyAnalysis?.complexity_metrics) return 'MEDIA';
    
    const avgSentenceLength = spacyAnalysis.complexity_metrics.avg_sentence_length || 15;
    if (avgSentenceLength > 25) return 'ALTA';
    if (avgSentenceLength > 15) return 'MEDIA';
    return 'BAIXA';
  }

  private calculateTechnicalTermsFrequency(keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0;
    
    const technicalTerms = keywords.filter(keyword => 
      keyword.length > 6 && /[A-Z]/.test(keyword)
    );
    
    return technicalTerms.length / keywords.length;
  }

  private calculateRedundancyIndex(documentText: string, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0;
    
    const words = documentText.toLowerCase().split(/\s+/);
    const keywordCounts = keywords.map(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      return (documentText.toLowerCase().match(regex) || []).length;
    });
    
    const avgRepetition = keywordCounts.reduce((sum, count) => sum + count, 0) / keywordCounts.length;
    return Math.min(avgRepetition / words.length, 1);
  }

  private extractMeetingTitle(documentTitle?: string, pythonResult?: any): string | undefined {
    if (documentTitle) return documentTitle;
    if (pythonResult?.meeting_data?.title) return pythonResult.meeting_data.title;
    
    // Tentar extrair título dos tópicos principais
    if (pythonResult?.topics && pythonResult.topics.length > 0) {
      return `Reunião: ${pythonResult.topics[0].topic}`;
    }
    
    return undefined;
  }

  private extractMeetingDate(pythonResult: any): string | undefined {
    // Tentar extrair data das entidades
    if (pythonResult?.entities) {
      const dateEntity = pythonResult.entities.find((entity: any) => entity.label === 'DATE');
      if (dateEntity) return dateEntity.text;
    }
    
    return undefined;
  }

  private extractMeetingLocation(pythonResult: any): string | undefined {
    // Tentar extrair local das entidades
    if (pythonResult?.entities) {
      const locationEntity = pythonResult.entities.find((entity: any) => 
        entity.label === 'LOC' || entity.label === 'LOCATION'
      );
      if (locationEntity) return locationEntity.text;
    }
    
    return undefined;
  }

  private extractResponsibleOrganization(pythonResult: any): string | undefined {
    // Tentar extrair organização das entidades
    if (pythonResult?.entities) {
      const orgEntity = pythonResult.entities.find((entity: any) => 
        entity.label === 'ORG' || entity.label === 'ORGANIZATION'
      );
      if (orgEntity) return orgEntity.text;
    }
    
    return undefined;
  }

  private classifyMeetingType(pythonResult: any): 'ORDINARIA' | 'EXTRAORDINARIA' | 'EMERGENCIAL' | undefined {
    const summary = (pythonResult?.summary || '').toLowerCase();
    
    if (summary.includes('emergencial') || summary.includes('urgente')) {
      return 'EMERGENCIAL';
    }
    if (summary.includes('extraordinária') || summary.includes('extraordinaria')) {
      return 'EXTRAORDINARIA';
    }
    if (summary.includes('ordinária') || summary.includes('ordinaria') || summary.includes('regular')) {
      return 'ORDINARIA';
    }
    
    return undefined;
  }

  private estimateMeetingDuration(documentText: string, pythonResult: any): number | undefined {
    // Estimativa baseada no tamanho do documento e número de tópicos
    const wordCount = documentText.split(/\s+/).length;
    const topicCount = pythonResult?.topics?.length || 1;
    
    // Estimativa: 150 palavras por minuto de reunião + 10 minutos por tópico
    const estimatedMinutes = Math.ceil(wordCount / 150) + (topicCount * 10);
    
    return Math.min(Math.max(estimatedMinutes, 30), 480); // Entre 30min e 8h
  }

  private extractGeneralObservations(pythonResult: any): string | undefined {
    if (pythonResult?.action_items && pythonResult.action_items.length > 0) {
      return `Identificadas ${pythonResult.action_items.length} ações. Qualidade de análise: ${
        pythonResult.bertscore_metrics?.f1_score ? 
        (pythonResult.bertscore_metrics.f1_score * 100).toFixed(1) + '%' : 
        'Não avaliada'
      }`;
    }
    
    return undefined;
  }

  /**
   * Verifica se o ambiente Python está configurado corretamente
   */
  async checkEnvironment(): Promise<{ available: boolean; details: any }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['-c', `
import sys
import json

try:
    # Verificar imports principais
    import bertopic
    import keybert
    import bert_score
    import transformers
    import spacy
    
    # Verificar modelos
    nlp = spacy.load('pt_core_news_lg')
    
    # Verificar versões
    versions = {
        'bertopic': bertopic.__version__,
        'keybert': keybert.__version__,
        'transformers': transformers.__version__,
        'spacy': spacy.__version__,
        'python': sys.version
    }
    
    result = {
        'available': True,
        'versions': versions,
        'models': {
            'spacy_portuguese': True,
            'bert_multilingual': True
        }
    }
    
    print(json.dumps(result))
    
except ImportError as e:
    result = {
        'available': False,
        'error': f'Biblioteca ausente: {str(e)}',
        'missing_library': str(e).split("'")[1] if "'" in str(e) else 'unknown'
    }
    print(json.dumps(result))
    
except OSError as e:
    result = {
        'available': False,
        'error': f'Modelo não encontrado: {str(e)}',
        'missing_model': 'pt_core_news_lg'
    }
    print(json.dumps(result))
    
except Exception as e:
    result = {
        'available': False,
        'error': f'Erro inesperado: {str(e)}'
    }
    print(json.dumps(result))
      `]);
      
      let output = '';
      
      pythonProcess.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code: any) => {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          resolve({
            available: false,
            details: { error: 'Failed to parse environment check output', code }
          });
        }
      });

      pythonProcess.on('error', () => {
        resolve({
          available: false,
          details: { error: 'Python não encontrado ou não executável' }
        });
      });
    });
  }
}

// Exportar instância única do serviço
export const sigataAdvancedNLP = new SigataAdvancedNLPService();
export default sigataAdvancedNLP;
