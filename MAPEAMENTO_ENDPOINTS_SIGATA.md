# 🗺️ MAPEAMENTO COMPLETO DOS ENDPOINTS - SIGATA

**Data:** 20 de julho de 2025  
**Versão:** 2.0.0 MODULAR  
**Arquitetura:** Backend Node.js + Frontend HTML

---

## 📍 **ONDE ESTÃO ARMAZENADOS OS ENDPOINTS**

### 1. **🎯 Backend - Definição Real** (Fonte da Verdade)
```
src/routes/
├── index.ts           # 🌐 Agregador principal de rotas
├── auth.routes.ts     # 🔐 Rotas de autenticação  
├── document.routes.ts # 📄 Rotas de documentos
├── analytics.routes.ts# 📊 Rotas de analytics/estatísticas
└── admin.routes.ts    # ⚙️ Rotas administrativas
```

### 2. **🌐 Frontend - Configuração de API**
```
frontend_html/js/
└── api-config.js      # ⚙️ Configuração centralizada das URLs
```

### 3. **📱 Frontend - Uso Direto nas Páginas**
```
frontend_html/
├── login.html         # URLs hardcoded no JavaScript
├── dashboard.html     # URLs hardcoded no JavaScript  
├── reports.html       # URLs hardcoded no JavaScript
├── analytics.html     # URLs hardcoded no JavaScript
└── documents.html     # URLs hardcoded no JavaScript
```

---

## 🔗 **ENDPOINTS COMPLETOS DISPONÍVEIS**

### 🔐 **Autenticação** (`/auth/*`)
```typescript
// Arquivo: src/routes/auth.routes.ts
POST   /auth/login     # Login com email/senha
POST   /auth/logout    # Logout do usuário  
GET    /auth/me        # Dados do usuário atual
```

### 📄 **Documentos** (`/documents/*`)
```typescript
// Arquivo: src/routes/document.routes.ts
POST   /documents/upload           # Upload de novo documento
GET    /documents/                 # Listar todos os documentos
GET    /documents/complete-view    # Visão completa dos documentos
GET    /documents/:id/analysis     # Análise de documento específico
```

### 📊 **Analytics** (`/api/*`)
```typescript
// Arquivo: src/routes/analytics.routes.ts
GET    /api/stats/basico              # Estatísticas básicas
GET    /api/dashboard/:userId         # Dashboard do usuário
GET    /api/relatorios/resultados     # Resultados de relatórios
GET    /api/analysis                  # Dados de análise geral
GET    /api/reports/advanced          # Relatórios avançados
```

### ⚙️ **Administrativo** (`/api/*`)
```typescript
// Arquivo: src/routes/admin.routes.ts  
GET    /api/test-db                      # Teste de conexão BD
GET    /api/schema/sigata                # Schema do banco SIGATA
GET    /api/schema/table/:schema/:table  # Estrutura de tabela específica
GET    /api/usuarios                     # Lista de usuários
```

### 🏥 **Sistema** (Definido em `src/index.ts`)
```typescript
GET    /health         # Health check do sistema
```

---

## 📋 **MAPEAMENTO DETALHADO POR ARQUIVO**

### 🌐 **src/routes/index.ts** - Agregador Principal
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';           // /auth/*
import documentRoutes from './document.routes';   // /documents/*  
import analyticsRoutes from './analytics.routes'; // /api/* (analytics)
import adminRoutes from './admin.routes';         // /api/* (admin)

const router = Router();

router.use('/auth', authRoutes);        # Prefixo: /auth
router.use('/documents', documentRoutes); # Prefixo: /documents
router.use('/api', analyticsRoutes);    # Prefixo: /api (analytics)
router.use('/api', adminRoutes);        # Prefixo: /api (admin)
```

### 🔐 **src/routes/auth.routes.ts** - Autenticação
```typescript
router.post('/login', authController.login);    # POST /auth/login
router.post('/logout', authController.logout);  # POST /auth/logout  
router.get('/me', authController.me);           # GET /auth/me
```

### 📄 **src/routes/document.routes.ts** - Documentos
```typescript
router.post('/upload', uploadMiddleware.single('document'), documentController.upload);
# POST /documents/upload

router.get('/', documentController.list);
# GET /documents/

router.get('/complete-view', documentController.completeView);
# GET /documents/complete-view

router.get('/:id/analysis', documentController.getAnalysis);
# GET /documents/:id/analysis
```

### 📊 **src/routes/analytics.routes.ts** - Analytics
```typescript
router.get('/stats/basico', analyticsController.basicStats);
# GET /api/stats/basico

router.get('/dashboard/:userId', analyticsController.userDashboard);  
# GET /api/dashboard/:userId

router.get('/relatorios/resultados', analyticsController.reportResults);
# GET /api/relatorios/resultados

router.get('/analysis', analyticsController.analysis);
# GET /api/analysis

router.get('/reports/advanced', analyticsController.advancedReport);
# GET /api/reports/advanced
```

### ⚙️ **src/routes/admin.routes.ts** - Administrativo
```typescript
router.get('/test-db', adminController.testDatabase);
# GET /api/test-db

router.get('/schema/sigata', adminController.sigataSchema);
# GET /api/schema/sigata

router.get('/schema/table/:schema/:table', adminController.tableStructure);
# GET /api/schema/table/:schema/:table

