-- ==========================================
-- PLI-DB - Banco de Dados Centralizado PLI/SP
-- PostgreSQL 17.5-R1 no AWS RDS
-- Suporta: SIGATA + Todas as aplicações PLI
-- ==========================================

-- Verificar versão do PostgreSQL
SELECT version();

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Verificar extensões instaladas
SELECT * FROM pg_extension;

-- ==========================================
-- CRIAÇÃO DE SCHEMAS
-- ==========================================

-- Schema principal para dados do SIGATA
CREATE SCHEMA IF NOT EXISTS sigata;

-- Schema para auditoria e logs
CREATE SCHEMA IF NOT EXISTS audit;

-- Schema para métricas e relatórios
CREATE SCHEMA IF NOT EXISTS metrics;

-- Schema para dados temporários e processamento
CREATE SCHEMA IF NOT EXISTS temp_processing;

-- Definir search_path padrão para aplicações PLI
ALTER DATABASE CURRENT_DATABASE() SET search_path = sigata, public;

COMMENT ON SCHEMA sigata IS 'Schema do sistema SIGATA - Gestão de Atas';
COMMENT ON SCHEMA audit IS 'Schema para auditoria centralizada de todas as aplicações PLI';
COMMENT ON SCHEMA metrics IS 'Schema para métricas centralizadas do PLI';
COMMENT ON SCHEMA temp_processing IS 'Schema para processamento temporário compartilhado';

-- ==========================================
-- CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ==========================================

-- Tabela de usuários
CREATE TABLE sigata.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE sigata.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(500),
    mimetype VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 para detectar duplicatas
    uploaded_by UUID REFERENCES sigata.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error', 'archived')),
    metadata JSONB,
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP
);

-- Tabela de análises
CREATE TABLE sigata.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES sigata.documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('basic', 'advanced', 'hybrid', 'custom')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    result JSONB,
    summary TEXT,
    keywords TEXT[],
    entities JSONB,
    sentiment_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    error_message TEXT,
    error_details JSONB,
    analyzed_by UUID REFERENCES sigata.users(id) ON DELETE SET NULL,
    nlp_model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Tabela de métricas do sistema
CREATE TABLE metrics.system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de auditoria
CREATE TABLE audit.user_actions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES sigata.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE sigata.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para cache de processamento NLP
CREATE TABLE temp_processing.nlp_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    result JSONB NOT NULL,
    model_version VARCHAR(50),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para tabela users
CREATE INDEX idx_users_email ON sigata.users(email);
CREATE INDEX idx_users_role ON sigata.users(role);
CREATE INDEX idx_users_active ON sigata.users(is_active);

-- Índices para tabela documents
CREATE INDEX idx_documents_uploaded_by ON sigata.documents(uploaded_by);
CREATE INDEX idx_documents_status ON sigata.documents(status);
CREATE INDEX idx_documents_uploaded_at ON sigata.documents(uploaded_at);
CREATE INDEX idx_documents_file_hash ON sigata.documents(file_hash);
CREATE INDEX idx_documents_tags ON sigata.documents USING GIN(tags);
CREATE INDEX idx_documents_metadata ON sigata.documents USING GIN(metadata);
CREATE INDEX idx_documents_filename_search ON sigata.documents USING GIN(to_tsvector('portuguese', original_name));

-- Índices para tabela analyses
CREATE INDEX idx_analyses_document_id ON sigata.analyses(document_id);
CREATE INDEX idx_analyses_status ON sigata.analyses(status);
CREATE INDEX idx_analyses_type ON sigata.analyses(analysis_type);
CREATE INDEX idx_analyses_created_at ON sigata.analyses(created_at);
CREATE INDEX idx_analyses_analyzed_by ON sigata.analyses(analyzed_by);
CREATE INDEX idx_analyses_result ON sigata.analyses USING GIN(result);
CREATE INDEX idx_analyses_entities ON sigata.analyses USING GIN(entities);
CREATE INDEX idx_analyses_keywords ON sigata.analyses USING GIN(keywords);

-- Índices para métricas
CREATE INDEX idx_metrics_name_time ON metrics.system_metrics(metric_name, created_at);
CREATE INDEX idx_metrics_tags ON metrics.system_metrics USING GIN(tags);

-- Índices para auditoria
CREATE INDEX idx_audit_user_action ON audit.user_actions(user_id, action, created_at);
CREATE INDEX idx_audit_resource ON audit.user_actions(resource_type, resource_id);

-- Índices para cache NLP
CREATE INDEX idx_nlp_cache_hash ON temp_processing.nlp_cache(content_hash);
CREATE INDEX idx_nlp_cache_expires ON temp_processing.nlp_cache(expires_at);

-- ==========================================
-- TRIGGERS E FUNÇÕES
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON sigata.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_analyses_updated_at 
    BEFORE UPDATE ON sigata.analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_settings_updated_at 
    BEFORE UPDATE ON sigata.system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.user_actions (user_id, action, resource_type, resource_id, details)
    VALUES (
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Usuários iniciais
INSERT INTO sigata.users (email, name, password_hash, role) VALUES 
('admin@pli.sp.gov.br', 'Administrador PLI', '$2b$10$dummy.hash.for.password123', 'admin'),
('analyst@pli.sp.gov.br', 'Analista PLI', '$2b$10$dummy.hash.for.password123', 'analyst'),
('viewer@pli.sp.gov.br', 'Visualizador PLI', '$2b$10$dummy.hash.for.password123', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Configurações iniciais do sistema
INSERT INTO sigata.system_settings (setting_key, setting_value, description, is_public) VALUES 
('nlp_model_version', '"1.0.0"', 'Versão atual do modelo NLP', true),
('max_file_size_mb', '50', 'Tamanho máximo de arquivo em MB', true),
('allowed_file_types', '["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]', 'Tipos de arquivo permitidos', true),
('analysis_timeout_minutes', '30', 'Timeout para análise em minutos', false),
('cache_ttl_hours', '24', 'Tempo de vida do cache em horas', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON TABLE sigata.users IS 'Usuários do sistema SIGATA com roles e controle de acesso';
COMMENT ON TABLE sigata.documents IS 'Documentos/atas carregados para análise com metadados e versionamento';
COMMENT ON TABLE sigata.analyses IS 'Análises NLP dos documentos com resultados estruturados';
COMMENT ON TABLE metrics.system_metrics IS 'Métricas de performance e uso do sistema';
COMMENT ON TABLE audit.user_actions IS 'Log de auditoria de todas as ações dos usuários';
COMMENT ON TABLE sigata.system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE temp_processing.nlp_cache IS 'Cache de resultados de processamento NLP';

-- ==========================================
-- VERIFICAÇÕES FINAIS
-- ==========================================

-- Verificar tabelas criadas
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname IN ('sigata', 'audit', 'metrics', 'temp_processing')
ORDER BY schemaname, tablename;

-- Verificar índices criados
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE schemaname IN ('sigata', 'audit', 'metrics', 'temp_processing')
ORDER BY schemaname, tablename, indexname;

-- Estatísticas das tabelas
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname IN ('sigata', 'audit', 'metrics', 'temp_processing');

ANALYZE;

-- ==========================================
-- FIM DO SETUP
-- ==========================================
