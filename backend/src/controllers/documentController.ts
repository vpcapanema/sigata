import { DocumentStatus, Document, Analysis, User } from '../types';
import logger from '../utils/logger';
import nlpService from '../services/nlpService';

// Interface para Request estendido com user
interface AuthenticatedRequest {
  user?: {
    id: string;
    role: string;
  };
  params: { [key: string]: string };
  query: { [key: string]: any };
  body: any;
}

interface ApiResponse {
  json: (data: any) => void;
  status: (code: number) => ApiResponse;
}

export class DocumentController {
  /**
   * Lista documentos com filtros avançados e paginação
   */
  async listDocuments(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        uploadedBy,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      logger.info(`Listando documentos - página ${pageNumber}, limite ${limitNumber}`);

      // Aqui você implementaria a busca real no banco de dados
      // Por enquanto, retorna dados mock para demonstração
      const mockDocuments = [
        {
          id: '1',
          filename: 'ata_reuniao_01.pdf',
          originalName: 'Ata da Reunião - Janeiro 2025.pdf',
          mimetype: 'application/pdf',
          size: 1024000,
          path: '/uploads/ata_reuniao_01.pdf',
          uploadedBy: req.user?.id || 'user1',
          status: DocumentStatus.COMPLETED,
          extractedText: 'Texto extraído da reunião...',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user1',
            name: 'João Silva',
            email: 'joao@empresa.com'
          },
          analyses: [
            {
              id: 'analysis1',
              status: 'COMPLETED',
              type: 'FULL',
              createdAt: new Date()
            }
          ]
        }
      ];