router.get('/usuarios', adminController.listUsers);
# GET /api/usuarios
```

---

## ⚙️ **CONFIGURAÇÃO FRONTEND**

### 📁 **frontend_html/js/api-config.js** - Configuração Centralizada
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    
    ENDPOINTS: {
        // Autenticação
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout', 
        ME: '/auth/me',
        
        // Documentos
        DOCUMENTS: '/documents/',
        DOCUMENTS_UPLOAD: '/documents/upload',
        
        // Analytics
        ANALYSES: '/api/analysis',
        STATS_BASICO: '/api/stats/basico',
        
        // Admin
        USERS: '/api/usuarios',
        SCHEMA: '/api/schema/:schema',
        
        // Sistema
        HEALTH: '/health'
    }
}
```

### 📱 **Uso nas Páginas HTML**
```javascript
// login.html
fetch('http://localhost:3001/auth/login', { ... })

// dashboard.html  
fetch('http://localhost:3001/api/stats/basico', { ... })

// reports.html
fetch('http://localhost:3001/documents/', { ... })
fetch('http://localhost:3001/api/usuarios', { ... })

// analytics.html
fetch('http://localhost:3001/api/analysis', { ... })
```

---

## 🔄 **FLUXO DE ROTEAMENTO**

### 1. **Requisição Chega no Servidor**
```
http://localhost:3001/api/stats/basico
                     ↓
                src/index.ts (servidor principal)
                     ↓  
                routes/index.ts (agregador)
                     ↓
                analytics.routes.ts (/api/*)
                     ↓
                AnalyticsController.basicStats()
```

### 2. **Estrutura de Middleware**
```
Request → CORS → Body Parser → Routes → Controller → Response
```

---

## 🧪 **ENDPOINTS TESTADOS E FUNCIONAIS**

### ✅ **Funcionando 100%**
```bash
GET  /health                  # ✅ Status do sistema
POST /auth/login              # ✅ Login com JWT
GET  /api/stats/basico        # ✅ Estatísticas básicas
GET  /documents/              # ✅ Lista de documentos
GET  /api/analysis            # ✅ Dados de análise
GET  /api/usuarios            # ✅ Lista de usuários
GET  /api/schema/sigata       # ✅ Schema do banco
```

### 🔧 **A Serem Implementados/Testados**
```bash
POST /documents/upload        # 🔧 Upload real de arquivos
GET  /documents/:id/analysis  # 🔧 Análise específica
GET  /api/reports/advanced    # 🔧 Relatórios avançados
```

---

## 🚨 **PROBLEMAS COMUNS ENCONTRADOS**

### ❌ **URLs Incorretas no Frontend**
```javascript
// ❌ ERRO COMUM
fetch('http://localhost:3001/api/auth/login')  // Duplica /api

// ✅ CORRETO  
fetch('http://localhost:3001/auth/login')      // Rota real
```

### ❌ **Endpoints Não Existentes**
```javascript
// ❌ TENTATIVAS QUE NÃO FUNCIONAM
/admin/users        # Não existe (deveria ser /api/usuarios)
/api/documents      # Não existe (deveria ser /documents/)
/system/health      # Não existe (deveria ser /health)
```

---

## 📊 **ESTATÍSTICAS DOS ENDPOINTS**

### **Por Módulo:**
- **Autenticação:** 3 endpoints
- **Documentos:** 4 endpoints  
- **Analytics:** 5 endpoints
- **Admin:** 4 endpoints
- **Sistema:** 1 endpoint
- **Total:** 17 endpoints ativos

### **Por Método HTTP:**
- **GET:** 13 endpoints (76%)
- **POST:** 4 endpoints (24%)
- **PUT/DELETE:** 0 endpoints (0%)

---

## 🎯 **RECOMENDAÇÕES**

### 1. **Centralização**
- ✅ Usar sempre `api-config.js` para URLs
- ❌ Evitar URLs hardcoded nas páginas

### 2. **Padrões**
- ✅ Seguir padrão REST: `/resource` e `/resource/:id`
- ✅ Usar prefixos consistentes (`/api`, `/auth`, `/documents`)

### 3. **Documentação**
- ✅ Manter este mapeamento atualizado
- ✅ Documentar parâmetros e respostas

### 4. **Testes**
- ✅ Testar todos os endpoints com curl/Postman
- ✅ Validar integrações frontend-backend

---

## 🔍 **COMO ENCONTRAR UM ENDPOINT**

### **1. Backend (Implementação Real)**
```bash
# Buscar por rota específica
grep -r "stats/basico" src/routes/
# Resultado: src/routes/analytics.routes.ts

# Buscar por método
grep -r "router.get" src/routes/
```

### **2. Frontend (Configuração)**
```bash
# Ver configuração
cat frontend_html/js/api-config.js

# Buscar uso em páginas
grep -r "fetch(" frontend_html/
```

### **3. Teste Rápido**
```bash
# Testar endpoint
curl http://localhost:3001/health
curl http://localhost:3001/api/stats/basico
```

---

**Agora você sabe exatamente onde encontrar e como usar todos os endpoints do SIGATA! 🎯**

---
*Mapeamento completo atualizado em 20 de julho de 2025*  
*SIGATA v2.0.0 - Arquitetura Modular*
