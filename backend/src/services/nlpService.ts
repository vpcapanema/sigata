import { Document, Analysis, AnalysisStatus } from '../types';
import logger from '../utils/logger';

export interface NLPResult {
  summary?: string;
  keywords?: string[];
  entities?: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
  sentiment?: {
    score: number;
    magnitude: number;
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
  topics?: Array<{
    topic: string;
    relevance: number;
  }>;
  participants?: string[];
  decisions?: string[];
  actionItems?: Array<{
    item: string;
    responsible?: string;
    deadline?: string;
  }>;
  meetingData?: {
    date?: string;
    duration?: string;
    location?: string;
    attendees?: number;
  };
}

export class NLPService {
  /**
   * Extrai texto de diferentes tipos de documentos
   */
  async extractTextFromDocument(document: Document): Promise<string> {
    try {
      // Aqui você implementaria a extração de texto baseada no tipo de arquivo
      // Por exemplo, usando bibliotecas como pdf-parse, mammoth (para .docx), etc.
      
      switch (document.mimetype) {
        case 'application/pdf':
          return await this.extractTextFromPDF(document);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractTextFromDOCX(document);
        case 'text/plain':
          return await this.extractTextFromTXT(document);
        default:
          throw new Error(`Tipo de arquivo não suportado: ${document.mimetype}`);
      }
    } catch (error) {
      logger.error('Erro na extração de texto:', error);
      throw new Error('Falha na extração de texto do documento');
    }
  }

  /**
   * Extrai texto de arquivos PDF
   */
  private async extractTextFromPDF(document: Document): Promise<string> {
    try {
      // Implementação usando pdf-parse ou similar
      // const fs = require('fs');
      // const pdf = require('pdf-parse');
      // const dataBuffer = fs.readFileSync(document.path);
      // const data = await pdf(dataBuffer);
      // return data.text;
      
      // Por enquanto, retorna texto simulado
      return `Texto extraído do PDF: ${document.originalName}
      
Esta é uma simulação de extração de texto de um arquivo PDF.
Reunião de planejamento realizada em 09/01/2025.
Participantes: João Silva, Maria Santos, Carlos Lima.
Principais decisões: Aprovação do orçamento anual, contratação de novos funcionários.
Ações pendentes: Preparar relatório mensal (João Silva), revisar processo de contratação (Maria Santos).`;
    } catch (error) {
      logger.error('Erro na extração de texto do PDF:', error);
      throw new Error('Falha na extração de texto do PDF');
    }
  }

  /**
   * Extrai texto de arquivos DOCX
   */
  private async extractTextFromDOCX(document: Document): Promise<string> {
    try {
      // Implementação usando mammoth ou similar
      // const mammoth = require('mammoth');
      // const result = await mammoth.extractRawText({ path: document.path });
      // return result.value;
      
      // Por enquanto, retorna texto simulado
      return `Texto extraído do DOCX: ${document.originalName}
      
Esta é uma simulação de extração de texto de um arquivo Word.
Conteúdo da reunião em formato DOCX.`;
    } catch (error) {
      logger.error('Erro na extração de texto do DOCX:', error);
      throw new Error('Falha na extração de texto do DOCX');
    }
  }

  /**
   * Extrai texto de arquivos TXT
   */
  private async extractTextFromTXT(document: Document): Promise<string> {
    try {
      // const fs = require('fs').promises;
      // return await fs.readFile(document.path, 'utf8');
      
      // Por enquanto, retorna texto simulado
      return `Texto extraído do TXT: ${document.originalName}
      
Esta é uma simulação de extração de texto de um arquivo de texto simples.`;
    } catch (error) {
      logger.error('Erro na extração de texto do TXT:', error);
      throw new Error('Falha na extração de texto do TXT');
    }
  }

