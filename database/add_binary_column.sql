-- Script para adicionar coluna arquivo_binario na tabela documento_base
-- Data: 20 de julho de 2025
-- Objetivo: Simplificar arquitetura armazenando binário diretamente na tabela principal

-- Adicionar colunas necessárias para armazenamento de arquivos
ALTER TABLE sigata.documento_base 
ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(100),
ADD COLUMN IF NOT EXISTS tamanho_arquivo BIGINT,
ADD COLUMN IF NOT EXISTS arquivo_binario BYTEA,
ADD COLUMN IF NOT EXISTS texto_extraido TEXT,
ADD COLUMN IF NOT EXISTS hash_arquivo VARCHAR(64);

-- Comentários para documentação
COMMENT ON COLUMN sigata.documento_base.nome_arquivo IS 'Nome original do arquivo enviado';
COMMENT ON COLUMN sigata.documento_base.tipo_arquivo IS 'Tipo MIME do arquivo (application/pdf, text/plain, etc.)';
COMMENT ON COLUMN sigata.documento_base.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN sigata.documento_base.arquivo_binario IS 'Conteúdo binário do arquivo';
COMMENT ON COLUMN sigata.documento_base.texto_extraido IS 'Texto extraído do arquivo para processamento NLP';
COMMENT ON COLUMN sigata.documento_base.hash_arquivo IS 'Hash SHA-256 do arquivo para verificação de integridade';

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_documento_base_nome_arquivo ON sigata.documento_base(nome_arquivo);
CREATE INDEX IF NOT EXISTS idx_documento_base_tipo_arquivo ON sigata.documento_base(tipo_arquivo);
CREATE INDEX IF NOT EXISTS idx_documento_base_tamanho ON sigata.documento_base(tamanho_arquivo);
CREATE INDEX IF NOT EXISTS idx_documento_base_hash ON sigata.documento_base(hash_arquivo);

-- Atualizar comentário da tabela
COMMENT ON TABLE sigata.documento_base IS 'Tabela principal para documentos com armazenamento binário integrado - Atualizada em 2025-07-20';

COMMIT;
