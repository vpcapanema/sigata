import { database } from '../config/database';

export interface DocumentoBase {
  id: string;
  codigo_documento: string;
  tipo_documento: 'ATA_REUNIAO' | 'DOCUMENTO_OFICIAL' | 'RELATORIO' | 'OUTROS';
  subtipo_documento?: string;
  categoria?: string;
  titulo_documento: string;
  descricao?: string;
  palavras_chave?: string[];
  conteudo_original?: string;
  conteudo_processado?: string;
  arquivo_id?: string;
  status_processamento: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO' | 'REJEITADO';
  data_upload: Date;
  data_inicio_processamento?: Date;
  data_fim_processamento?: Date;
  tempo_processamento_ms?: number;
  carregado_por_id: string;
  endereco_ip_upload?: string;
  agente_usuario?: string;
  configuracoes_nlp?: any;
  data_criacao: Date;
  data_atualizacao: Date;
}

export interface DocumentoArquivo {
  documento_id: string;
  nome_arquivo_original: string;
  caminho_arquivo: string;
  arquivo_binario?: Buffer;
  arquivo_texto_extraido?: string;
  arquivo_metadados?: any;
  tamanho_arquivo_bytes?: number;
  tipo_mime?: string;
  hash_arquivo?: string;
}

export interface DocumentoAtaDados {
  documento_id: string;
  data_reuniao?: Date;
  hora_inicio_reuniao?: string;
  hora_fim_reuniao?: string;
  local_reuniao?: string;
  duracao_reuniao_minutos?: number;
}

