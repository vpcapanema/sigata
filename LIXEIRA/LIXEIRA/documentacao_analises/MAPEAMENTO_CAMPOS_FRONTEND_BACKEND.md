# 📋 MAPEAMENTO CAMPOS FRONTEND → BACKEND SIGATA

## 🎯 **RESUMO EXECUTIVO**
Este documento mapeia **EXATAMENTE** quais campos do frontend HTML enviam/recuperam dados de quais colunas do banco SIGATA, por página.

---

## 🔐 **1. LOGIN.HTML**

### **Campos de Entrada (POST /api/auth/login)**
| Campo Frontend | Input ID | Envia para Coluna DB | Tabela |
|---|---|---|---|
| **Usuário/Email** | `username` | `username` OU `email` | `usuarios.usuario_sistema` |
| **Senha** | `password` | `senha_hash` (bcrypt) | `usuarios.usuario_sistema` |
| **Lembrar-me** | `rememberMe` | *(localStorage)* | N/A |

### **Dados Retornados (Response)**
| Campo Frontend | Recebe de Coluna DB | Tabela |
|---|---|---|
| Token JWT | `id` + metadata | `usuarios.usuario_sistema` |
| Nome do usuário | `nome_completo`, `username` | `usuarios.usuario_sistema` |
| Último acesso | `ultimo_login` | `usuarios.usuario_sistema` |

---

## 📊 **2. DASHBOARD.HTML**

### **Dados de Usuário (GET /api/usuarios/{id})**
| Elemento Frontend | ID/Class | Recebe de Coluna DB | Tabela |
|---|---|---|---|
| **Nome saudação** | `userGreeting` | `username` | `usuarios.usuario_sistema` |
| **Avatar inicial** | `userAvatar` | `username[0]` | `usuarios.usuario_sistema` |
| **Último acesso** | `lastAccess` | `data_ultimo_login` | `usuarios.usuario_sistema` |

### **Estatísticas Pessoais (GET /api/dashboard/{userId})**
| Métrica Frontend | ID | Recebe de Coluna DB | Tabela/View |
|---|---|---|---|
| **Meus Documentos** | `userTotalDocs` | COUNT(*) WHERE `usuario_upload_id` | `sigata.documento_base` |
| **Processados** | `userProcessedDocs` | COUNT(*) WHERE `status_processamento = 'CONCLUIDO'` | `sigata.documento_base` |
| **Total Enviado** | `userUploadedSize` | SUM(`tamanho_arquivo_bytes`) | `sigata.documento_arquivo` |
| **Taxa Sucesso** | `userSuccessRate` | % documentos processados com sucesso | `sigata.documento_base` |

### **Documentos Recentes (GET /api/documents?userId={id})**
| Campo Frontend | Recebe de Coluna DB | Tabela |
|---|---|---|
| Nome arquivo | `titulo_documento` | `sigata.documento_base` |
| Data upload | `data_upload` | `sigata.documento_base` |
| Status | `status_processamento` | `sigata.documento_base` |
| Tamanho | `tamanho_arquivo_bytes` | `sigata.documento_arquivo` |

---

## 📤 **3. UPLOAD.HTML**

### **Upload de Arquivo (POST /api/upload)**
| Campo Frontend | Input/FormData | Grava em Coluna DB | Tabela |
|---|---|---|---|
| **Arquivo selecionado** | `fileInput` (file) | `conteudo_binario` | `sigata.documento_arquivo` |
| *(Nome original)* | `file.name` | `nome_arquivo_original` | `sigata.documento_arquivo` |
| *(Tamanho)* | `file.size` | `tamanho_arquivo_bytes` | `sigata.documento_arquivo` |
| *(Tipo MIME)* | `file.type` | `tipo_mime` | `sigata.documento_arquivo` |
| *(Usuário logado)* | JWT token → user.id | `usuario_upload_id` | `sigata.documento_base` |
| *(Data upload)* | `new Date()` | `data_upload` | `sigata.documento_base` |
| *(Status inicial)* | "PENDENTE" | `status_processamento` | `sigata.documento_base` |

