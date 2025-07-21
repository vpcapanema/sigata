# MAPEAMENTO COMPLETO - SCHEMA USUARIOS
**Data:** 19/07/2025  
**Banco:** pli_db  
**Connection:** postgresql://postgres:semil2025*@pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com:5432/pli_db?sslmode=require

---

## 📋 TABELA: `usuarios.usuario_sistema`

### **Campos Principais:**
| Campo | Tipo | Obrigatório | Padrão | Valores Possíveis | Descrição |
|-------|------|-------------|--------|-------------------|-----------|
| `id` | UUID | ✅ | `gen_random_uuid()` | — | Chave primária |
| `username` | VARCHAR(50) | ✅ | — | — | Nome de usuário único |
| `email` | VARCHAR(255) | ✅ | — | — | Email único |
| `senha_hash` | VARCHAR(255) | ✅ | — | — | Hash da senha |
| `salt` | VARCHAR(32) | ❌ | — | — | Salt para hash |

### **Autenticação & Segurança:**
| Campo | Tipo | Obrigatório | Padrão | Valores Possíveis |
|-------|------|-------------|--------|-------------------|
| `duplo_fator_habilitado` | BOOLEAN | ❌ | `false` | `true`, `false` |
| `duplo_fator_chave_secreta` | VARCHAR(32) | ❌ | — | — |
| `email_verificado` | BOOLEAN | ❌ | `false` | `true`, `false` |
| `primeiro_acesso` | BOOLEAN | ❌ | `true` | `true`, `false` |
| `data_ultimo_login` | TIMESTAMP | ❌ | — | — |
| `tentativas_login` | INTEGER | ❌ | `0` | 0-∞ |
| `bloqueado_ate` | TIMESTAMP | ❌ | — | — |

### **Perfil & Permissões:**
| Campo | Tipo | Obrigatório | Padrão | **VALORES POSSÍVEIS** |
|-------|------|-------------|--------|-----------------------|
| `tipo_usuario` | VARCHAR(20) | ✅ | — | **`ADMIN`, `GESTOR`, `ANALISTA`, `OPERADOR`, `VISUALIZADOR`** |
| `nivel_acesso` | INTEGER | ❌ | `1` | **1-5** (CHECK: nivel_acesso >= 1 AND nivel_acesso <= 5) |
| `departamento` | VARCHAR(100) | ❌ | — | — |
| `cargo` | VARCHAR(100) | ❌ | — | — |
| `ativo` | BOOLEAN | ❌ | `true` | `true`, `false` |

### **Vínculos Externos:**
| Campo | Tipo | Obrigatório | Relação | Restrição |
|-------|------|-------------|---------|-----------|
| `pessoa_fisica_id` | UUID | ❌ | → `cadastro.pessoa_fisica(id)` | **Exclusivo com pessoa_juridica_id** |
| `pessoa_juridica_id` | UUID | ❌ | → `cadastro.pessoa_juridica(id)` | **Exclusivo com pessoa_fisica_id** |

### **Configurações Pessoais:**
| Campo | Tipo | Obrigatório | Padrão | Valores Possíveis |
|-------|------|-------------|--------|-------------------|
| `fuso_horario` | VARCHAR(50) | ❌ | `'America/Sao_Paulo'` | Timezone válido |
| `idioma` | VARCHAR(5) | ❌ | `'pt-BR'` | Código ISO (pt-BR, en-US, etc.) |
| `tema_interface` | VARCHAR(20) | ❌ | `'light'` | `light`, `dark`, etc. |

### **Auditoria:**
| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `data_criacao` | TIMESTAMP | ❌ | `CURRENT_TIMESTAMP` |
| `data_atualizacao` | TIMESTAMP | ❌ | `CURRENT_TIMESTAMP` |
| `criado_por_id` | UUID | ❌ | → `usuarios.usuario_sistema(id)` |
| `atualizado_por_id` | UUID | ❌ | → `usuarios.usuario_sistema(id)` |
| `data_exclusao` | TIMESTAMP | ❌ | — |

### **Índices Únicos:**
- `usuario_sistema_email_key` (email)
- `usuario_sistema_username_key` (username)

### **Gatilhos:**
- `trg_update_data_atualizacao_usuario_sistema` → atualiza `data_atualizacao` automaticamente

---

## 📋 TABELA: `usuarios.usuario_historico_formularios`

### **Campos Principais:**
| Campo | Tipo | Obrigatório | Padrão | Valores Possíveis |
|-------|------|-------------|--------|-------------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | — |
| `usuario_id` | UUID | ✅ | — | → `usuarios.usuario_sistema(id)` |
| `versao_formulario` | INTEGER | ✅ | — | — |

### **Operação:**
| Campo | Tipo | Obrigatório | **VALORES POSSÍVEIS** |
|-------|------|-------------|----------------------|
| `tipo_operacao` | VARCHAR(20) | ✅ | **`CRIACAO`, `ATUALIZACAO`, `EXCLUSAO`, `REATIVACAO`** |
| `operacao_realizada_por_id` | UUID | ✅ | → `usuarios.usuario_sistema(id)` |
| `data_operacao` | TIMESTAMP | ❌ | `CURRENT_TIMESTAMP` |