  /**
   * Processa texto com NLP e retorna resultados estruturados
   */
  async processText(text: string, analysisType: string): Promise<NLPResult> {
    try {
      logger.info(`Processando texto para análise do tipo: ${analysisType}`);
      
      const result: NLPResult = {};

      // Executa diferentes tipos de análise baseado no tipo solicitado
      if (analysisType === 'FULL' || analysisType === 'SUMMARY') {
        result.summary = await this.generateSummary(text);
      }

      if (analysisType === 'FULL' || analysisType === 'KEYWORDS') {
        result.keywords = await this.extractKeywords(text);
      }

      if (analysisType === 'FULL' || analysisType === 'ENTITIES') {
        result.entities = await this.extractEntities(text);
      }

      if (analysisType === 'FULL' || analysisType === 'SENTIMENT') {
        result.sentiment = await this.analyzeSentiment(text);
      }

      if (analysisType === 'FULL' || analysisType === 'TOPICS') {
        result.topics = await this.extractTopics(text);
      }

      if (analysisType === 'FULL' || analysisType === 'MEETING_DATA') {
        result.participants = await this.extractParticipants(text);
        result.decisions = await this.extractDecisions(text);
        result.actionItems = await this.extractActionItems(text);
        result.meetingData = await this.extractMeetingData(text);
      }

      logger.info('Processamento de texto concluído com sucesso');
      return result;
    } catch (error) {
      logger.error('Erro no processamento de texto:', error);
      throw new Error('Falha no processamento de texto com NLP');
    }
  }

  /**
   * Gera um resumo do texto
   */
  private async generateSummary(text: string): Promise<string> {
    try {
      // Aqui você integraria com uma API de NLP como OpenAI, Google Cloud NL, etc.
      // Exemplo com OpenAI:
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // const response = await openai.chat.completions.create({
      //   model: "gpt-3.5-turbo",
      //   messages: [{ role: "user", content: `Resuma o seguinte texto: ${text}` }],
      //   max_tokens: 150
      // });
      // return response.choices[0].message.content;

      // Por enquanto, implementação básica de sumarização
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summary = sentences.slice(0, 3).join('. ') + '.';
      
      return summary || 'Reunião realizada com discussão de tópicos relevantes e definição de próximos passos.';
    } catch (error) {
      logger.error('Erro na geração de resumo:', error);
      return 'Erro na geração de resumo do documento.';
    }
  }

  /**
   * Extrai palavras-chave do texto
   */
  private async extractKeywords(text: string): Promise<string[]> {
    try {
      // Implementação básica de extração de keywords
      // Em produção, você usaria bibliotecas como natural, compromise, ou APIs externas
      
      const commonWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'e', 'em', 'para', 'com', 'por', 'que', 'se', 'na', 'no'];
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));

