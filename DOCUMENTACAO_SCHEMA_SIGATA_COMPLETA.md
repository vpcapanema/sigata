# Documentação Completa do Schema SIGATA

**Data de Atualização:** 20 de julho de 2025
**Banco de Dados:** PostgreSQL 17.5 (AWS RDS)
**Schema:** sigata

## 📋 Visão Geral

O schema `sigata` é o core do Sistema Integrado de Gestão de Atas (SIGATA), responsável pelo processamento, análise e armazenamento de documentos de atas de reunião com tecnologia NLP avançada.

## 🗂️ Estrutura de Tabelas

### 1. **`sigata.documento_base`** - Tabela Principal

**Descrição:** Tabela central que armazena os metadados básicos de todos os documentos do sistema.

| Coluna                        | Tipo             | Nulo     | Padrão               | Descrição                                               |
| ----------------------------- | ---------------- | -------- | --------------------- | --------------------------------------------------------- |
| `id`                        | `uuid`         | NOT NULL | `gen_random_uuid()` | Chave primária única do documento                       |
| `codigo_documento`          | `varchar(50)`  | NOT NULL | -                     | Código único alfanumérico do documento                 |
| `tipo_documento`            | `varchar(30)`  | NOT NULL | -                     | Tipo: ATA, RELATORIO, CONTRATO, OFICIO, MEMORANDO, OUTROS |
| `subtipo_documento`         | `varchar(50)`  | NULL     | -                     | Subtipo específico do documento                          |
| `categoria`                 | `varchar(50)`  | NULL     | -                     | Categoria para classificação                            |
| `titulo_documento`          | `varchar(255)` | NOT NULL | -                     | Título/nome do documento                                 |
| `descricao`                 | `text`         | NULL     | -                     | Descrição detalhada do documento                        |
| `palavras_chave`            | `text[]`       | NULL     | -                     | Array de palavras-chave para busca                        |
| `usuario_upload_id`         | `uuid`         | NOT NULL | -                     | FK para usuarios.usuario_sistema                          |
| `data_upload`               | `timestamp`    | NULL     | `CURRENT_TIMESTAMP` | Data/hora do upload                                       |
| `endereco_ip_upload`        | `inet`         | NULL     | -                     | IP do usuário que fez upload                             |
| `agente_usuario`            | `text`         | NULL     | -                     | User agent do navegador                                   |
| `status_processamento`      | `varchar(20)`  | NULL     | `'PENDENTE'`        | Status: PENDENTE, PROCESSANDO, CONCLUIDO, ERRO, REJEITADO |
| `data_inicio_processamento` | `timestamp`    | NULL     | -                     | Início do processamento NLP                              |
| `data_fim_processamento`    | `timestamp`    | NULL     | -                     | Fim do processamento NLP                                  |
| `data_criacao`              | `timestamp`    | NULL     | `CURRENT_TIMESTAMP` | Data de criação do registro                             |
| `data_atualizacao`          | `timestamp`    | NULL     | `CURRENT_TIMESTAMP` | Última atualização (auto-update)                       |
| `data_exclusao`             | `timestamp`    | NULL     | -                     | Data de exclusão lógica                                 |

**Índices:**

- `documento_base_pkey` (PRIMARY KEY)
- `documento_base_codigo_documento_key` (UNIQUE)
- Índices otimizados para: categoria, data_upload, status, tipo, usuario_upload_id

**Restrições:**

- `chk_documento_status`: Status deve ser um dos valores válidos
- `chk_documento_tipo`: Tipo deve ser um dos valores válidos
- FK para `usuarios.usuario_sistema(id)`

### 2. **`sigata.documento_arquivo`** - Armazenamento de Arquivos

**Descrição:** Armazena os arquivos binários e metadados relacionados ao armazenamento físico.

| Coluna                     | Tipo             | Nulo     | Padrão | Descrição                              |
| -------------------------- | ---------------- | -------- | ------- | ---------------------------------------- |
| `documento_id`           | `uuid`         | NOT NULL | -       | PK/FK para documento_base.id             |
| `nome_arquivo_original`  | `varchar(255)` | NOT NULL | -       | Nome original do arquivo enviado         |
| `caminho_arquivo`        | `varchar(500)` | NOT NULL | -       | Caminho do arquivo no sistema            |
| `arquivo_binario`        | `bytea`        | NULL     | -       | Conteúdo binário do arquivo            |
| `arquivo_texto_extraido` | `text`         | NULL     | -       | Texto extraído do arquivo (OCR/parsing) |
| `arquivo_metadados`      | `jsonb`        | NULL     | -       | Metadados em formato JSON                |
| `tamanho_arquivo_bytes`  | `bigint`       | NULL     | -       | Tamanho do arquivo em bytes              |
| `tipo_mime`              | `varchar(100)` | NULL     | -       | Tipo MIME do arquivo                     |
| `hash_arquivo`           | `varchar(64)`  | NULL     | -       | Hash SHA-256 para verificação          |