### **Progresso de Upload**
| Elemento Frontend | ID | Função |
|---|---|---|
| **Barra upload** | `uploadProgressBar` | Progresso do arquivo |
| **Barra NLP** | `nlpProgressBar` | Progresso processamento |
| **Lista arquivos** | `fileList` | Arquivos selecionados |

---

## 📁 **4. DOCUMENTS.HTML**

### **Listagem de Documentos (GET /api/documents)**
| Campo Frontend | Recebe de Coluna DB | Tabela/View |
|---|---|---|
| **Código** | `codigo_documento` | `sigata.documento_base` |
| **Título** | `titulo_documento` | `sigata.documento_base` |
| **Tipo** | `tipo_documento` | `sigata.documento_base` |
| **Status** | `status_processamento` | `sigata.documento_base` |
| **Data Upload** | `data_upload` | `sigata.documento_base` |
| **Tamanho** | `tamanho_arquivo_bytes` | `sigata.documento_arquivo` |
| **Usuário** | `username` (JOIN) | `usuarios.usuario_sistema` |

### **Filtros de Busca**
| Filtro Frontend | ID | Query Backend | Coluna DB |
|---|---|---|---|
| **Status** | `statusFilter` | WHERE `status_processamento` | `sigata.documento_base` |
| **Tipo** | `typeFilter` | WHERE `tipo_documento` | `sigata.documento_base` |
| **Data** | `dateFilter` | WHERE `data_upload` BETWEEN | `sigata.documento_base` |
| **Usuário** | `userFilter` | WHERE `usuario_upload_id` | `sigata.documento_base` |

---

## 📈 **5. REPORTS.HTML**

### **Filtros de Relatório**
| Campo Frontend | ID | Query Backend | Tabela |
|---|---|---|---|
| **Período** | `periodFilter` | WHERE `data_geracao` BETWEEN | `sigata.relatorio_base` |
| **Tipo** | `typeFilter` | WHERE `tipo_periodo` | `sigata.relatorio_base` |
| **Status** | `statusFilter` | WHERE `status_geracao` | `sigata.relatorio_controle` |
| **Usuário** | `userFilter` | WHERE `gerado_por_id` | `sigata.relatorio_base` |

### **Estatísticas Consolidadas**
| Métrica Frontend | ID | View/Query | Tabela |
|---|---|---|---|
| **Total Docs** | `totalDocuments` | COUNT(*) | `sigata.v_documentos_basico` |
| **Tamanho Total** | `totalSize` | SUM(`tamanho_arquivo_bytes`) | `sigata.documento_arquivo` |
| **Tempo Médio** | `avgProcessingTime` | AVG(`tempo_processamento_total_ms`) | `sigata.relatorio_resultados` |
| **Taxa Sucesso** | `successRate` | % status = 'CONCLUIDO' | `sigata.relatorio_controle` |

---

## 📊 **6. ANALYTICS.HTML**

### **Métricas NLP (GET /api/stats/basico)**
| Métrica Frontend | ID | Recebe de Coluna DB | Tabela/View |
|---|---|---|---|
| **Entidades** | `totalEntities` | COUNT de entidades extraídas | `sigata.documento_nlp_dados` |
| **Palavras-chave** | `totalKeywords` | COUNT de keywords | `sigata.documento_nlp_dados` |
| **Sentimento** | `avgSentiment` | AVG(`sentimento_geral_periodo`) | `sigata.v_relatorios_dashboard` |
| **Tópicos** | `totalTopics` | COUNT de tópicos únicos | `sigata.documento_nlp_dados` |
| **Participantes** | `totalParticipants` | COUNT DISTINCT participantes | `sigata.participante_reuniao` |

