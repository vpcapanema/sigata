import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { database } from '../config/database';

export class UploadController {

  constructor() {
  }

  /**
   * Upload de arquivo com armazenamento no banco
   */
  public async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ 
          success: false,
          error: 'Nenhum arquivo enviado' 
        });
        return;
      }

      console.log('📁 Arquivo recebido:', req.file.originalname);

      // Extrair texto do arquivo
      let extractedText = '';
      
      const fileBuffer = req.file.buffer;
      if (req.file.mimetype === 'application/pdf') {
        try {
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text;
        } catch (pdfError) {
          console.error('❌ Erro ao processar PDF:', pdfError);
          res.status(400).json({ 
            success: false,
            error: 'Erro ao processar arquivo PDF' 
          });
          return;
        }
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = docxData.value;
        } catch (docxError) {
          console.error('❌ Erro ao processar DOCX:', docxError);
          res.status(400).json({
            success: false,
            error: 'Erro ao processar arquivo DOCX'
          });
          return;
        }
      } else if (req.file.mimetype === 'text/plain') {
        extractedText = fileBuffer.toString('utf8');
      } else {
        res.status(400).json({ 
          success: false,
          error: 'Tipo de arquivo não suportado' 
        });
        return;
      }

      if (!extractedText.trim()) {
        res.status(400).json({ 
          success: false,
          error: 'Não foi possível extrair texto do documento' 
        });
        return;
      }

      console.log('📝 Texto extraído:', extractedText.length, 'caracteres');

      if (extractedText.trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'Texto extraído muito pequeno'
        });
        return;
      }

      // Salvar arquivo na tabela documento_base (estrutura simplificada)
      try {
        const documentQuery = `
          INSERT INTO sigata.documento_base (
            codigo_documento, tipo_documento, titulo_documento, 
            descricao, usuario_upload_id, status_processamento,
            nome_arquivo, tipo_arquivo, tamanho_arquivo, 
            arquivo_binario, texto_extraido, hash_arquivo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `;
        
        const userId = req.body.userId || 'c05ead9a-ac08-4510-8f16-d7287368e3b6';
        const codigoDocumento = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileHash = `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const documentResult = await database.query(documentQuery, [
          codigoDocumento,
          'ATA',
          req.file.originalname,
          `Documento carregado: ${req.file.originalname} (${extractedText.length} caracteres)`,
          userId,
          'PENDENTE',
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          req.file.buffer,
          extractedText,
          fileHash
        ]);
        
        const documentId = documentResult.rows[0].id;
        console.log('💾 Documento salvo com ID:', documentId);
        
        // Retornar apenas informações do upload (SEM processamento)
        res.status(201).json({
          success: true,
          message: 'Arquivo enviado com sucesso',
          data: {
            documentId: documentId,
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            textLength: extractedText.length,
            status: 'PENDENTE',
            uploadDate: new Date().toISOString(),
            extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
          }
        });

      } catch (dbError) {
        console.error('❌ Erro ao salvar no banco:', dbError);
        res.status(500).json({
          success: false,
          error: 'Erro ao salvar documento no banco de dados'
        });
      }

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar documentos carregados
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          id,
          codigo_documento,
          titulo_documento as filename,
          tipo_arquivo as type,
          tamanho_arquivo as size,
          data_upload as uploadDate,
          status_processamento,
          LENGTH(texto_extraido) as textLength
        FROM sigata.documento_base
        ORDER BY data_upload DESC
      `;
      
      const result = await database.query(query);
      
      const documents = result.rows.map(row => ({
        id: row.id,
        codigo: row.codigo_documento,
        filename: row.filename,
        type: row.type,
        size: row.size,
        uploadDate: row.uploaddate,
        processingStatus: row.status_processamento,
        textLength: row.textlength
      }));

      res.json({
        success: true,
        documents,
        total: documents.length
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
   * Obter documento específico
   */
  public async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      
      const query = `
        SELECT 
          id,
          codigo_documento,
          titulo_documento,
          tipo_documento,
          nome_arquivo,
          tipo_arquivo,
          tamanho_arquivo,
          texto_extraido,
          status_processamento,
          data_upload
        FROM sigata.documento_base
        WHERE id = $1 OR codigo_documento = $1
      `;
      
      const result = await database.query(query, [documentId]);
      
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
          id: document.id,
          codigo: document.codigo_documento,
          titulo: document.titulo_documento,
          tipo: document.tipo_documento,
          filename: document.nome_arquivo,
          mimetype: document.tipo_arquivo,
          size: document.tamanho_arquivo,
          extractedText: document.texto_extraido,
          status: document.status_processamento,
          uploadDate: document.data_upload
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter documento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter documento'
      });
    }
  }
}

export const uploadController = new UploadController();
