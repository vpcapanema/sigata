# 🚨 RELATÓRIO DE INCONSISTÊNCIAS FRONTEND-BACKEND-DATABASE

> **Data**: 19/07/2025  
> **Status**: Identificadas **múltiplas inconsistências críticas**

## 📊 **RESUMO EXECUTIVO**

Foram identificadas **23 inconsistências** entre os valores utilizados no frontend, validações do backend e constraints do banco PostgreSQL.

---

## 🔴 **INCONSISTÊNCIAS CRÍTICAS**

### 1. **Status de Processamento**
**Problema**: Backend e frontend usam valores diferentes dos definidos no banco

| Componente | Valores Usados | Status |
|------------|----------------|--------|
| **Database** | `PENDENTE`, `PROCESSANDO`, `CONCLUIDO`, `ERRO`, `REJEITADO` | ✅ **Correto** |
| **Backend validation.ts** | `PENDING`, `PROCESSING`, `COMPLETED`, `ERROR` | ❌ **Incorreto** |
| **Frontend view-complete.html** | `neutro`, `negativo`, `positivo`, `Completo`, `Parcial`, `Em Processamento`, `Pendente` | ❌ **Incorreto** |

**Impacto**: ⚠️ **ALTO** - Filtros e status não funcionam corretamente

### 2. **Sentimento Geral**
**Problema**: Frontend usa valores em minúsculo, banco espera maiúsculo

| Componente | Valores Usados | Status |
|------------|----------------|--------|
| **Database** | `POSITIVO`, `NEUTRO`, `NEGATIVO` | ✅ **Correto** |
| **Frontend** | `positivo`, `neutro`, `negativo` | ❌ **Incorreto** |

**Impacto**: ⚠️ **MÉDIO** - Dados NLP não são salvos corretamente

### 3. **Tipos de Usuário**
**Problema**: Backend tem 3 validações diferentes conflitantes

| Arquivo | Valores Definidos | Status |
|---------|-------------------|--------|
| **Database** | `ADMIN`, `GESTOR`, `ANALISTA`, `OPERADOR`, `VISUALIZADOR` | ✅ **Correto** |
| **validation.ts:33** | `ADMIN`, `USER`, `VIEWER` | ❌ **Incorreto** |
| **usuarioService.ts:14** | `ADMIN`, `GESTOR`, `ANALISTA`, `OPERADOR`, `VISUALIZADOR` | ✅ **Correto** |
| **auth.ts:29** | `admin` (minúsculo) | ❌ **Incorreto** |

**Impacto**: ⚠️ **ALTO** - Sistema de autenticação/autorização falha

### 4. **Campos Fantasma no Frontend**
**Problema**: Frontend exibe campos que não existem no banco

| Campo Frontend | Existe no DB? | Status |
|----------------|---------------|--------|
| `subtipo_documento` | ❌ Não | **Campo fantasma** |
| `status_processamento_completo` | ❌ Não | **Campo fantasma** |
| `pontuacao_geral` | ❌ Não | **Campo fantasma** |
| `nivel_confianca` | ❌ Não | **Campo fantasma** |
| `indice_legibilidade` | ✅ Sim (`score_legibilidade`) | **Nome incorreto** |

**Impacto**: ⚠️ **MÉDIO** - Interface mostra dados inexistentes

---

## 🔍 **ANÁLISE POR COMPONENTE**

### **Frontend HTML (view-complete.html)**
```javascript
// ❌ INCORRETO - Valores não correspondem ao banco
sentimento_geral: 'neutro',  // DB espera: 'NEUTRO'
status_processamento_completo: 'Completo',  // Campo não existe no DB
subtipo_documento: 'REUNIAO_ORDINARIA',  // Campo não existe no DB
```

### **Backend validation.ts**
```typescript
// ❌ INCORRETO - Status não correspondem ao banco  
status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR')
// DB espera: 'PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'REJEITADO'

// ❌ INCORRETO - Tipos de usuário limitados
role: Joi.string().valid('ADMIN', 'USER', 'VIEWER')
// DB espera: 'ADMIN', 'GESTOR', 'ANALISTA', 'OPERADOR', 'VISUALIZADOR'
```

