-- View completa para documentos com todas as informações de processamento
-- Corrigida baseada na estrutura real das tabelas do banco pli_db
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
    
    -- 2. documento_arquivo (armazenamento físico) - CORRIGIDO: sem campo id, chave é documento_id
    da.documento_id as arquivo_documento_id,
    da.nome_arquivo_original,
    da.caminho_arquivo,
    da.hash_arquivo as hash_arquivo, -- CORRIGIDO: campo real é hash_arquivo, não hash_arquivo_md5
    da.tamanho_arquivo_bytes,
    da.tipo_mime as mimetype,
    -- REMOVIDO: da.data_criacao - campo não existe na tabela real
    
    -- 3. documento_ata_dados (dados extraídos da ata)
    dad.id as ata_dados_id,
    dad.titulo_reuniao,
    dad.data_reuniao,
    dad.local_reuniao,
    dad.organizacao_responsavel,
    dad.tipo_reuniao,
    dad.status_reuniao,
    dad.numero_participantes,
    dad.duracao_estimada_minutos as duracao_estimada,
    dad.observacoes_gerais,
    dad.data_extracao as ata_data_extracao,
    
    -- 4. documento_qualidade (métricas de qualidade)
    dq.id as qualidade_id,
    dq.pontuacao_legibilidade,
    dq.pontuacao_estrutura,
    dq.pontuacao_completude,
    dq.pontuacao_coerencia,
    dq.pontuacao_geral,
    dq.nivel_confianca,
    dq.observacoes_qualidade,
    dq.metrica_palavras_total,
    dq.metrica_paragrafos_total,
    dq.metrica_sentencas_total,
    dq.data_avaliacao as qualidade_data_avaliacao,
    
    -- 5. documento_nlp_dados (processamento NLP)
    dnd.id as nlp_dados_id,
    dnd.idioma_detectado,
    dnd.palavras_chave_extraidas as palavras_chave_nlp,
    dnd.entidades_nomeadas,
    dnd.topicos_principais,
    dnd.resumo_automatico,
    dnd.sentimento_geral,
    dnd.pontuacao_sentimento,
    dnd.nivel_formalidade,
    dnd.complexidade_linguistica,
    dnd.data_processamento as nlp_data_processamento,
    
    -- 6. documento_nlp_metricas (métricas NLP)
    dnm.id as nlp_metricas_id,
    dnm.densidade_palavras_chave,
    dnm.diversidade_lexical,
    dnm.coesao_textual,
    dnm.indice_legibilidade,
    dnm.frequencia_termos_tecnicos,
    dnm.pontuacao_objetividade,
    dnm.indice_redundancia,
    dnm.metricas_adicionais,
    dnm.data_calculo as metricas_data_calculo,
    
    -- Campos calculados e agregados
    CASE 
        WHEN db.status_processamento = 'CONCLUIDO' AND dnd.id IS NOT NULL AND dnm.id IS NOT NULL THEN 'Completo'
        WHEN db.status_processamento = 'CONCLUIDO' AND dnd.id IS NOT NULL THEN 'Parcial'
        WHEN db.status_processamento = 'PROCESSANDO' THEN 'Em Processamento'
        WHEN db.status_processamento = 'ERRO' THEN 'Erro'
        ELSE 'Pendente'
    END as status_processamento_completo,
    
    -- Indicadores de presença de dados
    CASE WHEN da.id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_arquivo,
    CASE WHEN dad.id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_dados_ata,
    CASE WHEN dq.id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_avaliacao_qualidade,
    CASE WHEN dnd.id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_processamento_nlp,
    CASE WHEN dnm.id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_metricas_nlp,
    
    -- Tamanho formatado
    CASE 
        WHEN da.tamanho_arquivo_bytes IS NULL THEN 'N/A'
        WHEN da.tamanho_arquivo_bytes < 1024 THEN CONCAT(da.tamanho_arquivo_bytes, ' B')
        WHEN da.tamanho_arquivo_bytes < 1048576 THEN CONCAT(ROUND(da.tamanho_arquivo_bytes / 1024.0, 1), ' KB')
        ELSE CONCAT(ROUND(da.tamanho_arquivo_bytes / 1048576.0, 1), ' MB')
    END as tamanho_arquivo,
    
    -- Timestamp de última atualização
    GREATEST(
        COALESCE(db.data_atualizacao, db.data_criacao),
        COALESCE(da.data_criacao, '1900-01-01'::timestamp),
        COALESCE(dad.data_extracao, '1900-01-01'::timestamp),
        COALESCE(dq.data_avaliacao, '1900-01-01'::timestamp),
        COALESCE(dnd.data_processamento, '1900-01-01'::timestamp),
        COALESCE(dnm.data_calculo, '1900-01-01'::timestamp)
    ) as ultima_atualizacao

FROM sigata.documento_base db
    LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
    LEFT JOIN sigata.documento_ata_dados dad ON db.id = dad.documento_id
    LEFT JOIN sigata.documento_qualidade dq ON db.id = dq.documento_id
    LEFT JOIN sigata.documento_nlp_dados dnd ON db.id = dnd.documento_id
    LEFT JOIN sigata.documento_nlp_metricas dnm ON db.id = dnm.documento_id

ORDER BY db.data_upload DESC;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_documentos_processamento_full_documento_id 
ON sigata.documento_base(id);

CREATE INDEX IF NOT EXISTS idx_documentos_processamento_full_status 
ON sigata.documento_base(status_documento);

CREATE INDEX IF NOT EXISTS idx_documentos_processamento_full_data_upload 
ON sigata.documento_base(data_upload);

-- Comentários da view
COMMENT ON VIEW sigata.documentos_processamento_full IS 
'View completa que junta todas as informações de processamento de documentos das 6 tabelas principais: documento_base, documento_arquivo, documento_ata_dados, documento_qualidade, documento_nlp_dados, documento_nlp_metricas';
