/**
 * SIGATA Basic NLP Service
 * Funções NLP básicas movidas do index.ts para modularização
 */

export interface BasicNLPResult {
  entities: any[];
  keywords: any[];
  sentiment: any;
  participants: string[];
  decisions: any[];
  actions: any[];
  summary: string;
  topics: any[];
  confidence: number;
}

export class BasicNLPService {

  public processNLP(text: string): BasicNLPResult {
    console.log('🧠 Iniciando processamento NLP básico...');
    
    // Extrair entidades básicas (nomes, organizações, etc.)
    const entities = this.extractEntities(text);
    console.log(`   ✅ Entidades extraídas: ${entities.length}`);
    
    // Extrair palavras-chave
    const keywords = this.extractKeywords(text);
    console.log(`   ✅ Palavras-chave: ${keywords.length}`);
    
    // Análise de sentimento básica
    const sentiment = this.analyzeSentiment(text);
    console.log(`   ✅ Sentimento: ${sentiment.label} (${sentiment.score.toFixed(3)})`);
    
    // Extrair participantes
    const participants = this.extractParticipants(text);
    console.log(`   ✅ Participantes: ${participants.length}`);
    
    // Extrair decisões e ações
    const decisions = this.extractDecisions(text);
    const actions = this.extractActions(text);
    console.log(`   ✅ Decisões: ${decisions.length}, Ações: ${actions.length}`);
    
    const topics = this.extractTopics(text);
    console.log(`   ✅ Tópicos identificados: ${topics.length}`);
    
    return {
      entities,
      keywords,
      sentiment,
      participants,
      decisions,
      actions,
      summary: this.generateSummary(text),
      topics,
      confidence: this.calculateConfidence(entities, keywords, participants)
    };
  }

  private extractEntities(text: string) {
    const entities = [];
    
    // Extrair nomes completos (padrão brasileiro)
    const namePattern = /\b([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇ][a-záéíóúâêîôûàèìòùãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇ][a-záéíóúâêîôûàèìòùãõç]+)+)\b/g;
    let match;
    const foundNames = new Set();
    
    while ((match = namePattern.exec(text)) !== null) {
      const name = match[1];
      if (name.length > 5 && !foundNames.has(name)) {
        entities.push({
          type: 'PERSON',
          value: name,
          position: match.index,
          confidence: 0.8
        });
        foundNames.add(name);
      }
    }
    
    // Extrair organizações (padrões brasileiros)
    const orgPattern = /\b([A-ZÁÉÍÓÚ][A-Za-záéíóúâêîôûàèìòùãõç\s]+(?:S\.A\.|LTDA|ME|EPP|EIRELI|Corp|Inc|Company|Empresa|Instituto|Fundação|Associação|Cooperativa))\b/g;
    const foundOrgs = new Set();
    
    while ((match = orgPattern.exec(text)) !== null) {
      const org = match[1].trim();
      if (!foundOrgs.has(org)) {
        entities.push({
          type: 'ORGANIZATION',
          value: org,
          position: match.index,
          confidence: 0.9
        });
        foundOrgs.add(org);
      }
    }
    