### **Analytics Avançado (GET /api/analytics/nlp)**
| Elemento Frontend | Fonte de Dados | Tabela |
|---|---|---|
| **Gráfico Entidades** | `entitiesChart` | `sigata.documento_nlp_dados` |
| **Análise Sentimentos** | Indicadores sentiment | `sigata.documento_nlp_metricas` |
| **Distribuição Tópicos** | `topicsChart` | `sigata.documento_nlp_dados` |
| **Evolução Temporal** | `temporalChart` | `sigata.relatorio_resultados` |

---

## 🔄 **7. ENDPOINTS API MAPEADOS**

### **Endpoints Implementados**
| Endpoint | Método | Tabelas Envolvidas | Campos Principais |
|---|---|---|---|
| `/api/auth/login` | POST | `usuarios.usuario_sistema` | `username`, `email`, `senha_hash` |
| `/api/stats/basico` | GET | `sigata.v_stats_basico` | `usuarios_ativos`, `total_documentos`, `total_atas` |
| `/api/relatorios/resultados` | GET | `sigata.v_relatorios_dashboard` | Todos campos da view |
| `/api/schema/sigata` | GET | `information_schema.tables` | Estrutura completa |
| `/api/usuarios` | GET | `usuarios.usuario_sistema` | `id`, `username`, `email`, `tipo_usuario` |
| `/api/dashboard/{userId}` | GET | `sigata.documento_base` + JOINs | Estatísticas personalizadas |
| `/api/schema/table/{schema}/{table}` | GET | `information_schema.columns` | Estrutura de tabela específica |
| `/health` | GET | Sistema geral | Status conexão |

### **Endpoints Pendentes (Mock Data)**
| Endpoint | Frontend Usa | Tabelas Target |
|---|---|---|
| `/api/documents` | documents.html, dashboard.html | `sigata.documento_base` + JOINs |
| `/api/upload` | upload.html | `sigata.documento_base` + `documento_arquivo` |
| `/api/analytics/nlp` | analytics.html | `sigata.documento_nlp_*` |

---

## ✅ **VALIDAÇÃO TÉCNICA ATUALIZADA**

### **Usuário Admin Descoberto**
- ✅ **UUID**: `c05ead9a-ac08-4510-8f16-d7287368e3b6`
- ✅ **Username**: `admin`
- ✅ **Email**: `admin@sigma-pli.com.br`
- ✅ **Tipo**: `ADMIN`
- ✅ **Status**: Ativo e funcional

### **Estrutura Real da Tabela usuarios.usuario_sistema**
- ✅ **27 colunas** mapeadas completamente
- ✅ **UUID como PK** com `gen_random_uuid()`
- ✅ **Campos funcionais**: `username`, `email`, `senha_hash`, `tipo_usuario`
- ✅ **Metadados**: `data_ultimo_login`, `ativo`, `nivel_acesso`

---

## ✅ **VALIDAÇÃO TÉCNICA**

### **Banco de Dados**
- ✅ **PostgreSQL 17.5** conectado via AWS RDS
- ✅ **Esquema SIGATA** com 10 tabelas + 3 views
- ✅ **Relacionamentos** definidos via foreign keys
- ✅ **SSL** habilitado para conexão segura

### **Endpoints Funcionais**
- ✅ `/health` - Monitoramento
- ✅ `/api/test-db` - Teste conexão
- ✅ `/api/schema/sigata` - Estrutura DB
- ✅ `/api/stats/basico` - Estatísticas
- ✅ `/api/relatorios/resultados` - Relatórios

### **Próximos Passos**
1. **Implementar endpoints de documentos** (`/api/documents`)
2. **Conectar upload real** (`/api/upload`)
3. **Integrar autenticação** (`/api/auth/*`)
4. **Analytics NLP** (`/api/analytics/*`)

---

*📅 Última atualização: 17 de julho de 2025*
*🔗 Sistema SIGATA - Conectado ao AWS RDS PostgreSQL*
