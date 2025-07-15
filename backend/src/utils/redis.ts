import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisConnection {
  private static instance: RedisConnection;
  public client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Máximo de tentativas de reconexão atingido');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.setupEventListeners();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  private setupEventListeners() {
    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis: Conectando...');
    });

    this.client.on('ready', () => {
      logger.info('Redis: Conexão estabelecida');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      logger.info('Redis: Conexão encerrada');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis: Tentando reconectar...');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Erro ao conectar Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (error) {
      logger.error('Erro ao desconectar Redis:', error);
      throw error;
    }
  }

  public get isOpen(): boolean {
    return this.isConnected && this.client.isOpen;
  }
}

// Singleton instance
const redisConnection = RedisConnection.getInstance();
export const redisClient = redisConnection.client;

// Utility functions para cache
export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType;

  constructor() {
    this.client = redisClient;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get valor do cache
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!redisConnection.isOpen) {
        logger.warn('Redis não conectado, pulando get do cache');
        return null;
      }

      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Erro ao buscar cache [${key}]:`, error);
      return null;
    }
  }

  // Set valor no cache
  public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!redisConnection.isOpen) {
        logger.warn('Redis não conectado, pulando set do cache');
        return false;
      }

      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      logger.error(`Erro ao definir cache [${key}]:`, error);
      return false;
    }
  }

  // Delete valor do cache
  public async delete(key: string): Promise<boolean> {
    try {
      if (!redisConnection.isOpen) {
        logger.warn('Redis não conectado, pulando delete do cache');
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Erro ao deletar cache [${key}]:`, error);
      return false;
    }
  }

  // Delete múltiplas chaves por padrão
  public async deletePattern(pattern: string): Promise<number> {
    try {
      if (!redisConnection.isOpen) {
        logger.warn('Redis não conectado, pulando delete pattern do cache');
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.client.del(keys);
      return result;
    } catch (error) {
      logger.error(`Erro ao deletar cache pattern [${pattern}]:`, error);
      return 0;
    }
  }

  // Verificar se existe
  public async exists(key: string): Promise<boolean> {
    try {
      if (!redisConnection.isOpen) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Erro ao verificar existência do cache [${key}]:`, error);
      return false;
    }
  }

  // Incrementar contador
  public async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      if (!redisConnection.isOpen) {
        logger.warn('Redis não conectado, retornando 1 para increment');
        return 1;
      }

      const result = await this.client.incr(key);
      
      if (ttlSeconds && result === 1) {
        await this.client.expire(key, ttlSeconds);
      }

      return result;
    } catch (error) {
      logger.error(`Erro ao incrementar cache [${key}]:`, error);
      return 1;
    }
  }

  // Cache com função de fallback
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    try {
      // Tentar buscar do cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Se não encontrou, executar função e cachear resultado
      const result = await fetchFunction();
      await this.set(key, result, ttlSeconds);
      
      return result;
    } catch (error) {
      logger.error(`Erro em getOrSet cache [${key}]:`, error);
      // Em caso de erro, executar função diretamente
      return await fetchFunction();
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Utility para inicializar Redis
export const initializeRedis = async (): Promise<void> => {
  try {
    await redisConnection.connect();
    logger.info('Redis inicializado com sucesso');
  } catch (error) {
    logger.error('Falha ao inicializar Redis:', error);
    // Não falhar a aplicação se Redis não estiver disponível
  }
};

// Helper para gerar chaves de cache
export const generateCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

// Cache keys constants
export const CACHE_KEYS = {
  USER: (id: string) => generateCacheKey('user', id),
  USER_BY_EMAIL: (email: string) => generateCacheKey('user', 'email', email),
  DOCUMENT: (id: string) => generateCacheKey('document', id),
  DOCUMENT_LIST: (userId: string, page: number, limit: number) => 
    generateCacheKey('documents', userId, page, limit),
  ANALYSIS: (id: string) => generateCacheKey('analysis', id),
  ANALYSIS_BY_DOCUMENT: (documentId: string) => 
    generateCacheKey('analysis', 'document', documentId),
  REPORT: (id: string) => generateCacheKey('report', id),
  SYSTEM_CONFIG: (key: string) => generateCacheKey('config', key),
  METRICS: (type: string, period: string) => 
    generateCacheKey('metrics', type, period),
  RATE_LIMIT: (ip: string) => generateCacheKey('rate_limit', ip),
};

// TTL constants (em segundos)
export const CACHE_TTL = {
  USER: 3600, // 1 hora
  DOCUMENT: 1800, // 30 minutos
  ANALYSIS: 3600, // 1 hora
  REPORT: 1800, // 30 minutos
  CONFIG: 86400, // 24 horas
  METRICS: 300, // 5 minutos
  RATE_LIMIT: 900, // 15 minutos
};
