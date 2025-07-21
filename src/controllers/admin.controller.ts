import { Request, Response } from 'express';
import { database } from '../config/database';

export class AdminController {

  public async testDatabase(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      
      // Teste básico de query
      const result = await database.query('SELECT NOW() as current_time, version() as db_version');
      
      res.json({
        success: true,
        message: 'Conexão com banco de dados estabelecida com sucesso',
        data: {
          connected: true,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          current_time: result.rows[0].current_time,
          db_version: result.rows[0].db_version,
          ssl_enabled: process.env.DB_SSL === 'true'
        }
      });
    } catch (error) {
      console.error('Erro na conexão com banco:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao conectar com banco de dados',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          connected: false,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME
        }
      });
    }
  }

  public async sigataSchema(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      
      // Verificar se existe o esquema sigata
      const schemaExists = await database.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'sigata'
      `);
      
      if (schemaExists.rows.length === 0) {
        res.json({
          success: true,
          message: 'Esquema sigata não encontrado',
          data: {
            schema_exists: false,
            tables: []
          }
        });
        return;
      }
      
      // Listar tabelas do esquema sigata
      const tables = await database.query(`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'sigata' 
        ORDER BY table_name
      `);
      
      // Listar views do esquema sigata
      const views = await database.query(`
        SELECT table_name, view_definition
        FROM information_schema.views 
        WHERE table_schema = 'sigata' 
        ORDER BY table_name
      `);
      
      res.json({
        success: true,
        message: 'Estrutura do esquema sigata recuperada com sucesso',
        data: {
          schema_exists: true,
          tables: tables.rows,
          views: views.rows,
          total_tables: tables.rows.length,
          total_views: views.rows.length
        }
      });
    } catch (error) {
      console.error('Erro ao consultar esquema sigata:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar esquema sigata',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async tableStructure(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      const { schema, table } = req.params;
      
      // Verificar se a tabela existe
      const tableExists = await database.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = $2
      `, [schema, table]);
      
      if (tableExists.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: `Tabela ${schema}.${table} não encontrada`
        });
        return;
      }
      
      // Buscar estrutura das colunas
      const columns = await database.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, table]);
      
      // Buscar dados de exemplo (primeiras 3 linhas)
      const sampleData = await database.query(`
        SELECT * FROM ${schema}.${table} LIMIT 3
      `);
      
      res.json({
        success: true,
        message: `Estrutura da tabela ${schema}.${table} recuperada`,
        data: {
          schema,
          table,
          columns: columns.rows,
          sample_data: sampleData.rows,
          total_columns: columns.rows.length,
          sample_records: sampleData.rows.length
        }
      });
    } catch (error) {
      console.error('Erro ao consultar estrutura da tabela:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar estrutura da tabela',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async listUsers(req: Request, res: Response): Promise<void> {
    try {
      await database.connect();
      
      const usuarios = await database.query(`
        SELECT 
          id,
          username,
          email,
          tipo_usuario,
          ativo,
          data_criacao,
          data_ultimo_login
        FROM usuarios.usuario_sistema
        WHERE data_exclusao IS NULL
        ORDER BY username
      `);
      
      res.json({
        success: true,
        message: 'Usuários recuperados com sucesso',
        data: {
          usuarios: usuarios.rows,
          total_usuarios: usuarios.rows.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar usuários',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
