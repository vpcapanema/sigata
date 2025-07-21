
import { Request, Response } from 'express';
import { database } from '../config/database';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface NLPAnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ProcessingController {
  /**
   * Obtém resultados da análise NLP de um documento
   */
  public async getAnalysisResults(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      
      // Usar apenas codigo_documento para evitar erros de conversão UUID
      const query = "SELECT nome_arquivo, status_processamento, resultado_nlp, metricas_nlp, palavras_chave_nlp, participantes_nlp FROM sigata.documento_base WHERE codigo_documento = $1";
      const result = await database.query(query, [documentId]);
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Documento não encontrado' });
        return;
      }
      const document = result.rows[0];
      if (document.status_processamento !== 'CONCLUIDO') {
        res.status(400).json({ success: false, error: 'Documento ainda não foi processado ou está em processamento' });
        return;
      }
      res.json({
        success: true,
        results: {
          filename: document.nome_arquivo,
          status: document.status_processamento,
          analysis: document.resultado_nlp ? JSON.parse(document.resultado_nlp) : null,
          metrics: document.metricas_nlp ? JSON.parse(document.metricas_nlp) : null,
          keywords: document.palavras_chave_nlp ? JSON.parse(document.palavras_chave_nlp) : [],
          participants: document.participantes_nlp || []
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao obter resultados da análise' });
    }
  }
  /**
   * Inicia o processamento NLP real de um documento
   */
  public async startProcessing(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      console.log('Iniciando processamento para documento ID:', documentId);
      
      // Buscar documento pelo codigo_documento ou id numérico
      const documentQuery = "SELECT id, codigo_documento, nome_arquivo, texto_extraido, status_processamento FROM sigata.documento_base WHERE codigo_documento = $1 OR id = $1";
      const documentResult = await database.query(documentQuery, [documentId]);
      
      if (documentResult.rows.length === 0) {
        console.error(`Documento não encontrado com codigo_documento = ${documentId}`);
        res.status(404).json({ success: false, error: 'Documento não encontrado' });
        return;
      }
      
      console.log(`Documento encontrado: ${JSON.stringify(documentResult.rows[0])}`);
      
      const document = documentResult.rows[0];
      
      // Permitir reprocessamento se o documento já foi processado
      const isReprocessing = document.status_processamento === 'CONCLUIDO';
      
      if (document.status_processamento === 'PROCESSANDO') {
        res.status(400).json({ success: false, error: 'Documento já está sendo processado' });
        return;
      }
      
      if (!document.texto_extraido || document.texto_extraido.trim().length < 10) {
        res.status(400).json({ success: false, error: 'Texto do documento muito pequeno para processamento' });
        return;
      }
      
      // Atualizar status para PROCESSANDO - usar apenas codigo_documento
      await database.query(
        "UPDATE sigata.documento_base SET status_processamento = $1, data_inicio_processamento = NOW() WHERE codigo_documento = $2",
        ['PROCESSANDO', documentId]
      );
      
      // Importar o serviço avançado de NLP
      const { sigataAdvancedNLP } = require('../services/sigataAdvancedNLPService');
      
      // Processamento NLP em background usando o serviço avançado
      console.log(`Iniciando processamento NLP para documento ${documentId} (${document.nome_arquivo})`);
      sigataAdvancedNLP.processDocument(document.texto_extraido, document.nome_arquivo, documentId)
        .then(async (result: any) => {
          // Salvar resultados do processamento avançado
          await this.saveAdvancedNLPResults(documentId, result);
          console.log(`✅ Processamento NLP concluído para documento ${documentId}`);
        })
        .catch(async (error: any) => {
          console.error(`❌ Erro no processamento NLP para documento ${documentId}:`, error);
          await this.markProcessingError(documentId, error.message || 'Erro desconhecido no processamento NLP');
        });
      
      // Responder ao cliente
      res.status(200).json({
        success: true,
        message: isReprocessing ? 'Reprocessamento iniciado com sucesso' : 'Processamento iniciado com sucesso',
        data: {
          documentId: documentId,
          filename: document.nome_arquivo,
          status: 'PROCESSANDO',
          startTime: new Date().toISOString(),
          isReprocessing: isReprocessing
        }
      });
    } catch (error) {
      console.error('Erro ao iniciar processamento:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Salva os resultados do processamento NLP no banco
   */
  private async saveNLPResults(documentId: string, nlpData: any): Promise<void> {
    // Obter o ID numérico do documento
    const getDocumentQuery = "SELECT id FROM sigata.documento_base WHERE codigo_documento = $1 OR id = $1";
    const documentResult = await database.query(getDocumentQuery, [documentId]);
    
    if (documentResult.rows.length === 0) {
      throw new Error(`Documento não encontrado: ${documentId}`);
    }
    
    // Usar o ID numérico para as operações de banco de dados
    const numericId = documentResult.rows[0].id;
    // Atualiza documento_base (mantém para compatibilidade)
    const updateBase = `UPDATE sigata.documento_base 
      SET resultado_nlp = $1, metricas_nlp = $2, palavras_chave_nlp = $3, participantes_nlp = $4, status_processamento = $5, descricao = $6
      WHERE codigo_documento = $7`;
    const metricasNLP = {
      coherence_metrics: nlpData.coherence_metrics,
      silhouette_metrics: nlpData.silhouette_metrics,
      topic_diversity: nlpData.topic_diversity,
      mmr_metrics: nlpData.mmr_metrics,
      bert_score_metrics: nlpData.bert_score_metrics,
      performance_score: nlpData.performance_score,
      confidence_interval_95: nlpData.confidence_interval_95
    };
    await database.query(updateBase, [
      JSON.stringify(nlpData),
      JSON.stringify(metricasNLP),
      JSON.stringify(nlpData.keywords),
      JSON.stringify(nlpData.participants),
      'CONCLUIDO',
      `Processado via NLP - Score: ${nlpData.performance_score} - ${nlpData.keywords?.length || 0} palavras-chave - ${nlpData.participants?.length || 0} participantes`,
      documentId
    ]);

    // Preencher documento_nlp_dados usando o ID numérico
    const upsertNLPDados = `INSERT INTO sigata.documento_nlp_dados (
      documento_id, nlp_entidades_extraidas, participantes_extraidos, nlp_resumo_automatico, nlp_palavras_frequentes, decisoes_extraidas, acoes_extraidas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (documento_id) DO UPDATE SET
        nlp_entidades_extraidas = EXCLUDED.nlp_entidades_extraidas,
        participantes_extraidos = EXCLUDED.participantes_extraidos,
        nlp_resumo_automatico = EXCLUDED.nlp_resumo_automatico,
        nlp_palavras_frequentes = EXCLUDED.nlp_palavras_frequentes,
        decisoes_extraidas = EXCLUDED.decisoes_extraidas,
        acoes_extraidas = EXCLUDED.acoes_extraidas`;
    await database.query(upsertNLPDados, [
      numericId,
      JSON.stringify(nlpData.entities),
      JSON.stringify(nlpData.participants),
      nlpData.summary || null,
      JSON.stringify(nlpData.keywords),
      nlpData.decisions ? nlpData.decisions.map((d: any) => d.text) : [],
      JSON.stringify(nlpData.actions || [])
    ]);

    // Preencher documento_nlp_metricas usando o ID numérico
    const upsertNLPMetricas = `INSERT INTO sigata.documento_nlp_metricas (
      documento_id, metrica_coerencia, metrica_silhueta, bert_precisao, bert_revocacao, bert_pontuacao_f1, tempo_processamento_ms, modelo_bert_utilizado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (documento_id) DO UPDATE SET
        metrica_coerencia = EXCLUDED.metrica_coerencia,
        metrica_silhueta = EXCLUDED.metrica_silhueta,
        bert_precisao = EXCLUDED.bert_precisao,
        bert_revocacao = EXCLUDED.bert_revocacao,
        bert_pontuacao_f1 = EXCLUDED.bert_pontuacao_f1,
        tempo_processamento_ms = EXCLUDED.tempo_processamento_ms,
        modelo_bert_utilizado = EXCLUDED.modelo_bert_utilizado`;
    await database.query(upsertNLPMetricas, [
      numericId,
      nlpData.coherence_metrics?.c_v || null,
      nlpData.silhouette_metrics?.silhouette_score || null,
      nlpData.bert_score_metrics?.precision || null,
      nlpData.bert_score_metrics?.recall || null,
      nlpData.bert_score_metrics?.f1_score || null,
      null, // tempo_processamento_ms: pode ser calculado e preenchido depois
      'distilbert-base-multilingual-cased' // modelo_bert_utilizado (ajustar se necessário)
    ]);

    // Preencher documento_ata_dados usando o ID numérico
    const upsertAtaDados = `INSERT INTO sigata.documento_ata_dados (
      documento_id, titulo_reuniao, data_reuniao, local_reuniao, numero_participantes, observacoes_gerais)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (documento_id) DO UPDATE SET
        titulo_reuniao = EXCLUDED.titulo_reuniao,
        data_reuniao = EXCLUDED.data_reuniao,
        local_reuniao = EXCLUDED.local_reuniao,
        numero_participantes = EXCLUDED.numero_participantes,
        observacoes_gerais = EXCLUDED.observacoes_gerais`;
    await database.query(upsertAtaDados, [
      numericId,
      nlpData.summary || null,
      null, // data_reuniao: pode ser extraída do texto se disponível
      null, // local_reuniao: idem
      Array.isArray(nlpData.participants) ? nlpData.participants.length : null,
      null // observacoes_gerais
    ]);

    // Preencher documento_qualidade usando o ID numérico
    const upsertQualidade = `INSERT INTO sigata.documento_qualidade (
      documento_id, quantidade_palavras, quantidade_caracteres, quantidade_paragrafos)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (documento_id) DO UPDATE SET
        quantidade_palavras = EXCLUDED.quantidade_palavras,
        quantidade_caracteres = EXCLUDED.quantidade_caracteres,
        quantidade_paragrafos = EXCLUDED.quantidade_paragrafos`;
    await database.query(upsertQualidade, [
      numericId,
      nlpData.summary ? nlpData.summary.split(' ').length : null,
      nlpData.summary ? nlpData.summary.length : null,
      nlpData.summary ? nlpData.summary.split('\n').length : null
    ]);

    // Preencher documento_controle (workflow básico)
    const upsertControle = `INSERT INTO sigata.documento_controle (
      documento_id, versao_documento, status_validacao, visibilidade, confidencialidade)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (documento_id) DO UPDATE SET
        versao_documento = EXCLUDED.versao_documento,
        status_validacao = EXCLUDED.status_validacao,
        visibilidade = EXCLUDED.visibilidade,
        confidencialidade = EXCLUDED.confidencialidade`;
    await database.query(upsertControle, [
      documentId,
      1,
      'VALIDADO',
      'PUBLICO',
      'NORMAL'
    ]);
  }

  /**
   * Salva os resultados do processamento NLP avançado no banco
   */
  private async saveAdvancedNLPResults(documentId: string, nlpResult: any): Promise<void> {
    try {
      // Obter o ID numérico do documento
      const getDocumentQuery = "SELECT id FROM sigata.documento_base WHERE codigo_documento = $1 OR id = $1";
      const documentResult = await database.query(getDocumentQuery, [documentId]);
      
      if (documentResult.rows.length === 0) {
        throw new Error(`Documento não encontrado: ${documentId}`);
      }
      
      // Usar o ID numérico para as operações de banco de dados
      const numericId = documentResult.rows[0].id;
      // 1. Atualizar documento_base com status e resultados básicos
      const updateBase = `UPDATE sigata.documento_base 
        SET resultado_nlp = $1, 
            metricas_nlp = $2, 
            palavras_chave_nlp = $3, 
            participantes_nlp = $4, 
            status_processamento = $5, 
            descricao = $6,
            data_fim_processamento = NOW()
        WHERE codigo_documento = $7`;
      
      await database.query(updateBase, [
        JSON.stringify(nlpResult.basic_analysis),
        JSON.stringify({
          bertopic: nlpResult.bertopic_metrics,
          keybert: nlpResult.keybert_metrics,
          bertscore: nlpResult.bertscore_metrics
        }),
        JSON.stringify(nlpResult.basic_analysis.keywords),
        JSON.stringify(nlpResult.basic_analysis.participants),
        'CONCLUIDO',
        `Processado via NLP Avançado - Score: ${(nlpResult.bertscore_metrics?.f1_score * 100).toFixed(1)}% - ${nlpResult.basic_analysis.keywords?.length || 0} palavras-chave`,
        documentId
      ]);

      // 2. Atualizar documento_nlp_dados usando o ID numérico
      const upsertNLPDados = `INSERT INTO sigata.documento_nlp_dados (
        documento_id, 
        idioma_detectado, 
        nlp_entidades_extraidas, 
        participantes_extraidos, 
        nlp_resumo_automatico, 
        nlp_palavras_frequentes, 
        decisoes_extraidas, 
        acoes_extraidas,
        sentimento_geral,
        pontuacao_sentimento,
        nivel_formalidade,
        complexidade_linguistica
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (documento_id) DO UPDATE SET
        idioma_detectado = EXCLUDED.idioma_detectado,
        nlp_entidades_extraidas = EXCLUDED.nlp_entidades_extraidas,
        participantes_extraidos = EXCLUDED.participantes_extraidos,
        nlp_resumo_automatico = EXCLUDED.nlp_resumo_automatico,
        nlp_palavras_frequentes = EXCLUDED.nlp_palavras_frequentes,
        decisoes_extraidas = EXCLUDED.decisoes_extraidas,
        acoes_extraidas = EXCLUDED.acoes_extraidas,
        sentimento_geral = EXCLUDED.sentimento_geral,
        pontuacao_sentimento = EXCLUDED.pontuacao_sentimento,
        nivel_formalidade = EXCLUDED.nivel_formalidade,
        complexidade_linguistica = EXCLUDED.complexidade_linguistica`;
      
      await database.query(upsertNLPDados, [
        numericId,
        nlpResult.documento_nlp_dados.idioma_detectado,
        JSON.stringify(nlpResult.documento_nlp_dados.entidades_nomeadas),
        JSON.stringify(nlpResult.basic_analysis.participants),
        nlpResult.documento_nlp_dados.resumo_automatico,
        JSON.stringify(nlpResult.documento_nlp_dados.palavras_chave_extraidas),
        JSON.stringify(nlpResult.basic_analysis.decisions || []),
        JSON.stringify(nlpResult.basic_analysis.actions || []),
        nlpResult.documento_nlp_dados.sentimento_geral,
        nlpResult.documento_nlp_dados.pontuacao_sentimento,
        nlpResult.documento_nlp_dados.nivel_formalidade,
        nlpResult.documento_nlp_dados.complexidade_linguistica
      ]);

      // 3. Atualizar documento_nlp_metricas usando o ID numérico
      const upsertNLPMetricas = `INSERT INTO sigata.documento_nlp_metricas (
        documento_id, 
        densidade_palavras_chave, 
        diversidade_lexical, 
        coesao_textual, 
        indice_legibilidade, 
        frequencia_termos_tecnicos, 
        pontuacao_objetividade, 
        indice_redundancia,
        metrica_coerencia,
        metrica_silhueta,
        bert_precisao,
        bert_revocacao,
        bert_pontuacao_f1,
        tempo_processamento_ms,
        modelo_bert_utilizado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (documento_id) DO UPDATE SET
        densidade_palavras_chave = EXCLUDED.densidade_palavras_chave,
        diversidade_lexical = EXCLUDED.diversidade_lexical,
        coesao_textual = EXCLUDED.coesao_textual,
        indice_legibilidade = EXCLUDED.indice_legibilidade,
        frequencia_termos_tecnicos = EXCLUDED.frequencia_termos_tecnicos,
        pontuacao_objetividade = EXCLUDED.pontuacao_objetividade,
        indice_redundancia = EXCLUDED.indice_redundancia,
        metrica_coerencia = EXCLUDED.metrica_coerencia,
        metrica_silhueta = EXCLUDED.metrica_silhueta,
        bert_precisao = EXCLUDED.bert_precisao,
        bert_revocacao = EXCLUDED.bert_revocacao,
        bert_pontuacao_f1 = EXCLUDED.bert_pontuacao_f1,
        tempo_processamento_ms = EXCLUDED.tempo_processamento_ms,
        modelo_bert_utilizado = EXCLUDED.modelo_bert_utilizado`;
      
      await database.query(upsertNLPMetricas, [
        numericId,
        nlpResult.documento_nlp_metricas.densidade_palavras_chave,
        nlpResult.documento_nlp_metricas.diversidade_lexical,
        nlpResult.documento_nlp_metricas.coesao_textual,
        nlpResult.documento_nlp_metricas.indice_legibilidade,
        nlpResult.documento_nlp_metricas.frequencia_termos_tecnicos,
        nlpResult.documento_nlp_metricas.pontuacao_objetividade,
        nlpResult.documento_nlp_metricas.indice_redundancia,
        nlpResult.bertopic_metrics?.coherence_score || null,
        nlpResult.bertopic_metrics?.silhouette_score || null,
        nlpResult.bertscore_metrics?.precision || null,
        nlpResult.bertscore_metrics?.recall || null,
        nlpResult.bertscore_metrics?.f1_score || null,
        nlpResult.processing_metadata?.processing_time_ms || null,
        nlpResult.processing_metadata?.models_used?.bertscore_model || 'distilbert-base-multilingual-cased'
      ]);

      // 4. Atualizar documento_ata_dados usando o ID numérico
      const upsertAtaDados = `INSERT INTO sigata.documento_ata_dados (
        documento_id, 
        titulo_reuniao, 
        data_reuniao, 
        local_reuniao, 
        organizacao_responsavel,
        tipo_reuniao,
        status_reuniao,
        numero_participantes, 
        duracao_estimada_minutos,
        observacoes_gerais
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (documento_id) DO UPDATE SET
        titulo_reuniao = EXCLUDED.titulo_reuniao,
        data_reuniao = EXCLUDED.data_reuniao,
        local_reuniao = EXCLUDED.local_reuniao,
        organizacao_responsavel = EXCLUDED.organizacao_responsavel,
        tipo_reuniao = EXCLUDED.tipo_reuniao,
        status_reuniao = EXCLUDED.status_reuniao,
        numero_participantes = EXCLUDED.numero_participantes,
        duracao_estimada_minutos = EXCLUDED.duracao_estimada_minutos,
        observacoes_gerais = EXCLUDED.observacoes_gerais`;
      
      await database.query(upsertAtaDados, [
        numericId,
        nlpResult.documento_ata_dados.titulo_reuniao,
        nlpResult.documento_ata_dados.data_reuniao,
        nlpResult.documento_ata_dados.local_reuniao,
        nlpResult.documento_ata_dados.organizacao_responsavel,
        nlpResult.documento_ata_dados.tipo_reuniao,
        nlpResult.documento_ata_dados.status_reuniao,
        nlpResult.documento_ata_dados.numero_participantes,
        nlpResult.documento_ata_dados.duracao_estimada_minutos,
        nlpResult.documento_ata_dados.observacoes_gerais
      ]);

      // 5. Atualizar documento_qualidade usando o ID numérico
      const upsertQualidade = `INSERT INTO sigata.documento_qualidade (
        documento_id, 
        pontuacao_legibilidade,
        pontuacao_estrutura,
        pontuacao_completude,
        pontuacao_coerencia,
        pontuacao_geral,
        nivel_confianca,
        quantidade_palavras, 
        quantidade_caracteres, 
        quantidade_paragrafos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (documento_id) DO UPDATE SET
        pontuacao_legibilidade = EXCLUDED.pontuacao_legibilidade,
        pontuacao_estrutura = EXCLUDED.pontuacao_estrutura,
        pontuacao_completude = EXCLUDED.pontuacao_completude,
        pontuacao_coerencia = EXCLUDED.pontuacao_coerencia,
        pontuacao_geral = EXCLUDED.pontuacao_geral,
        nivel_confianca = EXCLUDED.nivel_confianca,
        quantidade_palavras = EXCLUDED.quantidade_palavras,
        quantidade_caracteres = EXCLUDED.quantidade_caracteres,
        quantidade_paragrafos = EXCLUDED.quantidade_paragrafos`;
      
      const resumo = nlpResult.documento_nlp_dados.resumo_automatico || '';
      const palavras = resumo.split(/\s+/).length;
      const paragrafos = resumo.split('\n').length;
      
      await database.query(upsertQualidade, [
        numericId,
        nlpResult.documento_nlp_metricas.indice_legibilidade * 10, // Escala 0-10
        nlpResult.documento_nlp_metricas.coesao_textual * 10,     // Escala 0-10
        nlpResult.bertscore_metrics?.f1_score * 10 || 7,          // Escala 0-10
        nlpResult.documento_nlp_metricas.coesao_textual * 10,     // Escala 0-10
        nlpResult.bertscore_metrics?.f1_score * 10 || 7,          // Escala 0-10
        nlpResult.basic_analysis.confidence * 100,                // Porcentagem
        palavras,
        resumo.length,
        paragrafos
      ]);

      console.log(`✅ Resultados NLP salvos com sucesso para documento ${documentId}`);
    } catch (error) {
      console.error(`❌ Erro ao salvar resultados NLP para documento ${documentId}:`, error);
      await this.markProcessingError(documentId, `Erro ao salvar resultados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  /**
   * Marca erro de processamento no banco
   */
  private async markProcessingError(documentId: string, errorMsg: string): Promise<void> {
    try {
      // Usar apenas codigo_documento para evitar erros de conversão UUID
      const updateQuery = "UPDATE sigata.documento_base SET status_processamento = $1, descricao = $2, data_fim_processamento = NOW() WHERE codigo_documento = $3";
      await database.query(updateQuery, ['ERRO', `Erro: ${errorMsg.substring(0, 200)}`, documentId]);
      console.log(`Status de erro atualizado para documento ${documentId}: ${errorMsg}`);
    } catch (error) {
      console.error(`Erro ao marcar erro para documento ${documentId}:`, error);
    }
  }

  /**
   * Processa documento com NLP real usando Python
   */
  private async processDocumentNLP(documentId: string, text: string, filename: string): Promise<NLPAnalysisResult> {
    return new Promise((resolve) => {
      try {
        const pythonExecutable = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
        const pythonScript = path.resolve(process.cwd(), 'src', 'services', 'nlp', 'advanced_nlp_engine.py');
        if (!fs.existsSync(pythonExecutable)) {
          console.error('[SIGATA][NLP] Python virtual environment não encontrado:', pythonExecutable);
          resolve({ success: false, error: 'Python virtual environment não encontrado' });
          return;
        }
        if (!fs.existsSync(pythonScript)) {
          console.error('[SIGATA][NLP] Script de NLP não encontrado:', pythonScript);
          resolve({ success: false, error: 'Script de NLP não encontrado' });
          return;
        }
        const tempFile = path.join(process.cwd(), `temp_${documentId}.txt`);
        fs.writeFileSync(tempFile, text, { encoding: 'utf-8' });
        const pythonProcess = spawn(pythonExecutable, [pythonScript, tempFile, filename]);
        let outputData = '';
        let errorData = '';
        pythonProcess.stdout.on('data', (data: Buffer) => {
          outputData += data.toString();
        });
        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorData += data.toString();
        });
        pythonProcess.on('close', (code: number) => {
          try { fs.unlinkSync(tempFile); } catch {}
          console.log('[SIGATA][NLP] Python process closed:', { code, outputData, errorData });
          if (code === 0 && outputData) {
            try {
              const result = JSON.parse(outputData);
              if (result.success) {
                resolve({ success: true, data: result.data });
              } else {
                console.error('[SIGATA][NLP] Script Python retornou erro:', result.error);
                resolve({ success: false, error: result.error });
              }
            } catch (err) {
              console.error('[SIGATA][NLP] Erro ao processar resposta do sistema NLP:', err, outputData);
              resolve({ success: false, error: 'Erro ao processar resposta do sistema NLP' });
            }
          } else {
            console.error('[SIGATA][NLP] Erro no processo Python:', { code, errorData, outputData });
            resolve({ success: false, error: 'Erro no processo Python' });
          }
        });
        setTimeout(() => {
          pythonProcess.kill();
          try { fs.unlinkSync(tempFile); } catch {}
          console.error('[SIGATA][NLP] Timeout no processamento NLP');
          resolve({ success: false, error: 'Timeout no processamento NLP' });
        }, 120000);
      } catch (error) {
        console.error('[SIGATA][NLP] Erro interno:', error);
        resolve({ success: false, error: 'Erro interno: ' + (error instanceof Error ? error.message : 'Erro desconhecido') });
      }
    });
  }


  /**
   * Obtém resultados da análise
   */
  /**
   * Retorna todos os documentos da view completa de processamento
   * Para consumo direto pelo frontend (cards, tabela, etc)
   */
  public async getAllDocumentsFull(req: Request, res: Response): Promise<void> {
    try {
      const query = [
        'SELECT',
        '  df.codigo_documento,',
        '  df.nome_arquivo,',
        '  df.tipo_documento,',
        '  df.descricao,',
        "  to_char(df.data_upload, 'DD/MM/YYYY HH24:MI:SS') AS data_upload,",
        '  df.status_documento,',
        '  df.usuario_upload_id,',
        '  u.username AS usuario_upload_username,',
        "  to_char(df.data_inicio_processamento, 'DD/MM/YYYY HH24:MI:SS') AS data_inicio_processamento,",
        "  to_char(df.data_fim_processamento, 'DD/MM/YYYY HH24:MI:SS') AS data_fim_processamento,",
        "  to_char(df.ultima_atualizacao, 'DD/MM/YYYY HH24:MI:SS') AS data_atualizacao",
        'FROM sigata.v_documentos_processamento_full df',
        'LEFT JOIN usuarios.usuario_sistema u ON u.id = df.usuario_upload_id',
        'ORDER BY df.data_upload DESC'
      ].join(' ');
      const result = await database.query(query);
      res.json({
        success: true,
        documents: Array.isArray(result.rows) ? result.rows : []
      });
    } catch (error) {
      console.error('Erro ao consultar documentos da view completa:', error);
      res.json({
        success: false,
        documents: [],
        error: 'Erro ao consultar documentos da view completa',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Verifica status do processamento
   */
  public async getProcessingStatus(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      
      // Usar apenas codigo_documento para evitar erros de conversão UUID
      const query = "SELECT nome_arquivo, status_processamento, resultado_nlp, metricas_nlp, palavras_chave_nlp, participantes_nlp, data_upload FROM sigata.documento_base WHERE codigo_documento = $1";
      const result = await database.query(query, [documentId]);
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Documento não encontrado' });
        return;
      }
      const document = result.rows[0];
      res.json({
        success: true,
        data: {
          documentId: documentId,
          filename: document.nome_arquivo,
          processingStatus: document.status_processamento,
          hasResults: !!document.resultado_nlp,
          uploadDate: document.data_upload
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao verificar status do processamento' });
  }
  }
}

export const processingController = new ProcessingController();
