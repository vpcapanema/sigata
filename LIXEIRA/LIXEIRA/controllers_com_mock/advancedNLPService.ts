/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from 'child_process';
import * as path from 'path';
import { NLPResult } from './nlpService';
import logger from '../utils/logger';

interface KeywordResult {
  term: string;
  score: number;
  source: string;
  relevance: string;
}

interface SummaryResult {
  text: string;
  method: string;
  model: string;
  compression_ratio: number;
  word_count: number;
}

interface AdherenceMetrics {
  bert_score: {
    precision: number;
    recall: number;
    f1: number;
  };
  rouge: {
    rouge1: { precision: number; recall: number; fmeasure: number };
    rouge2: { precision: number; recall: number; fmeasure: number };
    rougeL: { precision: number; recall: number; fmeasure: number };
  };
  bleu: {
    score: number;
    precision: number[];
  };
  keyword_coverage: {
    total_keywords: number;
    keywords_in_summary: number;
    coverage_ratio: number;
  };
  overall_adherence: {
    score: number;
    grade: string;
    confidence: string;
  };
}

interface TopicResult {
  topic_id: number;
  topic_label: string;
  document_count: number;
  document_indices: number[];
  keywords: KeywordResult[];
  summary: SummaryResult;
  metrics: AdherenceMetrics;
  confidence_scores: {
    topic_coherence: number;
    keyword_relevance: number;
    summary_quality: number;
  };
  document_titles?: string[];
}

interface AdvancedAnalysisResult {
  topics: TopicResult[];
  summaries: any[];
  keywords: any[];
  metrics: {
    quality_distribution: {
      mean_adherence: number;
      std_adherence: number;
      min_adherence: number;
      max_adherence: number;
    };
    keyword_analysis: {
      mean_coverage: number;
      total_unique_keywords: number;
    };
    semantic_quality: {
      mean_bert_f1: number;
      high_quality_topics: number;
      total_topics: number;
    };
    coverage_analysis: {
      documents_processed: number;
      documents_categorized: number;
      average_docs_per_topic: number;
    };
  };
  metadata: {
    total_documents: number;
    total_topics: number;
    processing_date: string;
  };
}

const currentDir = __dirname;

export class AdvancedNLPService {
  private pythonServicePath: string;

  constructor() {
    this.pythonServicePath = path.join(currentDir, 'nlpAdvancedService.py');
  }