**Índices:**

- `documento_arquivo_pkey` (PRIMARY KEY)
- Índices otimizados para: hash_arquivo, tamanho_arquivo_bytes, tipo_mime

**Restrições:**

- FK para `documento_base(id)` com CASCADE DELETE

### 3. **`sigata.documento_nlp_dados`** - Dados de Análise NLP

**Descrição:** Armazena os resultados da análise de Processamento de Linguagem Natural.

| Coluna                      | Tipo         | Nulo     | Padrão | Descrição                                             |
| --------------------------- | ------------ | -------- | ------- | ------------------------------------------------------- |
| `documento_id`            | `uuid`     | NOT NULL | -       | PK/FK para documento_base.id                            |
| `nlp_entidades_extraidas` | `jsonb`    | NULL     | -       | Entidades identificadas (pessoas, organizações, etc.) |
| `participantes_extraidos` | `text[]`   | NULL     | -       | Array de participantes da reunião                      |
| `nlp_resumo_automatico`   | `text`     | NULL     | -       | Resumo gerado automaticamente                           |
| `nlp_palavras_frequentes` | `jsonb`    | NULL     | -       | Palavras mais frequentes e relevantes                   |
| `decisoes_extraidas`      | `text[]`   | NULL     | -       | Decisões tomadas na reunião                           |
| `acoes_extraidas`         | `jsonb`    | NULL     | -       | Ações definidas com responsáveis e prazos            |
| `vetor_busca`             | `tsvector` | NULL     | -       | Vetor para busca textual otimizada                      |

**Índices:**

- `documento_nlp_dados_pkey` (PRIMARY KEY)
- `idx_documento_nlp_vetor_busca` (GIN)
- `idx_nlp_participantes` (GIN)

**Triggers:**

- `trg_update_vetor_busca_nlp`: Atualiza vetor de busca automaticamente

### 4. **`sigata.documento_nlp_metricas`** - Métricas de Performance NLP

**Descrição:** Métricas de qualidade e performance do processamento NLP.

| Coluna                       | Tipo             | Nulo     | Padrão | Descrição                                  |
| ---------------------------- | ---------------- | -------- | ------- | -------------------------------------------- |
| `documento_id`             | `uuid`         | NOT NULL | -       | PK/FK para documento_base.id                 |
| `metrica_coerencia`        | `numeric(8,6)` | NULL     | -       | Métrica de coerência do BERTopic           |
| `metrica_silhueta`         | `numeric(8,6)` | NULL     | -       | Métrica silhueta do clustering              |
| `bert_precisao`            | `numeric(8,6)` | NULL     | -       | Precisão do BERTScore                       |
| `bert_revocacao`           | `numeric(8,6)` | NULL     | -       | Revocação do BERTScore                     |
| `bert_pontuacao_f1`        | `numeric(8,6)` | NULL     | -       | F1-Score do BERT                             |
| `nlp_sentimento_geral`     | `varchar(20)`  | NULL     | -       | Sentimento geral: POSITIVO, NEUTRO, NEGATIVO |
| `nlp_pontuacao_sentimento` | `numeric(5,3)` | NULL     | -       | Score numérico do sentimento (-1 a 1)       |
| `tempo_processamento_ms`   | `integer`      | NULL     | -       | Tempo de processamento em milissegundos      |
| `modelo_bert_utilizado`    | `varchar(100)` | NULL     | -       | Versão do modelo BERT usado                 |

### 5. **`sigata.documento_ata_dados`** - Dados Específicos de Atas

**Descrição:** Dados estruturados específicos de atas de reunião.

| Coluna                      | Tipo             | Nulo     | Padrão               | Descrição                      |
| --------------------------- | ---------------- | -------- | --------------------- | -------------------------------- |
| `id`                      | `uuid`         | NOT NULL | `gen_random_uuid()` | Chave primária                  |
| `documento_id`            | `uuid`         | NOT NULL | -                     | FK para documento_base.id        |
| `titulo_reuniao`          | `varchar(255)` | NULL     | -                     | Título da reunião              |
| `data_reuniao`            | `date`         | NULL     | -                     | Data da reunião                 |
| `hora_inicio_reuniao`     | `time`         | NULL     | -                     | Horário de início              |
| `hora_fim_reuniao`        | `time`         | NULL     | -                     | Horário de término             |
| `local_reuniao`           | `varchar(255)` | NULL     | -                     | Local onde ocorreu a reunião    |
| `organizacao_responsavel` | `varchar(255)` | NULL     | -                     | Organização responsável       |
| `tipo_reuniao`            | `varchar(50)`  | NULL     | -                     | Tipo da reunião                 |
| `status_reuniao`          | `varchar(30)`  | NULL     | -                     | Status da reunião               |
| `numero_participantes`    | `integer`      | NULL     | -                     | Número total de participantes   |
| `duracao_reuniao_minutos` | `integer`      | NULL     | -                     | Duração calculada em minutos   |
| `observacoes_gerais`      | `text`         | NULL     | -                     | Observações gerais da reunião |
| `data_extracao`           | `timestamp`    | NULL     | `CURRENT_TIMESTAMP` | Data de extração dos dados     |