    // Extrair datas (formatos brasileiros)
    const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|(?:segunda|terça|quarta|quinta|sexta|sábado|domingo).feira)/g;
    const foundDates = new Set();
    
    while ((match = datePattern.exec(text)) !== null) {
      const date = match[1];
      if (!foundDates.has(date)) {
        entities.push({
          type: 'DATE',
          value: date,
          position: match.index,
          confidence: 0.95
        });
        foundDates.add(date);
      }
    }
    
    // Extrair locais
    const locationPattern = /\b(Sala\s+\w+|Auditório\s+\w+|Reunião\s+Virtual|São\s+Paulo|Rio\s+de\s+Janeiro|Brasília|[A-Z][a-z]+\s*-\s*[A-Z]{2})\b/g;
    const foundLocations = new Set();
    
    while ((match = locationPattern.exec(text)) !== null) {
      const location = match[1];
      if (!foundLocations.has(location)) {
        entities.push({
          type: 'LOCATION',
          value: location,
          position: match.index,
          confidence: 0.7
        });
        foundLocations.add(location);
      }
    }
    
    return entities.sort((a, b) => b.confidence - a.confidence);
  }

  private extractKeywords(text: string) {
    const stopWords = [
      'a', 'o', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'por', 'se', 'que', 'como', 
      'foi', 'são', 'dos', 'das', 'nos', 'nas', 'pelo', 'pela', 'ao', 'aos', 'às', 'na', 'no', 'esta', 'este',
      'essa', 'esse', 'isso', 'aquela', 'aquele', 'aquilo', 'muito', 'mais', 'menos', 'já', 'ainda', 'também',
      'só', 'apenas', 'até', 'desde', 'após', 'antes', 'durante', 'sobre', 'sob', 'entre', 'contra', 'sem',
      'ter', 'ser', 'estar', 'fazer', 'dizer', 'poder', 'dever', 'querer', 'ir', 'vir', 'ver', 'dar'
    ];
    
    // Limpar e tokenizar o texto
    const words = text.toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !stopWords.includes(word) && 
        !/^\d+$/.test(word) // remover números puros
      );
    
    // Contar frequências
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Calcular relevância baseada em frequência e contexto
    return Object.entries(wordCount)
      .map(([word, count]) => {
        const relevance = this.calculateWordRelevance(word, count, words.length);
        return { 
          word, 
          frequency: count, 
          relevance,
          weight: Math.min(1.0, count / 10) // peso normalizado
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 25);
  }

  private calculateWordRelevance(word: string, frequency: number, totalWords: number): number {
    // Palavras relacionadas a reuniões têm peso maior
    const meetingWords = ['reunião', 'ata', 'decisão', 'ação', 'projeto', 'equipe', 'responsável', 'prazo'];
    const businessWords = ['empresa', 'cliente', 'mercado', 'produto', 'serviço', 'vendas', 'marketing'];
    
    let relevanceBoost = 1.0;
    
    if (meetingWords.some(mw => word.includes(mw) || mw.includes(word))) {
      relevanceBoost = 1.5;
    } else if (businessWords.some(bw => word.includes(bw) || bw.includes(word))) {
      relevanceBoost = 1.3;
    }
    
    // TF-IDF simplificado
    const tf = frequency / totalWords;
    const idf = Math.log(totalWords / frequency);
    
    return tf * idf * relevanceBoost;
  }

  private analyzeSentiment(text: string) {
    // Dicionários de sentimento em português
    const positiveWords = [
      'bom', 'ótimo', 'excelente', 'positivo', 'sucesso', 'aprovado', 'concordo', 'satisfeito',
      'feliz', 'alegre', 'contente', 'animado', 'confiante', 'otimista', 'eficiente', 'produtivo',
      'alcançou', 'conquistou', 'ganhou', 'venceu', 'melhorou', 'cresceu', 'avançou', 'progrediu',
      'parabenizar', 'elogiar', 'reconhecer', 'valorizar', 'agradecer', 'qualidade', 'inovação'
    ];
    
    const negativeWords = [
      'ruim', 'péssimo', 'negativo', 'problema', 'erro', 'rejeitado', 'discordo', 'insatisfeito',
      'triste', 'preocupado', 'ansioso', 'estressado', 'frustrado', 'decepcionado', 'crítico',
      'falhou', 'perdeu', 'diminuiu', 'piorou', 'atrasou', 'cancelou', 'interrompeu', 'falha',
      'defeito', 'reclamação', 'queixa', 'insuficiente', 'inadequado', 'ineficiente', 'custoso'
    ];
    
    const neutralWords = [
      'informar', 'comunicar', 'apresentar', 'discutir', 'analisar', 'revisar', 'verificar',
      'observar', 'notar', 'mencionar', 'citar', 'relatar', 'registrar', 'documentar'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    words.forEach(word => {
      positiveWords.forEach(pw => {
        if (word.includes(pw) || pw.includes(word)) positiveScore += 1;
      });
      negativeWords.forEach(nw => {
        if (word.includes(nw) || nw.includes(word)) negativeScore += 1;
      });
      neutralWords.forEach(neutw => {
        if (word.includes(neutw) || neutw.includes(word)) neutralScore += 0.5;
      });
    });
    
    const totalSentimentWords = positiveScore + negativeScore + neutralScore;
    const normalizedScore = totalSentimentWords > 0 
      ? (positiveScore - negativeScore) / totalSentimentWords 
      : 0;
    
    let label = 'neutral';
    if (normalizedScore > 0.2) label = 'positive';
    else if (normalizedScore < -0.2) label = 'negative';
    
    return {
      score: normalizedScore,
      label,
      confidence: Math.min(0.9, totalSentimentWords / 10),
      breakdown: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore
      }
    };
  }

  private extractParticipants(text: string) {
    const participants: string[] = [];
    
    try {
      // Buscar padrão "PARTICIPANTES:" seguido de lista
      const participantSection = text.match(/PARTICIPANTES:?\s*([^]*?)(?=\n\s*[A-Z]|\n\s*$|$)/i);
      if (participantSection) {
        const lines = participantSection[1].split('\n');
        lines.forEach(line => {
          const name = line.replace(/^[-\s]*/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
          if (name.length > 3 && name.includes(' ') && /^[A-Za-záéíóúâêîôûàèìòùãõç\s]+$/.test(name)) {
            participants.push(name);
          }
        });
      }
      
      // Buscar nomes que aparecem seguidos de verbos de fala
      const speechMatches = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:disse|relatou|mencionou|apresentou|iniciou)/g);
      if (speechMatches) {
        speechMatches.forEach(match => {
          const name = match.replace(/\s+(?:disse|relatou|mencionou|apresentou|iniciou).*/, '').trim();
          if (!participants.includes(name)) {
            participants.push(name);
          }
        });
      }
      
    } catch (error) {
      console.log('Erro na extração de participantes:', error);
    }
    
    return participants.slice(0, 20);
  }

  private extractDecisions(text: string) {
    const decisions: any[] = [];
    
    const decisionPatterns = [
      /\b(?:decidiu-se|foi decidido|deliberou-se|resolveu-se|aprovou-se|definiu-se)([^.!?]+)/gi,
      /\b(?:decisão|deliberação|resolução):\s*([^.!?]+)/gi,
      /\b(?:ficou definido|ficou decidido|ficou acordado)([^.!?]+)/gi
    ];
    
    decisionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const decision = match[1].trim();
        if (decision.length > 10) {
          decisions.push({
            text: decision,
            type: 'decision',
            confidence: 0.8
          });
        }
      }
    });
    
    return decisions.slice(0, 10);
  }

  private extractActions(text: string) {
    const actions: any[] = [];
    
    const actionPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:deve|deverá|ficou responsável|fica responsável)([^.!?]+)/gi,
      /\b(?:ação|tarefa|responsabilidade):\s*([^.!?]+)/gi,
      /\b(?:prazo|deadline):\s*([^.!?]+)/gi
    ];
    
    actionPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (index === 0) { // Padrão com responsável
          actions.push({
            responsible: match[1].trim(),
            action: match[2].trim(),
            type: 'action_with_responsible',
            confidence: 0.9
          });
        } else {
          actions.push({
            text: match[1].trim(),
            type: 'action',
            confidence: 0.7
          });
        }
      }
    });
    
    return actions.slice(0, 15);
  }

  private generateSummary(text: string) {
    const sentences = text
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 30)
      .map(s => s.trim());
    
    // Priorizar sentenças que contêm palavras-chave importantes
    const importantWords = ['reunião', 'projeto', 'decisão', 'aprovado', 'definido', 'prazo'];
    
    const rankedSentences = sentences
      .map(sentence => {
        const score = importantWords.reduce((acc, word) => {
          return acc + (sentence.toLowerCase().includes(word) ? 1 : 0);
        }, 0);
        return { sentence, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence);
    
    return rankedSentences.join('. ') + '.';
  }

  private extractTopics(text: string) {
    const topicKeywords = {
      'Gestão de Projetos': {
        keywords: ['projeto', 'cronograma', 'prazo', 'entrega', 'milestone', 'etapa', 'fase', 'planejamento'],
        weight: 1.2
      },
      'Recursos Humanos': {
        keywords: ['funcionário', 'contratação', 'treinamento', 'equipe', 'pessoal', 'colaborador', 'rh'],
        weight: 1.1
      },
      'Financeiro': {
        keywords: ['orçamento', 'custo', 'investimento', 'receita', 'despesa', 'financeiro', 'pagamento'],
        weight: 1.3
      },
      'Tecnologia': {
        keywords: ['sistema', 'software', 'desenvolvimento', 'tecnologia', 'implementação', 'ti', 'digital'],
        weight: 1.0
      },
      'Vendas e Marketing': {
        keywords: ['cliente', 'venda', 'mercado', 'produto', 'proposta', 'marketing', 'comercial'],
        weight: 1.1
      },
      'Operações': {
        keywords: ['processo', 'operação', 'produção', 'qualidade', 'eficiência', 'melhoria'],
        weight: 1.0
      }
    };
    
    const topics: any[] = [];
    const textLower = text.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, config]) => {
      const count = config.keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);
      
      if (count > 0) {
        topics.push({ 
          topic, 
          relevance: count * config.weight,
          mentions: count,
          confidence: Math.min(0.95, count / 5)
        });
      }
    });
    
    return topics.sort((a, b) => b.relevance - a.relevance);
  }

  private calculateConfidence(entities: any[], keywords: any[], participants: any[]): number {
    const entityScore = Math.min(1.0, entities.length / 10);
    const keywordScore = Math.min(1.0, keywords.length / 20);
    const participantScore = Math.min(1.0, participants.length / 5);
    
    return (entityScore + keywordScore + participantScore) / 3;
  }
}