  /**
   * Análise avançada de documentos usando BERTopic, KeyBERT e métricas de qualidade
   */
  async extractTopicsAdvanced(documents: string[], documentTitles?: string[]): Promise<AdvancedAnalysisResult> {
    return new Promise((resolve, reject) => {
      logger.info(`🔍 Iniciando análise avançada de ${documents.length} documentos...`);
      
      const pythonProcess = spawn('python', ['-c', `
import sys
import json
sys.path.append('${path.dirname(this.pythonServicePath).replace(/\\/g, '/')}')

try:
    from nlpAdvancedService import analyze_meeting_minutes
    
    # Receber dados do stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    
    documents = data['documents']
    titles = data.get('titles', None)
    
    # Executar análise
    results = analyze_meeting_minutes(documents, titles)
    
    # Retornar resultados
    print(json.dumps(results, ensure_ascii=False, indent=2))
    
except Exception as e:
    import traceback
    error_info = {
        "error": str(e),
        "traceback": traceback.format_exc()
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
              reject(new Error(result.error));
            } else {
              logger.info(`✅ Análise avançada concluída: ${result.metadata?.total_topics || 0} tópicos identificados`);
              resolve(result);
            }
          } catch (error) {
            logger.error(`Erro ao parsear saída do Python: ${error}`);
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
        documents,
        titles: documentTitles
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
   * Converte resultado avançado para formato compatível com sistema legado
   */
  async analyzeDocumentsAdvanced(documents: string[], documentTitles?: string[]): Promise<NLPResult> {
    try {
      const advancedResults = await this.extractTopicsAdvanced(documents, documentTitles);
      
      // Gerar resumo geral combinando todos os tópicos
      const topicSummaries = advancedResults.topics.map(topic => 
        `${topic.topic_label}: ${topic.summary.text}`
      );
      const generalSummary = topicSummaries.length > 0 
        ? topicSummaries.join('\n\n').substring(0, 500) + (topicSummaries.join('\n\n').length > 500 ? '...' : '')
        : 'Análise de documentos realizada com identificação de tópicos e palavras-chave relevantes.';

      // Extrair todas as palavras-chave únicas dos tópicos
      const allKeywords = Array.from(new Set(
        advancedResults.topics.flatMap(topic => 
          topic.keywords.slice(0, 5).map(kw => kw.term)
        )
      ));

      // Extrair entidades (participantes) dos documentos
      const entities = this.extractEntitiesFromTopics(advancedResults.topics);

      // Análise de sentimento baseada na qualidade dos tópicos
      const avgQuality = advancedResults.metrics.quality_distribution.mean_adherence;
      const sentiment = {
        score: avgQuality,
        magnitude: Math.abs(avgQuality - 0.5) * 2,
        label: avgQuality > 0.7 ? 'POSITIVE' as const : avgQuality < 0.4 ? 'NEGATIVE' as const : 'NEUTRAL' as const
      };

      // Converter tópicos para formato legado
      const topics = advancedResults.topics.map(topic => ({
        topic: topic.topic_label,
        relevance: topic.metrics.overall_adherence.score
      }));

      // Extrair itens de ação dos resumos
      const actionItems = this.extractActionItemsFromSummaries(advancedResults.topics);

      // Dados da reunião baseados nos metadados
      const meetingData = {
        date: new Date().toISOString().split('T')[0],
        duration: `${Math.ceil(documents.length * 0.5)} horas`,
        location: 'Documento Digital',
        attendees: entities.filter(e => e.label === 'PERSON').length
      };

      return {
        summary: generalSummary,
        keywords: allKeywords,
        entities,
        sentiment,
        topics,
        participants: entities.filter(e => e.label === 'PERSON').map(e => e.text),
        decisions: this.extractDecisionsFromSummaries(advancedResults.topics),
        actionItems,
        meetingData
      };

    } catch (error) {
      logger.error('Erro na análise avançada:', error);
      throw error;
    }
  }

  /**
   * Extrai entidades de texto usando análise avançada
   */
  private extractEntitiesFromTopics(topics: TopicResult[]): Array<{
    text: string;
    label: string;
    confidence: number;
  }> {
    const entities: Array<{
      text: string;
      label: string;
      confidence: number;
    }> = [];

    // Extrair palavras-chave como entidades
    topics.forEach(topic => {
      topic.keywords.slice(0, 3).forEach(keyword => {
        // Classificar palavras-chave por tipo heurístico
        let label = 'KEYWORD';
        if (keyword.term.match(/^[A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+$/)) {
          label = 'PERSON';
        } else if (keyword.term.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
          label = 'DATE';
        } else if (keyword.term.toLowerCase().includes('projeto')) {
          label = 'PROJECT';
        }

        entities.push({
          text: keyword.term,
          label,
          confidence: keyword.score
        });
      });
    });

    return entities;
  }

  /**
   * Extrai itens de ação dos resumos dos tópicos
   */
  private extractActionItemsFromSummaries(topics: TopicResult[]): Array<{
    item: string;
    responsible?: string;
    deadline?: string;
  }> {
    const actionItems: Array<{
      item: string;
      responsible?: string;
      deadline?: string;
    }> = [];

    topics.forEach(topic => {
      const summaryText = topic.summary.text;
      
      // Padrões para identificar ações
      const actionPatterns = [
        /deve-?se\s+([^.]+)/gi,
        /é\s+necessário\s+([^.]+)/gi,
        /será\s+([^.]+)/gi,
        /próximos?\s+passos?:?\s*([^.]+)/gi
      ];

      actionPatterns.forEach(pattern => {
        const matches = summaryText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Tentar extrair responsável das palavras-chave do tópico
            const personKeywords = topic.keywords.filter(kw => 
              kw.term.match(/^[A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+$/)
            );
            
            actionItems.push({
              item: match.trim(),
              responsible: personKeywords.length > 0 ? personKeywords[0].term : undefined,
              deadline: undefined // Poderia extrair de padrões de data
            });
          });
        }
      });
    });

    return actionItems.slice(0, 5);
  }

  /**
   * Extrai decisões dos resumos dos tópicos
   */
  private extractDecisionsFromSummaries(topics: TopicResult[]): string[] {
    const decisions: string[] = [];

    topics.forEach(topic => {
      const summaryText = topic.summary.text;
      
      // Padrões para identificar decisões
      const decisionPatterns = [
        /foi\s+decidido\s+([^.]+)/gi,
        /decidiu-?se\s+([^.]+)/gi,
        /aprovado\s+([^.]+)/gi,
        /definido\s+([^.]+)/gi
      ];

      decisionPatterns.forEach(pattern => {
        const matches = summaryText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            decisions.push(match.trim());
          });
        }
      });
    });

    return decisions.slice(0, 5);
  }

  /**
   * Gerar relatório HTML completo da análise
   */
  async generateAnalysisReport(documents: string[], titles?: string[], outputPath?: string): Promise<string> {
    const results = await this.extractTopicsAdvanced(documents, titles);
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['-c', `
import sys
import json
sys.path.append('${path.dirname(this.pythonServicePath).replace(/\\/g, '/')}')

try:
    from nlpAdvancedService import SigataAdvancedNLP
    
    # Receber dados do stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    
    results = data['results']
    output_path = data.get('output_path')
    
    # Gerar relatório
    service = SigataAdvancedNLP()
    html_report = service.generate_analysis_report(results, output_path)
    
    print(html_report)
    
except Exception as e:
    import traceback
    error_info = {
        "error": str(e),
        "traceback": traceback.format_exc()
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
      });

      pythonProcess.on('close', (code: any) => {
        if (code === 0) {
          try {
            // Verificar se a saída é JSON (erro) ou HTML (sucesso)
            if (output.trim().startsWith('{')) {
              const errorResult = JSON.parse(output);
              reject(new Error(`Erro na geração do relatório: ${errorResult.error}`));
            } else {
              resolve(output);
            }
          } catch {
            // Se não conseguir parsear como JSON, assumir que é HTML válido
            resolve(output);
          }
        } else {
          reject(new Error(`Failed to generate report: ${errorOutput}`));
        }
      });

      // Enviar dados para o script Python
      const inputData = {
        results,
        output_path: outputPath
      };
      
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  /**
   * Verifica se o ambiente Python está configurado corretamente
   */
  async checkPythonEnvironment(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['-c', `
try:
    import bertopic, keybert, bert_score, transformers, spacy
    print("✅ Ambiente Python configurado corretamente")
    import spacy
    nlp = spacy.load('pt_core_news_sm')
    print("✅ Modelo spaCy português disponível")
except ImportError as e:
    print(f"❌ Biblioteca ausente: {e}")
    exit(1)
except OSError as e:
    print(f"❌ Modelo spaCy não encontrado: {e}")
    exit(1)
      `]);
      
      pythonProcess.on('close', (code: any) => {
        resolve(code === 0);
      });

      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

// Exporta instância do serviço avançado
export const advancedNLPService = new AdvancedNLPService();
export default advancedNLPService;
