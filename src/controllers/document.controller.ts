import { Request, Response } from 'express';
import { database } from '../config/database';

export class DocumentController {

  constructor() {
  }
  
  /**
   * Obter detalhes completos de um documento
   */
  public async getDocumentDetails(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      // Tentar converter para número se for string numérica
      const numericId = !isNaN(Number(documentId)) ? Number(documentId) : documentId;
      
      const query = `
        SELECT * FROM sigata.v_documentos_processamento_full
        WHERE codigo_documento = $1 OR id = $1
      `;
      
      const result = await database.query(query, [numericId]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Documento não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        document: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Erro ao obter detalhes do documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter detalhes do documento'
      });
    }
  }
  
  /**
   * Download do arquivo binário
   */
  public async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      
      // Tentar converter para número se for string numérica
      const numericId = !isNaN(Number(documentId)) ? Number(documentId) : documentId;
      
      const query = `
        SELECT 
          nome_arquivo,
          tipo_arquivo,
          arquivo_binario
        FROM sigata.documento_base
        WHERE id = $1 OR codigo_documento = $1
      `;
      
      const result = await database.query(query, [numericId]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Documento não encontrado'
        });
        return;
      }

      const document = result.rows[0];
      
      if (!document.arquivo_binario) {
        res.status(404).json({
          success: false,
          error: 'Arquivo binário não encontrado para este documento'
        });
        return;
      }
      
      // Determinar o tipo MIME com base no tipo de arquivo
      let contentType = 'application/octet-stream';
      if (document.tipo_arquivo) {
        const tipo = document.tipo_arquivo.toLowerCase();
        if (tipo === 'pdf') contentType = 'application/pdf';
        else if (tipo === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (tipo === 'txt') contentType = 'text/plain';
      }
      
      // Configurar headers para download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.nome_arquivo}"`);
      
      // Enviar o arquivo binário
      res.send(document.arquivo_binario);

    } catch (error) {
      console.error('❌ Erro ao fazer download do documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer download do documento'
      });
    }
  }
  
  /**
   * Excluir documento com verificação de permissão
   */
  public async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      // Tentar converter para número se for string numérica
      const numericId = !isNaN(Number(documentId)) ? Number(documentId) : documentId;
      const { password } = req.body;
      
      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Senha não fornecida'
        });
        return;
      }
      
      // Verificar credenciais do usuário
      const userId = req.user?.id; // Assumindo que o middleware de autenticação adiciona o usuário ao objeto req
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }
      
      // Verificar senha e tipo de usuário
      const userQuery = `
        SELECT 
          id, 
          username, 
          password_hash, 
          tipo_usuario
        FROM usuarios.usuario_sistema
        WHERE id = $1
      `;
      
      const userResult = await database.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Usuário não encontrado'
        });
        return;
      }
      
      const user = userResult.rows[0];
      
      // Verificar tipo de usuário (ADMIN, GESTOR ou ANALISTA)
      const allowedTypes = ['ADMIN', 'GESTOR', 'ANALISTA'];
      if (!allowedTypes.includes(user.tipo_usuario)) {
        res.status(403).json({
          success: false,
          error: 'Permissão negada. Apenas usuários ADMIN, GESTOR ou ANALISTA podem excluir documentos'
        });
        return;
      }
      
      // Verificar senha (em produção, usar bcrypt.compare)
      // Aqui estamos simulando a verificação de senha
      const isPasswordValid = password === 'senha123'; // Em produção, usar bcrypt.compare(password, user.password_hash)
      
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Senha incorreta'
        });
        return;
      }
      
      // Excluir documento
      const deleteQuery = `
        DELETE FROM sigata.documento_base
        WHERE id = $1 OR codigo_documento = $1
        RETURNING id, nome_arquivo
      `;
      
      const deleteResult = await database.query(deleteQuery, [numericId]);
      
      if (deleteResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Documento não encontrado ou já foi excluído'
        });
        return;
      }
      
      // Registrar a exclusão no log
      const logQuery = `
        INSERT INTO sigata.log_operacoes (
          usuario_id, 
          tipo_operacao, 
          entidade_afetada, 
          entidade_id, 
          detalhes_operacao
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      
      await database.query(logQuery, [
        userId,
        'EXCLUSAO',
        'documento_base',
        deleteResult.rows[0].id,
        `Exclusão do documento: ${deleteResult.rows[0].nome_arquivo}`
      ]);
      
      res.json({
        success: true,
        message: 'Documento excluído com sucesso',
        documentId: documentId
      });

    } catch (error) {
      console.error('❌ Erro ao excluir documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao excluir documento'
      });
    }
  }

  /**
   * MÉTODO LEGACY - Redirecionamento para novos controllers
   */
  public async upload(req: Request, res: Response): Promise<void> {
    res.status(400).json({
      success: false,
      error: 'Método depreciado. Use /api/documents/upload para upload e /api/documents/:id/process para processamento'
    });
  }

  /**
   * Listar documentos com informações básicas
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          db.id,
          db.nome_arquivo,
          db.tipo_arquivo,
          db.tamanho_arquivo,
          db.data_upload,
          db.status_processamento,
          LENGTH(db.texto_extraido) as texto_length,
          ad.status_analise
        FROM sigata.documento_base db
        LEFT JOIN sigata.analise_documento ad ON db.id = ad.documento_base_id
        ORDER BY db.data_upload DESC
      `;
      
      const result = await database.query(query);
      
      const documents = result.rows.map(row => ({
        id: row.id,
        filename: row.nome_arquivo,
        type: row.tipo_arquivo,
        size: row.tamanho_arquivo,
        uploadDate: row.data_upload,
        processingStatus: row.status_processamento,
        textLength: row.texto_length,
        hasAnalysis: !!row.status_analise
      }));

      res.json({
        success: true,
        documents
      });

    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar lista de documentos'
      });
    }
  }

  /**
   * Visualização completa com análises
   */
  public async completeView(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          db.*,
          ad.resultado_analise,
          ad.metricas_qualidade,
          ad.palavras_chave,
          ad.entidades_identificadas
        FROM sigata.documento_base db
        LEFT JOIN sigata.analise_documento ad ON db.id = ad.documento_base_id
        ORDER BY db.data_upload DESC
      `;
      
      const result = await database.query(query);
      
      res.json({
        success: true,
        documents: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('❌ Erro na visualização completa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar visualização completa'
      });
    }
  }

  /**
   * Obter análise específica de um documento
   */
  public async getAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      // Tentar converter para número se for string numérica
      const numericId = !isNaN(Number(documentId)) ? Number(documentId) : documentId;
      
      const query = `
        SELECT 
          db.nome_arquivo,
          db.texto_extraido,
          ad.resultado_analise,
          ad.metricas_qualidade,
          ad.palavras_chave,
          ad.entidades_identificadas
        FROM sigata.documento_base db
        LEFT JOIN sigata.analise_documento ad ON db.id = ad.documento_base_id
        WHERE db.id = $1 OR db.codigo_documento = $1
      `;
      
      const result = await database.query(query, [numericId]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Documento não encontrado'
        });
        return;
      }

      const document = result.rows[0];
      
      res.json({
        success: true,
        document: {
          filename: document.nome_arquivo,
          text: document.texto_extraido,
          analysis: document.resultado_analise ? JSON.parse(document.resultado_analise) : null,
          metrics: document.metricas_qualidade ? JSON.parse(document.metricas_qualidade) : null,
          keywords: document.palavras_chave ? JSON.parse(document.palavras_chave) : [],
          entities: document.entidades_identificadas ? JSON.parse(document.entidades_identificadas) : []
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter análise:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter análise do documento'
      });
    }
  }
}