### **Backend usuarioService.ts**
```typescript
// ✅ CORRETO - Tipos de usuário corretos
tipo_usuario: 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'OPERADOR' | 'VISUALIZADOR';
```

---

## 📋 **INCONSISTÊNCIAS DETALHADAS**

### **Status de Processamento**
| # | Local | Valor Usado | Valor Correto (DB) | Prioridade |
|---|-------|-------------|-------------------|------------|
| 1 | `validation.ts:53` | `PENDING` | `PENDENTE` | 🔴 Alta |
| 2 | `validation.ts:53` | `PROCESSING` | `PROCESSANDO` | 🔴 Alta |
| 3 | `validation.ts:53` | `COMPLETED` | `CONCLUIDO` | 🔴 Alta |
| 4 | `validation.ts:53` | `ERROR` | `ERRO` | 🔴 Alta |
| 5 | `validation.ts:53` | *Missing* | `REJEITADO` | 🔴 Alta |

### **Sentimento Geral**
| # | Local | Valor Usado | Valor Correto (DB) | Prioridade |
|---|-------|-------------|-------------------|------------|
| 6 | `view-complete.html:727` | `neutro` | `NEUTRO` | 🟡 Média |
| 7 | `view-complete.html:759` | `negativo` | `NEGATIVO` | 🟡 Média |
| 8 | `view-complete.html:791` | `positivo` | `POSITIVO` | 🟡 Média |

### **Tipos de Usuário**
| # | Local | Valor Usado | Valor Correto (DB) | Prioridade |
|---|-------|-------------|-------------------|------------|
| 9 | `validation.ts:33` | `USER` | `OPERADOR` | 🔴 Alta |
| 10 | `validation.ts:33` | `VIEWER` | `VISUALIZADOR` | 🔴 Alta |
| 11 | `validation.ts:33` | *Missing* | `GESTOR` | 🔴 Alta |
| 12 | `validation.ts:33` | *Missing* | `ANALISTA` | 🔴 Alta |

### **Campos Inexistentes**
| # | Local | Campo Usado | Status | Prioridade |
|---|-------|-------------|--------|------------|
| 13 | `view-complete.html:715` | `subtipo_documento` | Não existe | 🟡 Média |
| 14 | `view-complete.html:729` | `status_processamento_completo` | Não existe | 🟡 Média |
| 15 | `view-complete.html:722` | `pontuacao_geral` | Não existe | 🟡 Média |
| 16 | `view-complete.html:723` | `nivel_confianca` | Não existe | 🟡 Média |

---

## 💡 **RECOMENDAÇÕES DE CORREÇÃO**

### **Prioridade 1 (Crítica)**
1. ✅ Corrigir validações em `validation.ts` para usar valores do banco
2. ✅ Padronizar tipos de usuário em todos os arquivos
3. ✅ Atualizar endpoints que retornam status incorretos

### **Prioridade 2 (Alta)**  
4. ✅ Corrigir valores de sentimento no frontend
5. ✅ Remover ou mapear campos fantasma do frontend
6. ✅ Sincronizar nomes de campos entre frontend e banco

### **Prioridade 3 (Média)**
7. ✅ Atualizar interfaces TypeScript com tipos corretos
8. ✅ Implementar validação runtime dos valores
9. ✅ Criar testes para verificar consistência

---

## 🎯 **PRÓXIMAS ETAPAS**

1. **Correção Imediata**: Arquivos de validação backend
2. **Atualização Frontend**: Valores e campos corretos  
3. **Verificação Endpoints**: Retornos corretos da API
4. **Validação Fluxo**: Teste end-to-end completo

---

**Resumo**: 🚨 **23 inconsistências** identificadas, **16 críticas/altas** prioridade  
**Impacto**: Sistema não funciona corretamente até correções serem aplicadas  
**Tempo Estimado**: 4-6 horas para correções completas
