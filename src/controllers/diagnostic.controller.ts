import { Request, Response } from 'express';
import { database } from '../config/database';

export class DiagnosticController {
  /**
   * Verifica a estrutura da tabela documento_base
   */
  public async checkDocumentTableStructure(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'sigata' AND 
          table_name = 'documento_base'
        ORDER BY 
          ordinal_position
      `;
      
      const result = await database.query(query);
      
      res.json({
        success: true,
        structure: result.rows,
        message: 'Estrutura da tabela documento_base obtida com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao verificar estrutura da tabela:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar estrutura da tabela',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Testa a consulta de documento por ID
   */
  public async testDocumentQuery(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      
      // Consulta usando código_documento
      const queryByCodigo = `
        SELECT 
          id, 
          codigo_documento, 
          nome_arquivo, 
          status_processamento
        FROM 
          sigata.documento_base
        WHERE 
          codigo_documento = $1
      `;
      
      const resultByCodigo = await database.query(queryByCodigo, [documentId]);
      
      // Informações sobre o tipo de ID
      const idInfo = {
        providedId: documentId,
        idType: typeof documentId,
        idLength: documentId ? documentId.length : 0,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId)
      };
      
      res.json({
        success: true,
        idInfo,
        resultByCodigo: resultByCodigo.rows,
        message: 'Teste de consulta realizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao testar consulta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao testar consulta',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Verifica o status da conexão com o banco de dados
   */
  public async checkDatabaseConnection(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await database.healthCheck();
      
      res.json({
        success: true,
        connection: healthCheck,
        message: 'Conexão com o banco de dados verificada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao verificar conexão com o banco de dados:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar conexão com o banco de dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

export const diagnosticController = new DiagnosticController();