### 6. **`sigata.documento_qualidade`** - Métricas de Qualidade

**Descrição:** Avaliação da qualidade do documento e do processamento.

| Coluna                                  | Tipo             | Nulo     | Padrão | Descrição                        |
| --------------------------------------- | ---------------- | -------- | ------- | ---------------------------------- |
| `documento_id`                        | `uuid`         | NOT NULL | -       | PK/FK para documento_base.id       |
| `taxa_conversao`                      | `numeric(5,2)` | NULL     | -       | Taxa de sucesso na conversão (%)  |
| `qualidade_texto`                     | `numeric(5,2)` | NULL     | -       | Qualidade do texto extraído (%)   |
| `segmentacao_score`                   | `numeric(5,2)` | NULL     | -       | Score da segmentação do texto    |
| `legibilidade_score`                  | `numeric(5,2)` | NULL     | -       | Score de legibilidade              |
| `completude_informacoes`              | `numeric(5,2)` | NULL     | -       | Completude das informações (%)   |
| `quantidade_paginas`                  | `integer`      | NULL     | -       | Número de páginas do documento   |
| `quantidade_palavras`                 | `integer`      | NULL     | -       | Número total de palavras          |
| `quantidade_caracteres`               | `integer`      | NULL     | -       | Número total de caracteres        |
| `quantidade_paragrafos`               | `integer`      | NULL     | -       | Número de parágrafos             |
| `quantidade_tentativas_processamento` | `integer`      | NULL     | -       | Tentativas de reprocessamento      |
| `tempo_total_processamento_ms`        | `integer`      | NULL     | -       | Tempo total gasto no processamento |
| `memoria_utilizada_mb`                | `numeric(8,2)` | NULL     | -       | Memória utilizada (MB)            |
| `cpu_utilizada_percentual`            | `numeric(5,2)` | NULL     | -       | CPU utilizada (%)                  |

### 7. **`sigata.documento_controle`** - Controle e Workflow

**Descrição:** Sistema de controle, versionamento e workflow de documentos.

| Coluna                | Tipo            | Nulo     | Padrão        | Descrição                            |
| --------------------- | --------------- | -------- | -------------- | -------------------------------------- |
| `documento_id`      | `uuid`        | NOT NULL | -              | PK/FK para documento_base.id           |
| `versao_documento`  | `integer`     | NULL     | `1`          | Versão do documento                   |
| `documento_pai_id`  | `uuid`        | NULL     | -              | FK para versão anterior               |
| `status_validacao`  | `varchar(20)` | NULL     | `'PENDENTE'` | PENDENTE, VALIDADO, REJEITADO          |
| `validado_por_id`   | `uuid`        | NULL     | -              | FK para usuario que validou            |
| `data_validacao`    | `timestamp`   | NULL     | -              | Data da validação                    |
| `visibilidade`      | `varchar(20)` | NULL     | `'PUBLICO'`  | PUBLICO, PRIVADO, RESTRITO             |
| `confidencialidade` | `varchar(20)` | NULL     | `'NORMAL'`   | PUBLICO, NORMAL, CONFIDENCIAL, SECRETO |

### 8. **`sigata.relatorio_base`** - Base de Relatórios

**Descrição:** Tabela principal para geração de relatórios consolidados.

| Coluna                    | Tipo             | Nulo     | Padrão               | Descrição                            |
| ------------------------- | ---------------- | -------- | --------------------- | -------------------------------------- |
| `id`                    | `uuid`         | NOT NULL | `gen_random_uuid()` | Chave primária                        |
| `codigo_relatorio`      | `varchar(50)`  | NOT NULL | -                     | Código único do relatório           |
| `titulo_relatorio`      | `varchar(255)` | NOT NULL | -                     | Título do relatório                  |
| `data_inicio_periodo`   | `date`         | NULL     | -                     | Início do período analisado          |
| `data_fim_periodo`      | `date`         | NULL     | -                     | Fim do período analisado              |
| `tipo_periodo`          | `varchar(20)`  | NULL     | -                     | MENSAL, TRIMESTRAL, ANUAL, CUSTOMIZADO |
| `escopo_relatorio`      | `varchar(30)`  | NULL     | -                     | Escopo da análise                     |
| `total_atas_analisadas` | `integer`      | NULL     | -                     | Total de atas incluídas               |
| `data_geracao`          | `timestamp`    | NULL     | `CURRENT_TIMESTAMP` | Data de geração                      |
| `gerado_por_id`         | `uuid`         | NOT NULL | -                     | FK para usuario que gerou              |
| `data_exclusao`         | `timestamp`    | NULL     | -                     | Data de exclusão lógica              |