### **Dados JSON:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `formulario_dados_completos` | JSONB | ✅ | Dados completos do formulário |
| `campos_alterados` | JSONB | ❌ | Campos que foram alterados |
| `valores_anteriores` | JSONB | ❌ | Valores antes da alteração |
| `valores_novos` | JSONB | ❌ | Valores após a alteração |

### **Auditoria Avançada:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `endereco_ip_operacao` | INET | ❌ | IP de onde veio a operação |
| `agente_usuario_operacao` | TEXT | ❌ | User-Agent do navegador |
| `hash_formulario` | VARCHAR(64) | ❌ | Hash dos dados para integridade |

### **Comprovantes:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `numero_comprovante` | VARCHAR(50) | ❌ | Número único do comprovante |
| `comprovante_pdf` | BYTEA | ❌ | PDF do comprovante |
| `comprovante_html` | TEXT | ❌ | HTML do comprovante |
| `assinatura_digital` | JSONB | ❌ | Dados da assinatura digital |

### **Restrições Únicas:**
- `uk_usuario_versao` (usuario_id, versao_formulario)
- `usuario_historico_formularios_numero_comprovante_key` (numero_comprovante)

---

## 📋 TABELA: `cadastro.pessoa_fisica`

### **Identificação:**
| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Chave primária |
| `cpf` | VARCHAR(14) | ✅ | — | CPF único |
| `nome_completo` | VARCHAR(255) | ✅ | — | Nome completo |
| `nome_social` | VARCHAR(255) | ❌ | — | Nome social |

### **Dados Pessoais:**
| Campo | Tipo | **VALORES POSSÍVEIS** |
|-------|------|----------------------|
| `sexo` | VARCHAR(20) | **`MASCULINO`, `FEMININO`, `NAO_BINARIO`, `PREFIRO_NAO_INFORMAR`** |
| `estado_civil` | VARCHAR(30) | **`SOLTEIRO`, `CASADO`, `DIVORCIADO`, `VIUVO`, `UNIAO_ESTAVEL`, `SEPARADO`** |
| `escolaridade` | VARCHAR(30) | **`FUNDAMENTAL`, `MEDIO`, `SUPERIOR`, `POS_GRADUACAO`, `MESTRADO`, `DOUTORADO`** |
| `data_nascimento` | DATE | — |
| `nacionalidade` | VARCHAR(50) | Padrão: `'Brasileira'` |

### **Documentos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rg` | VARCHAR(20) | Número do RG |
| `rg_orgao_expedidor` | VARCHAR(10) | Órgão expedidor do RG |
| `rg_data_expedicao` | DATE | Data de expedição do RG |
| `titulo_eleitor` | VARCHAR(15) | Número do título de eleitor |
| `zona_eleitoral` | VARCHAR(10) | Zona eleitoral |
| `secao_eleitoral` | VARCHAR(10) | Seção eleitoral |
| `pis_pasep` | VARCHAR(15) | Número PIS/PASEP |

### **Contato & Endereço:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `telefone_principal` | VARCHAR(20) | Telefone principal |
| `telefone_secundario` | VARCHAR(20) | Telefone secundário |
| `email_principal` | VARCHAR(255) | Email principal |
| `email_secundario` | VARCHAR(255) | Email secundário |
| `cep` | VARCHAR(10) | CEP |
| `logradouro` | VARCHAR(255) | Endereço |
| `numero` | VARCHAR(20) | Número |
| `complemento` | VARCHAR(100) | Complemento |
| `bairro` | VARCHAR(100) | Bairro |
| `cidade` | VARCHAR(100) | Cidade |
| `estado` | VARCHAR(2) | UF |
| `pais` | VARCHAR(50) | Padrão: `'Brasil'` |
| `coordenadas` | GEOMETRY(Point,4326) | Coordenadas geográficas |

### **Status:**
| Campo | Tipo | Padrão |
|-------|------|--------|
| `ativo` | BOOLEAN | `true` |
| `data_criacao` | TIMESTAMP | `CURRENT_TIMESTAMP` |
| `data_atualizacao` | TIMESTAMP | `CURRENT_TIMESTAMP` |
| `data_exclusao` | TIMESTAMP | — |

---

## 🔗 RELACIONAMENTOS CRÍTICOS

### **usuarios.usuario_sistema:**
- **Referencia:** `cadastro.pessoa_fisica(id)` OU `cadastro.pessoa_juridica(id)` (exclusivo)
- **É referenciado por:** `sigata.documento_base.usuario_upload_id`
- **É referenciado por:** `sigata.relatorio_base.gerado_por_id`

### **Constraint de Exclusividade:**
```sql
CHECK (pessoa_fisica_id IS NOT NULL AND pessoa_juridica_id IS NULL OR 
       pessoa_fisica_id IS NULL AND pessoa_juridica_id IS NOT NULL)
```

---

## 📊 VALORES PADRÃO IMPORTANTES

### **Usuário Sistema:**
- `fuso_horario`: `'America/Sao_Paulo'`
- `idioma`: `'pt-BR'`  
- `tema_interface`: `'light'`
- `ativo`: `true`
- `nivel_acesso`: `1` (mínimo)

### **Pessoa Física:**
- `nacionalidade`: `'Brasileira'`
- `pais`: `'Brasil'`
- `ativo`: `true`