      // Conta frequência das palavras
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Retorna as 10 palavras mais frequentes
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    } catch (error) {
      logger.error('Erro na extração de keywords:', error);
      return ['reunião', 'projeto', 'equipe', 'desenvolvimento'];
    }
  }

  /**
   * Extrai entidades nomeadas do texto
   */
  private async extractEntities(text: string): Promise<Array<{
    text: string;
    label: string;
    confidence: number;
  }>> {
    try {
      // Aqui você integraria com APIs de NER (Named Entity Recognition)
      // como spaCy, Google Cloud NL, AWS Comprehend, etc.
      
      const entities: Array<{
        text: string;
        label: string;
        confidence: number;
      }> = [];

      // Implementação básica para extrair nomes (padrões simples)
      const namePatterns = /\b[A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+\b/g;
      const names = text.match(namePatterns) || [];
      
      names.forEach(name => {
        entities.push({
          text: name,
          label: 'PERSON',
          confidence: 0.85
        });
      });

      // Extrai datas (padrão simples)
      const datePatterns = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
      const dates = text.match(datePatterns) || [];
      
      dates.forEach(date => {
        entities.push({
          text: date,
          label: 'DATE',
          confidence: 0.90
        });
      });

      return entities;
    } catch (error) {
      logger.error('Erro na extração de entidades:', error);
      return [];
    }
  }

  /**
   * Analisa o sentimento do texto
   */
  private async analyzeSentiment(text: string): Promise<{
    score: number;
    magnitude: number;
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }> {
    try {
      // Aqui você integraria com APIs de análise de sentimento
      // como Google Cloud NL, AWS Comprehend, Azure Text Analytics, etc.
      
      // Implementação básica de análise de sentimento
      const positiveWords = ['bom', 'ótimo', 'excelente', 'positivo', 'sucesso', 'aprovado', 'satisfatório'];
      const negativeWords = ['ruim', 'péssimo', 'negativo', 'problema', 'erro', 'falha', 'rejeitado'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });
      
      const total = positiveCount + negativeCount;
      if (total === 0) {
        return { score: 0, magnitude: 0, label: 'NEUTRAL' };
      }
      
      const score = (positiveCount - negativeCount) / total;
      const magnitude = total / words.length;
      
      let label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
      if (score > 0.1) label = 'POSITIVE';
      else if (score < -0.1) label = 'NEGATIVE';
      
      return { score, magnitude, label };
    } catch (error) {
      logger.error('Erro na análise de sentimento:', error);
      return { score: 0, magnitude: 0, label: 'NEUTRAL' };
    }
  }

  /**
   * Extrai tópicos principais do texto
   */
  private async extractTopics(text: string): Promise<Array<{
    topic: string;
    relevance: number;
  }>> {
    try {
      // Aqui você implementaria topic modeling com algoritmos como LDA
      // ou integraria com APIs especializadas
      
      // Implementação básica baseada em palavras-chave
      const topics = [
        { topic: 'Planejamento de Projetos', keywords: ['projeto', 'planejamento', 'cronograma', 'prazo'] },
        { topic: 'Recursos Humanos', keywords: ['contratação', 'funcionários', 'equipe', 'recursos'] },
        { topic: 'Financeiro', keywords: ['orçamento', 'custo', 'financeiro', 'investimento'] },
        { topic: 'Desenvolvimento', keywords: ['desenvolvimento', 'código', 'sistema', 'tecnologia'] },
        { topic: 'Reuniões e Comunicação', keywords: ['reunião', 'comunicação', 'apresentação', 'relatório'] }
      ];

      const textLower = text.toLowerCase();
      const results = topics.map(topic => {
        const relevance = topic.keywords.reduce((acc, keyword) => {
          const count = (textLower.match(new RegExp(keyword, 'g')) || []).length;
          return acc + count;
        }, 0) / topic.keywords.length;

        return {
          topic: topic.topic,
          relevance: Math.min(relevance / 10, 1) // Normaliza para 0-1
        };
      }).filter(t => t.relevance > 0).sort((a, b) => b.relevance - a.relevance);

      return results.slice(0, 5);
    } catch (error) {
      logger.error('Erro na extração de tópicos:', error);
      return [];
    }
  }

  /**
   * Extrai participantes da reunião
   */
  private async extractParticipants(text: string): Promise<string[]> {
    try {
      // Padrões para identificar participantes
      const participantPatterns = [
        /participantes?:?\s*([^.]+)/gi,
        /presentes?:?\s*([^.]+)/gi,
        /\b[A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+\b/g
      ];

      const participants = new Set<string>();
      
      participantPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Extrai nomes próprios
            const names = match.match(/\b[A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+\b/g);
            if (names) {
              names.forEach(name => participants.add(name.trim()));
            }
          });
        }
      });

      return Array.from(participants);
    } catch (error) {
      logger.error('Erro na extração de participantes:', error);
      return [];
    }
  }

  /**
   * Extrai decisões tomadas na reunião
   */
  private async extractDecisions(text: string): Promise<string[]> {
    try {
      const decisions: string[] = [];
      
      // Padrões para identificar decisões
      const decisionPatterns = [
        /decidiu-se\s+([^.]+)/gi,
        /foi\s+decidido\s+([^.]+)/gi,
        /aprovado\s+([^.]+)/gi,
        /deliberou-se\s+([^.]+)/gi
      ];

      decisionPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            decisions.push(match.trim());
          });
        }
      });

      return decisions.slice(0, 5);
    } catch (error) {
      logger.error('Erro na extração de decisões:', error);
      return [];
    }
  }

  /**
   * Extrai itens de ação da reunião
   */
  private async extractActionItems(text: string): Promise<Array<{
    item: string;
    responsible?: string;
    deadline?: string;
  }>> {
    try {
      const actionItems: Array<{
        item: string;
        responsible?: string;
        deadline?: string;
      }> = [];

      // Padrões para identificar ações
      const actionPatterns = [
        /ação\s*\d*:?\s*([^.]+)/gi,
        /tarefa\s*\d*:?\s*([^.]+)/gi,
        /deve\s+([^.]+)/gi,
        /responsável\s*:?\s*([^.]+)/gi
      ];

      actionPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Extrai responsável se mencionado
            const responsibleMatch = match.match(/([A-ZÀ-Ÿ][a-zà-ÿ]+ [A-ZÀ-Ÿ][a-zà-ÿ]+)/);
            const responsible = responsibleMatch ? responsibleMatch[1] : undefined;

            // Extrai prazo se mencionado
            const deadlineMatch = match.match(/até\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
            const deadline = deadlineMatch ? deadlineMatch[1] : undefined;

            actionItems.push({
              item: match.trim(),
              responsible,
              deadline
            });
          });
        }
      });

      return actionItems.slice(0, 10);
    } catch (error) {
      logger.error('Erro na extração de itens de ação:', error);
      return [];
    }
  }

  /**
   * Extrai dados gerais da reunião
   */
  private async extractMeetingData(text: string): Promise<{
    date?: string;
    duration?: string;
    location?: string;
    attendees?: number;
  }> {
    try {
      const meetingData: {
        date?: string;
        duration?: string;
        location?: string;
        attendees?: number;
      } = {};

      // Extrai data
      const dateMatch = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
      if (dateMatch) meetingData.date = dateMatch[0];

      // Extrai duração
      const durationMatch = text.match(/duração:?\s*([^.]+)/i) || text.match(/(\d+)\s*horas?/i);
      if (durationMatch) meetingData.duration = durationMatch[1]?.trim();

      // Extrai local
      const locationMatch = text.match(/local:?\s*([^.]+)/i) || text.match(/sala\s+([^.]+)/i);
      if (locationMatch) meetingData.location = locationMatch[1]?.trim();

      // Conta participantes (nomes próprios únicos)
      const participants = await this.extractParticipants(text);
      meetingData.attendees = participants.length;

      return meetingData;
    } catch (error) {
      logger.error('Erro na extração de dados da reunião:', error);
      return {};
    }
  }

  /**
   * Salva o resultado de uma análise no banco de dados
   */
  async saveAnalysisResult(analysisId: string, result: NLPResult): Promise<void> {
    try {
      // Aqui você implementaria a lógica para salvar no banco
      // Por enquanto, apenas log do resultado
      logger.info(`Salvando resultado da análise ${analysisId}`, { result });
      logger.info(`Análise ${analysisId} concluída com sucesso`);
    } catch (error) {
      logger.error(`Erro ao salvar resultado da análise ${analysisId}:`, error);
      throw new Error('Erro ao salvar resultado da análise');
    }
  }

  /**
   * Executa uma análise completa de um documento
   */
  async analyzeDocument(analysisId: string): Promise<NLPResult> {
    try {
      logger.info(`Iniciando análise do documento para análise ${analysisId}`);
      
      // Aqui você implementaria a busca do documento e análise
      // Por enquanto, retorna um resultado mock para demonstração
      const mockResult: NLPResult = {
        summary: 'Reunião realizada para discutir o planejamento do projeto e definir próximos passos. Foram aprovadas as propostas de orçamento e cronograma.',
        keywords: ['reunião', 'planejamento', 'projeto', 'orçamento', 'cronograma', 'aprovação', 'equipe', 'desenvolvimento'],
        entities: [
          { text: 'João Silva', label: 'PERSON', confidence: 0.95 },
          { text: 'Maria Santos', label: 'PERSON', confidence: 0.92 },
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
          { topic: 'Recursos Humanos', relevance: 0.65 },
          { topic: 'Financeiro', relevance: 0.72 }
        ],
        participants: ['João Silva', 'Maria Santos', 'Carlos Lima'],
        decisions: [
          'Aprovação do orçamento anual para o projeto',
          'Contratação de dois novos desenvolvedores',
          'Implementação da metodologia ágil na equipe'
        ],
        actionItems: [
          { 
            item: 'Preparar relatório mensal de progresso', 
            responsible: 'João Silva', 
            deadline: '2025-01-15' 
          },
          { 
            item: 'Revisar processo de contratação da equipe', 
            responsible: 'Maria Santos', 
            deadline: '2025-01-20' 
          },
          { 
            item: 'Configurar ambiente de desenvolvimento', 
            responsible: 'Carlos Lima', 
            deadline: '2025-01-25' 
          }
        ],
        meetingData: {
          date: '2025-01-09',
          duration: '2 horas',
          location: 'Sala de Reuniões A',
          attendees: 3
        }
      };

      logger.info(`Análise ${analysisId} concluída com sucesso`);
      return mockResult;
    } catch (error) {
      logger.error(`Erro no processamento da análise ${analysisId}:`, error as Error);
      throw new Error(`Erro interno no processamento: ${(error as Error).message || 'Erro desconhecido'}`);
    }
  }
}

// Exporta uma instância única do serviço (singleton)
export const nlpService = new NLPService();
export default nlpService;