### 9. **`sigata.relatorio_resultados`** - Resultados de Relatórios

**Descrição:** Resultados consolidados dos relatórios gerados.

| Coluna                           | Tipo             | Nulo     | Padrão | Descrição                         |
| -------------------------------- | ---------------- | -------- | ------- | ----------------------------------- |
| `relatorio_id`                 | `uuid`         | NOT NULL | -       | PK/FK para relatorio_base.id        |
| `resumo_geral_periodo`         | `text`         | NULL     | -       | Resumo executivo do período        |
| `sentimento_geral_periodo`     | `varchar(20)`  | NULL     | -       | Sentimento predominante             |
| `qualidade_media_geral`        | `numeric(8,6)` | NULL     | -       | Qualidade média dos documentos     |
| `metrica_performance_media`    | `numeric(8,6)` | NULL     | -       | Performance média de processamento |
| `tempo_processamento_total_ms` | `integer`      | NULL     | -       | Tempo total de processamento        |

### 10. **`sigata.relatorio_controle`** - Controle de Relatórios

**Descrição:** Controle de geração e versionamento de relatórios.

| Coluna                 | Tipo            | Nulo     | Padrão        | Descrição                        |
| ---------------------- | --------------- | -------- | -------------- | ---------------------------------- |
| `relatorio_id`       | `uuid`        | NOT NULL | -              | PK/FK para relatorio_base.id       |
| `formato_relatorio`  | `varchar(20)` | NULL     | `'PDF'`      | PDF, HTML, EXCEL, JSON             |
| `status_geracao`     | `varchar(20)` | NULL     | `'PENDENTE'` | PENDENTE, GERANDO, CONCLUIDO, ERRO |
| `tempo_geracao_ms`   | `integer`     | NULL     | -              | Tempo de geração em ms           |
| `relatorio_agendado` | `boolean`     | NULL     | `false`      | Se foi gerado automaticamente      |
| `visibilidade`       | `varchar(20)` | NULL     | `'PUBLICO'`  | Nível de visibilidade             |
| `versao_relatorio`   | `integer`     | NULL     | `1`          | Versão do relatório              |

## 📊 Views Otimizadas

### 1. **`sigata.v_documentos_processamento_full`**

**Descrição:** View completa com JOIN de todas as tabelas relacionadas aos documentos.
**Uso:** Dashboard principal, relatórios detalhados, análises completas.

### 2. **`sigata.v_documentos_basico`**

**Descrição:** View simplificada para listagens rápidas.
**Uso:** Listagens de documentos, APIs de consulta básica.

### 3. **`sigata.v_relatorios_dashboard`**

**Descrição:** Dashboard de relatórios com informações consolidadas.
**Uso:** Interface de relatórios, dashboards executivos.

### 4. **`sigata.v_stats_basico`**

**Descrição:** Estatísticas básicas do sistema.
**Uso:** Dashboard geral, métricas de uso do sistema.

## 🔗 Relacionamentos

```
usuarios.usuario_sistema (1) ←→ (N) documento_base
documento_base (1) ←→ (1) documento_arquivo
documento_base (1) ←→ (1) documento_nlp_dados
documento_base (1) ←→ (1) documento_nlp_metricas
documento_base (1) ←→ (N) documento_ata_dados
documento_base (1) ←→ (1) documento_qualidade
documento_base (1) ←→ (1) documento_controle
documento_base (1) ←→ (1) relatorio_base
```

## 🛡️ Segurança e Auditoria

- **Exclusão Lógica:** Campo `data_exclusao` para soft delete
- **Auditoria:** Campos `data_criacao` e `data_atualizacao` com triggers automáticos
- **Controle de Acesso:** Campos de visibilidade e confidencialidade
- **Integridade:** Constraints e foreign keys com CASCADE DELETE apropriado

## 📈 Performance

- **Índices Otimizados:** Para consultas frequentes (data, status, tipo, usuário)
- **Particionamento:** Recomendado para `documento_base` por data_upload em grandes volumes
- **Busca Textual:** Índices GIN para `tsvector` e arrays
- **Cache:** Views materializadas para estatísticas pesadas

## 🔧 Manutenção

- **Backup:** Backup automático configurado no RDS
- **Monitoring:** CloudWatch metrics habilitado
- **Logs:** Log de performance de queries lentas
- **Cleanup:** Jobs de limpeza para dados antigos (data_exclusao)

---

**Documentação gerada automaticamente via AWS CLI**
**Última verificação:** 20/07/2025 15:52 UTC
