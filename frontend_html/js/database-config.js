// ==========================================
// Configuração de Banco de Dados - SIGATA
// Sistema Integrado de Gestão de Atas
// ==========================================

const DATABASE_CONFIG = {
    // Configurações do PostgreSQL - AWS RDS
    CONNECTION: {
        host: 'pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com',
        port: 5432,
        database: 'pli_db',
        user: 'postgres',
        password: 'semil2025*',
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    
    // Schema e tabelas principais
    SCHEMA: 'sigata',
    
    TABLES: {
        DOCUMENTO_BASE: 'documento_base',
        DOCUMENTO_ARQUIVO: 'documento_arquivo', 
        DOCUMENTO_ATA_DADOS: 'documento_ata_dados',
        DOCUMENTO_QUALIDADE: 'documento_qualidade',
        DOCUMENTO_NLP_DADOS: 'documento_nlp_dados',
        DOCUMENTO_NLP_METRICAS: 'documento_nlp_metricas',
        RELATORIO_BASE: 'relatorio_base',
        RELATORIO_CONTROLE: 'relatorio_controle',
        RELATORIO_RESULTADOS: 'relatorio_resultados',
        SYSTEM_METRICS: 'system_metrics'
    },
    
    // Views disponíveis
    VIEWS: {
        DOCUMENTOS_PROCESSAMENTO_FULL: 'documentos_processamento_full'
    },
    
    // Queries frequentes
    QUERIES: {
        // View completa de documentos
        GET_ALL_DOCUMENTS_COMPLETE: `
            SELECT * FROM ${this.SCHEMA}.${this.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}
            ORDER BY data_upload DESC
        `,
        
        // Documento específico da view
        GET_DOCUMENT_COMPLETE_BY_ID: `
            SELECT * FROM ${this.SCHEMA}.${this.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}
            WHERE documento_id = $1
        `,
        
        // Estatísticas do sistema
        GET_SYSTEM_STATS: `
            SELECT 
                COUNT(*) as total_documentos,
                COUNT(CASE WHEN status_processamento = 'CONCLUIDO' THEN 1 END) as processados_completo,
                COUNT(CASE WHEN tem_processamento_nlp = 'Sim' THEN 1 END) as com_nlp,
                ROUND(AVG(CASE WHEN pontuacao_geral IS NOT NULL THEN pontuacao_geral END), 1) as qualidade_media
            FROM ${this.SCHEMA}.${this.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}
        `,
        
        // Documentos por status
        GET_DOCUMENTS_BY_STATUS: `
            SELECT status_processamento_completo, COUNT(*) as total
            FROM ${this.SCHEMA}.${this.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}
            GROUP BY status_processamento_completo
        `,
        
        // Documentos recentes
        GET_RECENT_DOCUMENTS: `
            SELECT documento_id, nome_arquivo, tipo_documento, data_upload, status_processamento_completo
            FROM ${this.SCHEMA}.${this.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}
            ORDER BY data_upload DESC
            LIMIT $1
        `
    },
    
    // Configurações de pool de conexões
    POOL_CONFIG: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    },
    
    // Configurações de cache
    CACHE_CONFIG: {
        defaultTTL: 300000, // 5 minutos
        checkPeriod: 60000, // 1 minuto
        maxKeys: 1000
    }
};

// ==========================================
// Classe para gerenciar conexão com o banco
// ==========================================

class DatabaseManager {
    constructor() {
        this.isConnected = false;
        this.connectionPool = null;
        this.cache = new Map();
        this.init();
    }

    async init() {
        try {
            // Verificar se estamos no ambiente de desenvolvimento
            if (typeof window !== 'undefined') {
                console.log('🔗 Configuração de banco carregada para frontend');
                console.log('📊 Schema:', DATABASE_CONFIG.SCHEMA);
                console.log('📋 Tables:', Object.keys(DATABASE_CONFIG.TABLES).length);
                console.log('👁️ Views:', Object.keys(DATABASE_CONFIG.VIEWS).length);
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar DatabaseManager:', error);
        }
    }

    // Verificar se a view existe e está acessível
    async testViewAccess() {
        try {
            // Esta função seria chamada pelo backend via API
            console.log('🔍 Testando acesso à view:', DATABASE_CONFIG.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL);
            
            // Simular teste de conexão
            return {
                success: true,
                message: 'View acessível',
                schema: DATABASE_CONFIG.SCHEMA,
                view: DATABASE_CONFIG.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL
            };
        } catch (error) {
            console.error('❌ Erro ao testar acesso à view:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obter configuração de conexão para o backend
    getConnectionConfig() {
        return {
            connectionString: `postgresql://${DATABASE_CONFIG.CONNECTION.user}:${DATABASE_CONFIG.CONNECTION.password}@${DATABASE_CONFIG.CONNECTION.host}:${DATABASE_CONFIG.CONNECTION.port}/${DATABASE_CONFIG.CONNECTION.database}?sslmode=require`,
            config: DATABASE_CONFIG.CONNECTION,
            poolConfig: DATABASE_CONFIG.POOL_CONFIG
        };
    }

    // Gerar query com schema correto
    buildQuery(queryTemplate, params = []) {
        // Substituir placeholders do schema e tabelas
        let query = queryTemplate
            .replace(/\$\{this\.SCHEMA\}/g, DATABASE_CONFIG.SCHEMA)
            .replace(/\$\{this\.VIEWS\.DOCUMENTOS_PROCESSAMENTO_FULL\}/g, 
                `${DATABASE_CONFIG.SCHEMA}.${DATABASE_CONFIG.VIEWS.DOCUMENTOS_PROCESSAMENTO_FULL}`);
        
        return {
            text: query,
            values: params
        };
    }

    // Cache de resultados
    setCache(key, data, ttl = DATABASE_CONFIG.CACHE_CONFIG.defaultTTL) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttl
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache do banco de dados limpo');
    }

    // Validar credenciais
    validateCredentials() {
        const config = DATABASE_CONFIG.CONNECTION;
        return config.host && config.user && config.password && config.database;
    }

    // Status da configuração
    getStatus() {
        return {
            configured: this.validateCredentials(),
            host: DATABASE_CONFIG.CONNECTION.host,
            database: DATABASE_CONFIG.CONNECTION.database,
            schema: DATABASE_CONFIG.SCHEMA,
            tables: Object.keys(DATABASE_CONFIG.TABLES).length,
            views: Object.keys(DATABASE_CONFIG.VIEWS).length,
            cacheSize: this.cache.size
        };
    }
}

// Instância global do gerenciador de banco
const databaseManager = new DatabaseManager();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DATABASE_CONFIG, 
        DatabaseManager, 
        databaseManager 
    };
} else {
    // Disponibilizar globalmente no browser
    window.DATABASE_CONFIG = DATABASE_CONFIG;
    window.databaseManager = databaseManager;
}

// Log de inicialização
console.log('🗄️ Database Config carregado para SIGATA');
console.log('🔗 Host:', DATABASE_CONFIG.CONNECTION.host);
console.log('📊 Schema:', DATABASE_CONFIG.SCHEMA);