class DocumentoService {
  /**
   * Lista documentos com filtros e paginação
   */
  async listarDocumentos(
    page: number = 1,
    limit: number = 10,
    filtros: {
      status?: string;
      tipo_documento?: string;
      carregado_por_id?: string;
      data_inicio?: string;
      data_fim?: string;
      search?: string;
    } = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = ['db.data_exclusao IS NULL'];
      let queryParams: any[] = [];
      let paramCount = 0;

      // Filtros
      if (filtros.status) {
        paramCount++;
        whereConditions.push(`db.status_processamento = $${paramCount}`);
        queryParams.push(filtros.status);
      }

      if (filtros.tipo_documento) {
        paramCount++;
        whereConditions.push(`db.tipo_documento = $${paramCount}`);
        queryParams.push(filtros.tipo_documento);
      }

      if (filtros.carregado_por_id) {
        paramCount++;
        whereConditions.push(`db.carregado_por_id = $${paramCount}`);
        queryParams.push(filtros.carregado_por_id);
      }

      if (filtros.data_inicio) {
        paramCount++;
        whereConditions.push(`db.data_upload >= $${paramCount}`);
        queryParams.push(filtros.data_inicio);
      }

      if (filtros.data_fim) {
        paramCount++;
        whereConditions.push(`db.data_upload <= $${paramCount}`);
        queryParams.push(filtros.data_fim);
      }

      if (filtros.search) {
        paramCount++;
        whereConditions.push(`(
          db.titulo_documento ILIKE $${paramCount} OR 
          db.descricao ILIKE $${paramCount} OR
          db.codigo_documento ILIKE $${paramCount}
        )`);
        queryParams.push(`%${filtros.search}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query principal
      const query = `
        SELECT 
          db.*,
          da.nome_arquivo_original,
          da.tamanho_arquivo_bytes,
          da.tipo_mime,
          u.username as carregado_por,
          pf.nome_completo as nome_usuario,
          ata.data_reuniao,
          ata.local_reuniao,
          ata.duracao_reuniao_minutos,
          nlp.nlp_processado,
          nlp.nlp_idioma_detectado,
          nlp.nlp_sentimento_geral,
          COUNT(*) OVER() as total_registros
        FROM sigata.documento_base db
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        LEFT JOIN usuarios.usuario_sistema u ON db.carregado_por_id = u.id
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        LEFT JOIN sigata.documento_ata_dados ata ON db.id = ata.documento_id
        LEFT JOIN sigata.documento_nlp_metricas nlp ON db.id = nlp.documento_id
        WHERE ${whereClause}
        ORDER BY db.data_upload DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      const result = await database.query(query, queryParams);
      
      const totalRegistros = result.rows.length > 0 ? parseInt(result.rows[0].total_registros) : 0;
      const totalPaginas = Math.ceil(totalRegistros / limit);

      return {
        documentos: result.rows,
        paginacao: {
          pagina_atual: page,
          total_paginas: totalPaginas,
          total_registros: totalRegistros,
          registros_por_pagina: limit
        }
      };
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw new Error('Erro ao buscar documentos');
    }
  }

  /**
   * Busca documento por ID com todos os dados relacionados
   */
  async buscarPorId(id: string) {
    try {
      const query = `
        SELECT 
          db.*,
          da.nome_arquivo_original,
          da.caminho_arquivo,
          da.arquivo_texto_extraido,
          da.arquivo_metadados,
          da.tamanho_arquivo_bytes,
          da.tipo_mime,
          da.hash_arquivo,
          ata.data_reuniao,
          ata.hora_inicio_reuniao,
          ata.hora_fim_reuniao,
          ata.local_reuniao,
          ata.duracao_reuniao_minutos,
          nlp_dados.nlp_entidades_extraidas,
          nlp_dados.participantes_extraidos,
          nlp_dados.nlp_resumo_automatico,
          nlp_dados.decisoes_extraidas,
          nlp_dados.acoes_extraidas,
          nlp_metricas.nlp_processado,
          nlp_metricas.nlp_idioma_detectado,
          nlp_metricas.nlp_confianca_idioma,
          nlp_metricas.tempo_processamento_ms,
          nlp_metricas.nlp_sentimento_geral,
          nlp_metricas.nlp_pontuacao_sentimento,
          nlp_metricas.bert_precisao,
          nlp_metricas.bert_revocacao,
          nlp_metricas.bert_pontuacao_f1,
          qual.taxa_conversao,
          qual.qualidade_texto,
          qual.legibilidade_score,
          qual.quantidade_paginas,
          qual.quantidade_palavras,
          qual.quantidade_caracteres,
          ctrl.status_validacao,
          ctrl.validado_por_id,
          ctrl.data_validacao,
          ctrl.visibilidade,
          ctrl.confidencialidade,
          u.username as carregado_por,
          pf.nome_completo as nome_usuario
        FROM sigata.documento_base db
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        LEFT JOIN sigata.documento_ata_dados ata ON db.id = ata.documento_id
        LEFT JOIN sigata.documento_nlp_dados nlp_dados ON db.id = nlp_dados.documento_id
        LEFT JOIN sigata.documento_nlp_metricas nlp_metricas ON db.id = nlp_metricas.documento_id
        LEFT JOIN sigata.documento_qualidade qual ON db.id = qual.documento_id
        LEFT JOIN sigata.documento_controle ctrl ON db.id = ctrl.documento_id
        LEFT JOIN usuarios.usuario_sistema u ON db.carregado_por_id = u.id
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE db.id = $1 AND db.data_exclusao IS NULL
      `;

      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar documento por ID:', error);
      throw new Error('Erro ao buscar documento');
    }
  }

  /**
   * Cria um novo documento base
   */
  async criarDocumento(dados: {
    codigo_documento: string;
    tipo_documento: string;
    titulo_documento: string;
    descricao?: string;
    carregado_por_id: string;
    endereco_ip_upload?: string;
    agente_usuario?: string;
  }) {
    try {
      const query = `
        INSERT INTO sigata.documento_base (
          codigo_documento,
          tipo_documento,
          titulo_documento,
          descricao,
          status_processamento,
          data_upload,
          carregado_por_id,
          endereco_ip_upload,
          agente_usuario,
          data_criacao,
          data_atualizacao
        ) VALUES (
          $1, $2, $3, $4, 'PENDENTE', CURRENT_TIMESTAMP, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const result = await database.query(query, [
        dados.codigo_documento,
        dados.tipo_documento,
        dados.titulo_documento,
        dados.descricao,
        dados.carregado_por_id,
        dados.endereco_ip_upload,
        dados.agente_usuario
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw new Error('Erro ao criar documento');
    }
  }

  /**
   * Atualiza status do documento
   */
  async atualizarStatus(documentoId: string, novoStatus: string) {
    try {
      const query = `
        UPDATE sigata.documento_base 
        SET status_processamento = $1,
            data_atualizacao = CURRENT_TIMESTAMP,
            data_inicio_processamento = CASE 
              WHEN $1 = 'PROCESSANDO' THEN CURRENT_TIMESTAMP 
              ELSE data_inicio_processamento 
            END,
            data_fim_processamento = CASE 
              WHEN $1 IN ('CONCLUIDO', 'ERRO') THEN CURRENT_TIMESTAMP 
              ELSE data_fim_processamento 
            END
        WHERE id = $2
        RETURNING *
      `;

      const result = await database.query(query, [novoStatus, documentoId]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar status do documento:', error);
      throw new Error('Erro ao atualizar status');
    }
  }

  /**
   * Obtém estatísticas gerais dos documentos
   */
  async obterEstatisticas() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_documentos,
          COUNT(CASE WHEN status_processamento = 'CONCLUIDO' THEN 1 END) as documentos_processados,
          COUNT(CASE WHEN status_processamento = 'PENDENTE' THEN 1 END) as documentos_pendentes,
          COUNT(CASE WHEN status_processamento = 'PROCESSANDO' THEN 1 END) as documentos_processando,
          COUNT(CASE WHEN status_processamento = 'ERRO' THEN 1 END) as documentos_erro,
          COUNT(CASE WHEN data_upload >= CURRENT_DATE THEN 1 END) as documentos_hoje,
          COUNT(CASE WHEN data_upload >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as documentos_semana,
          COUNT(CASE WHEN data_upload >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as documentos_mes,
          ROUND(AVG(tempo_processamento_ms), 2) as tempo_medio_processamento_ms
        FROM sigata.documento_base
        WHERE data_exclusao IS NULL
      `;

      const result = await database.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro ao buscar estatísticas');
    }
  }

  /**
   * Busca documentos por texto (busca textual avançada)
   */
  async buscarPorTexto(texto: string, limit: number = 10) {
    try {
      const query = `
        SELECT 
          db.id,
          db.codigo_documento,
          db.titulo_documento,
          db.tipo_documento,
          db.status_processamento,
          db.data_upload,
          da.nome_arquivo_original,
          nlp.nlp_resumo_automatico,
          ts_rank(nlp.vetor_busca, plainto_tsquery('portuguese', $1)) as relevancia
        FROM sigata.documento_base db
        JOIN sigata.documento_nlp_dados nlp ON db.id = nlp.documento_id
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        WHERE nlp.vetor_busca @@ plainto_tsquery('portuguese', $1)
        AND db.data_exclusao IS NULL
        ORDER BY relevancia DESC
        LIMIT $2
      `;

      const result = await database.query(query, [texto, limit]);
      return result.rows;
    } catch (error) {
      console.error('Erro na busca textual:', error);
      throw new Error('Erro na busca por texto');
    }
  }
}

export const documentoService = new DocumentoService();