      const total = mockDocuments.length;
      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        documents: mockDocuments,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1
        }
      });
    } catch (error) {
      logger.error('Erro ao listar documentos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar documentos'
      });
    }
  }

  /**
   * Obtém um documento específico com detalhes completos
   */
  async getDocument(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;

      logger.info(`Buscando documento ${id}`);

      // Mock de documento para demonstração
      const mockDocument = {
        id,
        filename: 'ata_reuniao_01.pdf',
        originalName: 'Ata da Reunião - Janeiro 2025.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        path: '/uploads/ata_reuniao_01.pdf',
        uploadedBy: req.user?.id || 'user1',
        status: DocumentStatus.COMPLETED,
        extractedText: 'Texto extraído da reunião...',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user1',
          name: 'João Silva',
          email: 'joao@empresa.com'
        },
        analyses: [
          {
            id: 'analysis1',
            status: 'COMPLETED',
            type: 'FULL',
            createdAt: new Date(),
            user: {
              id: 'user1',
              name: 'João Silva',
              email: 'joao@empresa.com'
            },
            entities: [],
            topics: [],
            sentiments: []
          }
        ]
      };

      if (!mockDocument) {
        return res.status(404).json({ 
          error: 'Documento não encontrado' 
        });
      }

      res.json(mockDocument);
    } catch (error) {
      logger.error('Erro ao buscar documento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar documento'
      });
    }
  }

  /**
   * Valida permissões de acesso a um documento
   */
  private validateDocumentAccess(document: any, userId: string, userRole: string): boolean {
    // Admin tem acesso a tudo
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // Usuário proprietário
    if (document.uploadedBy === userId) {
      return true;
    }
    
    return false;
  }

  /**
   * Exclui um documento e todas as análises relacionadas
   */
  async deleteDocument(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      logger.info(`Tentativa de exclusão do documento ${id} pelo usuário ${userId}`);

      // Mock de verificação de documento
      const mockDocument = {
        id,
        uploadedBy: userId, // Para simular permissão
        analyses: [{ id: 'analysis1' }]
      };

      if (!mockDocument) {
        return res.status(404).json({ 
          error: 'Documento não encontrado' 
        });
      }

      // Verificar permissões
      if (!this.validateDocumentAccess(mockDocument, userId!, userRole)) {
        return res.status(403).json({ 
          error: 'Sem permissão para excluir este documento' 
        });
      }

      // Simular exclusão do arquivo físico
      try {
        logger.info(`Simulando exclusão do arquivo físico para documento ${id}`);
      } catch (fileError) {
        logger.warn(`Arquivo físico não encontrado para documento ${id}`, fileError);
      }

      logger.info(`Documento ${id} excluído pelo usuário ${userId}`);

      res.json({ 
        message: 'Documento excluído com sucesso',
        deletedAnalyses: mockDocument.analyses.length
      });
    } catch (error) {
      logger.error('Erro ao excluir documento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir documento'
      });
    }
  }

  /**
   * Exclusão em lote de documentos
   */
  async bulkDeleteDocuments(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { documentIds } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ 
          error: 'IDs de documentos inválidos' 
        });
      }

      logger.info(`Exclusão em lote de ${documentIds.length} documentos pelo usuário ${userId}`);

      // Mock de documentos
      const mockDocuments = documentIds.map((id: string) => ({
        id,
        uploadedBy: userId, // Para simular permissão
        analyses: [{ id: `analysis_${id}` }],
        filename: `documento_${id}.pdf`
      }));

      // Verificar permissões
      const unauthorizedDocs = mockDocuments.filter((doc: any) => 
        !this.validateDocumentAccess(doc, userId!, userRole)
      );

      if (unauthorizedDocs.length > 0) {
        return res.status(403).json({ 
          error: 'Sem permissão para alguns documentos',
          unauthorizedIds: unauthorizedDocs.map((doc: any) => doc.id)
        });
      }

      // Simular exclusão de arquivos físicos
      const fileErrors: string[] = [];
      for (const doc of mockDocuments) {
        try {
          logger.info(`Simulando exclusão do arquivo físico: ${doc.filename}`);
        } catch (fileError) {
          fileErrors.push(doc.filename);
          logger.warn(`Erro ao excluir arquivo físico: ${doc.filename}`, fileError);
        }
      }

      const totalAnalysesDeleted = mockDocuments.reduce((sum: number, doc: any) => sum + doc.analyses.length, 0);

      logger.info(`${mockDocuments.length} documentos excluídos em lote pelo usuário ${userId}`);

      res.json({ 
        message: `${mockDocuments.length} documentos excluídos com sucesso`,
        deletedDocuments: mockDocuments.length,
        deletedAnalyses: totalAnalysesDeleted,
        fileErrors: fileErrors.length > 0 ? fileErrors : undefined
      });
    } catch (error) {
      logger.error('Erro na exclusão em lote:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha na exclusão em lote'
      });
    }
  }

  /**
   * Reprocessa um documento (nova extração de texto)
   */
  async reprocessDocument(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || 'USER';

      logger.info(`Reprocessamento do documento ${id} solicitado pelo usuário ${userId}`);

      // Mock de documento
      const mockDocument: Document = {
        id,
        filename: 'documento.pdf',
        originalName: 'Documento Original.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        path: '/uploads/documento.pdf',
        uploadedBy: userId!,
        status: DocumentStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!mockDocument) {
        return res.status(404).json({ 
          error: 'Documento não encontrado' 
        });
      }

      // Verificar permissões
      if (!this.validateDocumentAccess(mockDocument, userId!, userRole)) {
        return res.status(403).json({ 
          error: 'Sem permissão para reprocessar este documento' 
        });
      }

      try {
        // Simular reextração de texto
        logger.info(`Iniciando reextração de texto para documento ${id}`);
        const extractedText = await nlpService.extractTextFromDocument(mockDocument);

        // Simular atualização do documento
        const updatedDocument = {
          ...mockDocument,
          extractedText,
          status: DocumentStatus.COMPLETED,
          updatedAt: new Date()
        };

        logger.info(`Documento ${id} reprocessado com sucesso pelo usuário ${userId}`);

        res.json({
          message: 'Documento reprocessado com sucesso',
          document: updatedDocument
        });
      } catch (processingError) {
        logger.error(`Erro ao reprocessar documento ${id}:`, processingError);
        
        res.status(500).json({
          error: 'Erro no reprocessamento',
          message: (processingError as Error).message
        });
      }
    } catch (error) {
      logger.error('Erro ao reprocessar documento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao reprocessar documento'
      });
    }
  }

  /**
   * Estatísticas de documentos do usuário
   */
  async getDocumentStats(req: AuthenticatedRequest, res: ApiResponse) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      logger.info(`Buscando estatísticas de documentos para usuário ${userId} (admin: ${isAdmin})`);

      // Mock de estatísticas
      const mockStats = {
        total: 15,
        byStatus: {
          pending: 2,
          processing: 1,
          completed: 11,
          error: 1
        },
        totalSizeBytes: 15360000, // ~15MB
        recentDocuments: [
          {
            id: '1',
            filename: 'ata_reuniao_01.pdf',
            originalName: 'Ata da Reunião - Janeiro 2025.pdf',
            status: DocumentStatus.COMPLETED,
            createdAt: new Date(),
            size: 1024000
          },
          {
            id: '2',
            filename: 'ata_reuniao_02.pdf',
            originalName: 'Ata da Reunião - Fevereiro 2025.pdf',
            status: DocumentStatus.PROCESSING,
            createdAt: new Date(),
            size: 2048000
          }
        ]
      };

      res.json(mockStats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Valida o formato de um arquivo antes do upload
   */
  validateFileFormat(mimetype: string, size: number): { valid: boolean; error?: string } {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(mimetype)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado: ${mimetype}. Tipos aceitos: PDF, DOCX, TXT`
      };
    }

    if (size > maxSize) {
      return {
        valid: false,
        error: `Arquivo muito grande: ${Math.round(size / 1024 / 1024)}MB. Tamanho máximo: 10MB`
      };
    }

    return { valid: true };
  }

  /**
   * Processa um arquivo após upload
   */
  async processUploadedFile(document: Document): Promise<void> {
    try {
      logger.info(`Processando arquivo ${document.filename}`);
      
      // Simular processamento
      try {
        const extractedText = await nlpService.extractTextFromDocument(document);
        logger.info(`Texto extraído com sucesso para ${document.filename}`);
        
        // Aqui você atualizaria o status no banco
        // await updateDocumentStatus(document.id, DocumentStatus.COMPLETED, extractedText);
      } catch (error) {
        logger.error(`Erro ao processar ${document.filename}:`, error);
        // await updateDocumentStatus(document.id, DocumentStatus.ERROR, null, error.message);
      }
    } catch (error) {
      logger.error('Erro no processamento de arquivo:', error);
      throw error;
    }
  }
}

export default new DocumentController();
