-- Desabilitar restrições de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Criar sequências para auto-incremento
CREATE SEQUENCE IF NOT EXISTS sigata.documento_base_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_nlp_dados_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_nlp_metricas_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_ata_dados_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_qualidade_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.documento_controle_id_seq;
CREATE SEQUENCE IF NOT EXISTS sigata.log_operacoes_id_seq;
CREATE SEQUENCE IF NOT EXISTS usuarios.usuario_sistema_id_seq;

-- Backup das tabelas existentes
CREATE TABLE sigata.documento_base_old AS SELECT * FROM sigata.documento_base;
CREATE TABLE sigata.documento_nlp_dados_old AS SELECT * FROM sigata.documento_nlp_dados;
CREATE TABLE sigata.documento_nlp_metricas_old AS SELECT * FROM sigata.documento_nlp_metricas;
CREATE TABLE sigata.documento_ata_dados_old AS SELECT * FROM sigata.documento_ata_dados;
CREATE TABLE sigata.documento_qualidade_old AS SELECT * FROM sigata.documento_qualidade;
CREATE TABLE sigata.documento_controle_old AS SELECT * FROM sigata.documento_controle;
CREATE TABLE sigata.log_operacoes_old AS SELECT * FROM sigata.log_operacoes;
CREATE TABLE usuarios.usuario_sistema_old AS SELECT * FROM usuarios.usuario_sistema;

-- Alterar documento_base
ALTER TABLE sigata.documento_base 
  DROP CONSTRAINT IF EXISTS documento_base_pkey CASCADE;
ALTER TABLE sigata.documento_base 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_base_id_seq') ELSE nextval('sigata.documento_base_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_base_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_nlp_dados
ALTER TABLE sigata.documento_nlp_dados 
  DROP CONSTRAINT IF EXISTS documento_nlp_dados_pkey CASCADE;
ALTER TABLE sigata.documento_nlp_dados 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_nlp_dados_id_seq') ELSE nextval('sigata.documento_nlp_dados_id_seq') END,
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_nlp_dados_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_nlp_metricas
ALTER TABLE sigata.documento_nlp_metricas 
  DROP CONSTRAINT IF EXISTS documento_nlp_metricas_pkey CASCADE;
ALTER TABLE sigata.documento_nlp_metricas 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_nlp_metricas_id_seq') ELSE nextval('sigata.documento_nlp_metricas_id_seq') END,
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_nlp_metricas_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_ata_dados
ALTER TABLE sigata.documento_ata_dados 
  DROP CONSTRAINT IF EXISTS documento_ata_dados_pkey CASCADE;
ALTER TABLE sigata.documento_ata_dados 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_ata_dados_id_seq') ELSE nextval('sigata.documento_ata_dados_id_seq') END,
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_ata_dados_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_qualidade
ALTER TABLE sigata.documento_qualidade 
  DROP CONSTRAINT IF EXISTS documento_qualidade_pkey CASCADE;
ALTER TABLE sigata.documento_qualidade 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_qualidade_id_seq') ELSE nextval('sigata.documento_qualidade_id_seq') END,
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_qualidade_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar documento_controle
ALTER TABLE sigata.documento_controle 
  DROP CONSTRAINT IF EXISTS documento_controle_pkey CASCADE;
ALTER TABLE sigata.documento_controle 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.documento_controle_id_seq') ELSE nextval('sigata.documento_controle_id_seq') END,
  ALTER COLUMN documento_id TYPE integer USING documento_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.documento_controle_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar log_operacoes
ALTER TABLE sigata.log_operacoes 
  DROP CONSTRAINT IF EXISTS log_operacoes_pkey CASCADE;
ALTER TABLE sigata.log_operacoes 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('sigata.log_operacoes_id_seq') ELSE nextval('sigata.log_operacoes_id_seq') END,
  ALTER COLUMN usuario_id TYPE integer USING usuario_id::text::integer,
  ALTER COLUMN entidade_id TYPE integer USING entidade_id::text::integer,
  ALTER COLUMN id SET DEFAULT nextval('sigata.log_operacoes_id_seq'),
  ADD PRIMARY KEY (id);

-- Alterar usuario_sistema
ALTER TABLE usuarios.usuario_sistema 
  DROP CONSTRAINT IF EXISTS usuario_sistema_pkey CASCADE;
ALTER TABLE usuarios.usuario_sistema 
  ALTER COLUMN id TYPE integer USING CASE WHEN id IS NULL THEN nextval('usuarios.usuario_sistema_id_seq') ELSE nextval('usuarios.usuario_sistema_id_seq') END,
  ALTER COLUMN id SET DEFAULT nextval('usuarios.usuario_sistema_id_seq'),
  ADD PRIMARY KEY (id);

-- Recriar as chaves estrangeiras
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

ALTER TABLE sigata.log_operacoes
  ADD CONSTRAINT fk_log_operacoes_usuario 
  FOREIGN KEY (usuario_id) REFERENCES usuarios.usuario_sistema(id);

-- Reabilitar restrições de chave estrangeira
SET session_replication_role = 'origin';

-- Atualizar as sequências para o próximo valor disponível
SELECT setval('sigata.documento_base_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_base), 1));
SELECT setval('sigata.documento_nlp_dados_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_nlp_dados), 1));
SELECT setval('sigata.documento_nlp_metricas_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_nlp_metricas), 1));
SELECT setval('sigata.documento_ata_dados_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_ata_dados), 1));
SELECT setval('sigata.documento_qualidade_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_qualidade), 1));
SELECT setval('sigata.documento_controle_id_seq', COALESCE((SELECT MAX(id) FROM sigata.documento_controle), 1));
SELECT setval('sigata.log_operacoes_id_seq', COALESCE((SELECT MAX(id) FROM sigata.log_operacoes), 1));
SELECT setval('usuarios.usuario_sistema_id_seq', COALESCE((SELECT MAX(id) FROM usuarios.usuario_sistema), 1));