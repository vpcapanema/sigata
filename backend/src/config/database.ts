import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseConnection {
  private pool: Pool;
  private connected = false;

  constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'sigata_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
      max: 20, // máximo de conexões no pool
      idleTimeoutMillis: 30000, // tempo limite de inatividade
      connectionTimeoutMillis: 2000, // tempo limite de conexão
    };

    this.pool = new Pool(config);

    // Event handlers para o pool
    this.pool.on('connect', () => {
      console.log('📦 Nova conexão estabelecida com PostgreSQL');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Erro inesperado no pool de conexões:', err);
    });
  }

  async connect(): Promise<void> {
    try {
      // Testa a conexão
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.connected = true;
      console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
      console.log(`📍 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
      console.log(`🗄️ Database: ${process.env.DB_NAME || 'sigata_db'}`);
    } catch (error) {
      this.connected = false;
      console.error('❌ Erro ao conectar com PostgreSQL:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.connected) {
      await this.connect();
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log('🔍 Query executada:', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      console.error('❌ Erro na query:', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        params,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.connected = false;
      console.log('🔌 Conexão com PostgreSQL encerrada');
    } catch (error) {
      console.error('❌ Erro ao encerrar conexão:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date; version?: string }> {
    try {
      const result = await this.query('SELECT version(), NOW() as timestamp');
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date()
      };
    }
  }
}

export const database = new DatabaseConnection();
