-- SIGATA Database Schema
-- Sistema Integrado de Gestão de Atas
-- RDS Connection Info:
-- Endpoint: pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com
-- Porta: 5432
-- Zona de disponibilidade: us-east-1f
-- VPC: vpc-0414081ddd70c6113
-- Grupo de sub-redes: fad-db-subnet-group-public
-- Sub-redes: subnet-037c024ca1622cfbb, subnet-0a6dffc19d01b74f0, subnet-09869b61da48214a2
-- Tipo de rede: IPv4
-- Security Group: pli-db-security-group (sg-03f59b57662a5ffc3)
-- Publicamente acessível: Sim
-- CA Certificate: rds-ca-rsa2048-g1 (emitido em May 25, 2061; expira em July 15, 2026)

-- =====================================
-- BLOCO 1: Banco de Dados e Conexão
-- =====================================
-- Criar banco de dados
CREATE DATABASE sigata_db;

-- Usar o banco criado
\c sigata_db;

-- =====================================
-- BLOCO 2: Criação de Tabelas
-- =====================================
-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error'))
);

-- Tabela de análises
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB,
    error TEXT,
    analyzed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de métricas do sistema
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- BLOCO 3: Índices para performance
-- =====================================
-- Índices para performance
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_analyses_document_id ON analyses(document_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

-- =====================================
-- BLOCO 4: Triggers
-- =====================================
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================
-- BLOCO 5: Dados iniciais
-- =====================================
-- Dados iniciais
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@pli.sp.gov.br', 'Administrador PLI', '$2b$10$dummy.hash.for.password123', 'admin'),
('analyst@pli.sp.gov.br', 'Analista PLI', '$2b$10$dummy.hash.for.password123', 'analyst');

-- =====================================
-- BLOCO 6: Comentários das tabelas
-- =====================================
-- Comentários das tabelas
COMMENT ON TABLE users IS 'Usuários do sistema SIGATA';
COMMENT ON TABLE documents IS 'Documentos/atas carregados para análise';
COMMENT ON TABLE analyses IS 'Análises NLP dos documentos';
COMMENT ON TABLE system_metrics IS 'Métricas de performance do sistema';
