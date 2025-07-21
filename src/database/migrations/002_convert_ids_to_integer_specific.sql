-- Desabilitar restrições de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Criar sequências para auto-incremento
CREATE SEQUENCE IF NOT EXISTS sigata.documento_base_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_arquivo_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_nlp_dados_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_nlp_metricas_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_ata_dados_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_qualidade_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_controle_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.relatorio_base_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.relatorio_resultados_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.relatorio_controle_id_seq;
CREATE SEQUENCE IF NOT EXISTS usuarios.usuario_sistema_id_seq;

-- Backup das tabelas existentes
CREATE TABLE sigata.documento_base_old AS SELECT * FROM sigata.documento_base;
CREATE TABLE sigata.documento_arquivo_old AS SELECT * FROM sigata.documento_arquivo;
CREATE TABLE sigata.documento_nlp_dados_old AS SELECT * FROM sigata.documento_nlp_dados;
CREATE TABLE sigata.documento_nlp_metricas_old AS SELECT * FROM sigata.documento_nlp_metricas;
CREATE TABLE sigata.documento_ata_dados_old AS SELECT * FROM sigata.documento_ata_dados;
CREATE TABLE sigata.documento_qualidade_old AS SELECT * FROM sigata.documento_qualidade;
CREATE TABLE sigata.documento_controle_old AS SELECT * FROM sigata.documento_controle;
CREATE TABLE sigata.relatorio_base_old AS SELECT * FROM sigata.relatorio_base;
CREATE TABLE sigata.relatorio_resultados_old AS SELECT * FROM sigata.relatorio_resultados;
CREATE TABLE sigata.relatorio_controle_old AS SELECT * FROM sigata.relatorio_controle;
CREATE TABLE usuarios.usuario_sistema_old AS SELECT * FROM usuarios.usuario_sistema;

-- Alterar documento_base
ALTER TABLE sigata.documento_base 
  DROP CONSTRAINT IF EXISTS documento_base_pkey CASCADE;
ALTER TABLE sigata.documento_base 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_base_id_seq') ELSE nextval('sigata.documento_base_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_base_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_arquivo
ALTER TABLE sigata.documento_arquivo 
  DROP CONSTRAINT IF EXISTS documento_arquivo_pkey CASCADE;
ALTER TABLE sigata.documento_arquivo 
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer;

-- Alterar documento_nlp_dados
ALTER TABLE sigata.documento_nlp_dados 
  DROP CONSTRAINT IF EXISTS documento_nlp_dados_pkey CASCADE;
ALTER TABLE sigata.documento_nlp_dados 
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ADD PRIMARY KEY (documento_id);

-- Alterar documento_nlp_metricas
ALTER TABLE sigata.documento_nlp_metricas 
  DROP CONSTRAINT IF EXISTS documento_nlp_metricas_pkey CASCADE;
ALTER TABLE sigata.documento_nlp_metricas 
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ADD PRIMARY KEY (documento_id);

-- Alterar documento_ata_dados
ALTER TABLE sigata.documento_ata_dados 
  DROP CONSTRAINT IF EXISTS documento_ata_dados_pkey CASCADE;
ALTER TABLE sigata.documento_ata_dados 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_ata_dados_id_seq') ELSE nextval('sigata.documento_ata_dados_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_ata_dados_id_seq'),
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ADD PRIMARY KEY (id);

-- Alterar documento_qualidade
ALTER TABLE sigata.documento_qualidade 
  DROP CONSTRAINT IF EXISTS documento_qualidade_pkey CASCADE;
ALTER TABLE sigata.documento_qualidade 
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ADD PRIMARY KEY (documento_id);

-- Alterar documento_controle
ALTER TABLE sigata.documento_controle 
  DROP CONSTRAINT IF EXISTS documento_controle_pkey CASCADE;
ALTER TABLE sigata.documento_controle 
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN documento_pai_id TYPE integer USING documento_pai_id::text::integer,
  ALTER COLUMN validado_por_id TYPE integer USING validado_por_id::text::integer,
  ADD PRIMARY KEY (documento_id);

-- Alterar relatorio_base
ALTER TABLE sigata.relatorio_base 
  DROP CONSTRAINT IF EXISTS relatorio_base_pkey CASCADE;
ALTER TABLE sigata.relatorio_base 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.relatorio_base_id_seq') ELSE nextval('sigata.relatorio_base_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('sigata.relatorio_base_id_seq'),
  ALTER COLUMN gerado_por_id TYPE integer USING gerado_por_id::text::integer,
  ADD PRIMARY KEY (id);

-- Alterar relatorio_resultados
ALTER TABLE sigata.relatorio_resultados 
  DROP CONSTRAINT IF EXISTS relatorio_resultados_pkey CASCADE;
ALTER TABLE sigata.relatorio_resultados 
  ALTER COLUMN relatorio_id TYPE integer USING relatorio_id::text::integer,
  ADD PRIMARY KEY (relatorio_id);

-- Alterar relatorio_controle
ALTER TABLE sigata.relatorio_controle 
  DROP CONSTRAINT IF EXISTS relatorio_controle_pkey CASCADE;
ALTER TABLE sigata.relatorio_controle 
  ALTER COLUMN relatorio_id TYPE integer USING relatorio_id::text::integer,
  ADD PRIMARY KEY (relatorio_id);

-- Alterar usuario_sistema
ALTER TABLE usuarios.usuario_sistema 
  DROP CONSTRAINT IF EXISTS usuario_sistema_pkey CASCADE;
ALTER TABLE usuarios.usuario_sistema 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('usuarios.usuario_sistema_id_seq') ELSE nextval('usuarios.usuario_sistema_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('usuarios.usuario_sistema_id_seq'),
  ADD PRIMARY KEY (id);

-- Recriar as chaves estrangeiras
ALTER TABLE sigata.documento_arquivo
  ADD CONSTRAINT fk_documento_arquivo_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.documento_nlp_dados
  ADD CONSTRAINT fk_documento_nlp_dados_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.documento_nlp_metricas
  ADD CONSTRAINT fk_documento_nlp_metricas_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.documento_ata_dados
  ADD CONSTRAINT fk_documento_ata_dados_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.documento_qualidade
  ADD CONSTRAINT fk_documento_qualidade_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.documento_controle
  ADD CONSTRAINT fk_documento_controle_documento 
  FOREIGN KEY (documento_id) REFERENCES sigata.documento_base(id);

ALTER TABLE sigata.relatorio_resultados
  ADD CONSTRAINT fk_relatorio_resultados_relatorio 
  FOREIGN KEY (relatorio_id) REFERENCES sigata.relatorio_base(id);

ALTER TABLE sigata.relatorio_controle
  ADD CONSTRAINT fk_relatorio_controle_relatorio 
  FOREIGN KEY (relatorio_id) REFERENCES sigata.relatorio_base(id);

-- Reabilitar restrições de chave estrangeira
SET session_replication_role = 'origin';

-- Atualizar as sequências para o próximo valor disponível
SELECT setval('sigata.documento_base_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_base), 1));
SELECT setval('sigata.documento_ata_dados_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_ata_dados), 1));
SELECT setval('sigata.relatorio_base_id_seq', COALESCE((SELECT MAX(id) FROM sigata.relatorio_base), 1));
SELECT setval('usuarios.usuario_sistema_id_seq', COALESCE((SELECT MAX(id) FROM usuarios.usuario_sistema), 1));