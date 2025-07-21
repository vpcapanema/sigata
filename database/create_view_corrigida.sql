-- View completa para documentos - CORRIGIDA baseada na estrutura real
CREATE OR REPLACE VIEW sigata.documentos_processamento_full AS
SELECT 
    -- 1. documento_base (tabela principal)
    db.id as documento_id,
    db.codigo_documento,
    db.titulo_documento as nome_arquivo,
    db.tipo_documento,
    db.subtipo_documento,
    db.categoria,
    db.descricao,
    db.palavras_chave,
    db.usuario_upload_id,
    db.data_upload,
    db.status_processamento as status_documento,
    db.data_inicio_processamento,
    db.data_fim_processamento,
    db.data_criacao as documento_data_criacao,
    db.data_atualizacao as documento_data_atualizacao,
    
    -- 2. documento_arquivo (estrutura real sem campo id)
    da.documento_id as arquivo_documento_id,
    da.nome_arquivo_original,
    da.caminho_arquivo,
    da.hash_arquivo,
    da.tamanho_arquivo_bytes,
    da.tipo_mime as mimetype,
    
    -- 3. documento_ata_dados (estrutura real)
    dad.documento_id as ata_documento_id,
    dad.data_reuniao,
    dad.hora_inicio_reuniao,
    dad.hora_fim_reuniao,
    dad.local_reuniao,
    dad.duracao_reuniao_minutos as duracao_estimada,
    
    -- 4. documento_qualidade (estrutura real)
    dq.documento_id as qualidade_documento_id,
    dq.taxa_conversao,
    dq.qualidade_texto,
    dq.segmentacao_score,
    dq.legibilidade_score,
    dq.completude_informacoes,
    dq.quantidade_paginas,
    dq.quantidade_palavras,
    dq.quantidade_caracteres,
    dq.quantidade_paragrafos,
    dq.quantidade_tentativas_processamento,
    dq.tempo_total_processamento_ms,
    dq.memoria_utilizada_mb,
    dq.cpu_utilizada_percentual,
    
    -- 5. documento_nlp_dados (assumindo estrutura similar)
    dnd.documento_id as nlp_dados_documento_id,
    
    -- 6. documento_nlp_metricas (assumindo estrutura similar)
    dnm.documento_id as nlp_metricas_documento_id,
    
    -- Campos calculados
    CASE 
        WHEN db.status_processamento = 'CONCLUIDO' AND dnd.documento_id IS NOT NULL AND dnm.documento_id IS NOT NULL THEN 'Completo'
        WHEN db.status_processamento = 'CONCLUIDO' AND dnd.documento_id IS NOT NULL THEN 'Parcial'
        WHEN db.status_processamento = 'PROCESSANDO' THEN 'Em Processamento'
        WHEN db.status_processamento = 'ERRO' THEN 'Erro'
        ELSE 'Pendente'
    END as status_processamento_completo,
    
    -- Indicadores de presença de dados
    CASE WHEN da.documento_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_arquivo,
    CASE WHEN dad.documento_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_dados_ata,
    CASE WHEN dq.documento_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_avaliacao_qualidade,
    CASE WHEN dnd.documento_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_processamento_nlp,
    CASE WHEN dnm.documento_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_metricas_nlp,
    
    -- Tamanho formatado
    CASE 
        WHEN da.tamanho_arquivo_bytes IS NULL THEN 'N/A'
        WHEN da.tamanho_arquivo_bytes < 1024 THEN CONCAT(da.tamanho_arquivo_bytes, ' B')
        WHEN da.tamanho_arquivo_bytes < 1048576 THEN CONCAT(ROUND(da.tamanho_arquivo_bytes / 1024.0, 1), ' KB')
        ELSE CONCAT(ROUND(da.tamanho_arquivo_bytes / 1048576.0, 1), ' MB')
    END as tamanho_arquivo,
    
    -- Timestamp de última atualização
    GREATEST(
        COALESCE(db.data_atualizacao, db.data_criacao)
    ) as ultima_atualizacao

FROM sigata.documento_base db
    LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
    LEFT JOIN sigata.documento_ata_dados dad ON db.id = dad.documento_id
    LEFT JOIN sigata.documento_qualidade dq ON db.id = dq.documento_id
    LEFT JOIN sigata.documento_nlp_dados dnd ON db.id = dnd.documento_id
    LEFT JOIN sigata.documento_nlp_metricas dnm ON db.id = dnm.documento_id

ORDER BY db.data_upload DESC;

-- Comentário da view
COMMENT ON VIEW sigata.documentos_processamento_full IS 
'View completa que junta todas as informações de processamento de documentos das 6 tabelas principais';
