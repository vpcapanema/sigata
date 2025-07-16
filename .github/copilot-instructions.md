# SIGATA - Instruções para Agentes de IA

## 🏗️ Arquitetura do Sistema

**SIGATA** é um sistema híbrido para processamento de atas de reunião com duas arquiteturas:
- **Moderna**: React + TypeScript + Vite (`frontend/`) com Node.js + Express + Prisma (`backend/`)
- **HTML/CSS**: Interface simplificada (`frontend_html/`) para prototipagem rápida

O sistema processa documentos PDF/DOCX extraindo informações via NLP (OpenAI GPT).

### Componentes Principais
- **Backend**: Express.js com TypeScript, Prisma ORM, PostgreSQL
- **Frontend React**: React 18 + TypeScript + Vite + TailwindCSS + React Query
- **Frontend HTML**: Bootstrap 5 + Vanilla JS para prototipagem
- **Database**: PostgreSQL com 11 tabelas SIGATA + views otimizadas
- **Storage**: AWS RDS (produção) via SSL, uploads locais em desenvolvimento

## 🚀 Fluxos de Desenvolvimento

### Inicialização Rápida
```bash
# Backend (porta 3001)
cd backend && npm install && npm run dev

# Frontend React (porta 5173)
cd frontend && npm install && npm run dev

# Frontend HTML (porta 3000) - via proxy
npm run start:frontend-html
```

### Scripts Essenciais
- `npm run dev` - Desenvolvimento com hot reload
- `npm run db:migrate` - Migrar schema Prisma
- `npm run db:studio` - Interface visual do banco
- `start_api.bat` - Iniciar backend (Windows)

## 🎨 Sistema de Cores PLI

O projeto usa **identidade visual específica do PLI** com gradientes complexos:
- Use `sistema_aplicacao_cores_pli.css` para cores institucionais
- **NUNCA** usar cores genéricas - sempre as variáveis CSS PLI
- Gradiente principal apenas em headers/footers: `--pli-gradient-main`
- Classes específicas: `.pli-navbar`, `.pli-footer`, `.pli-button`

```css
/* Correto */
background: var(--pli-verde-principal);
color: var(--pli-azul-escuro);

/* Incorreto */
background: #28a745;
```

## 🔧 Padrões Específicos do Projeto

### Estrutura de Arquivos
- Controllers seguem padrão: `users`, `documents`, `analytics`
- Frontend HTML usa Bootstrap 5 + ícones Font Awesome
- Frontend React usa Headless UI + Lucide icons
- Tipos TypeScript em `backend/src/types/`

### Autenticação
- JWT com bcrypt para senhas
- Token armazenado em `localStorage` (frontend HTML)
- Headers: `Authorization: Bearer <token>`
- Middleware de autenticação em `backend/src/middleware/auth.ts`

### Upload de Documentos
```typescript
// Padrão de processamento (backend/src/services/)
1. Upload → multer (temp storage)
2. Extração → pdf-parse/mammoth
3. NLP → OpenAI GPT
4. Persistência → Prisma (tabelas documento_base + documento_arquivo)
```

### Database Schema Crítico
```sql
-- Tabelas principais interconectadas
sigata.usuario (autenticação)
sigata.documento_base (metadados)
sigata.documento_arquivo (binários)
sigata.analise_documento (resultados NLP)
sigata.participante_reuniao (pessoas)
```

## 🛠️ Convenções de Código

### Backend (Node.js + TypeScript)
- Async/await obrigatório (não Promises)
- Validação com Joi antes de Prisma
- Error handling centralizado via middleware
- Rate limiting configurado (100 req/15min)

### Frontend HTML (Prototipagem)
- Bootstrap 5 para layout responsivo
- Vanilla JS modular em `<script>` tags
- Mock data para desenvolvimento rápido
- Charts.js para gráficos (dashboard)

### Frontend React (Produção)
- React Query para state management
- React Hook Form + Zod para validação
- Framer Motion para animações
- Axios para API calls

## ⚠️ Pontos Críticos

### Estado Atual (Julho 2025)
- ✅ Backend funcionando (porta 3001)
- ✅ Banco PostgreSQL AWS RDS conectado
- ✅ Sistema de usuários completo
- ❌ Upload real (ainda em mock)
- ❌ NLP processing (placeholder)

### Debugging
- Logs em `backend/logs/`
- Health check: `GET /health`
- Database: `npm run db:studio`
- AWS RDS via SSL (não localhost)

### Performance
- Prisma com indexes otimizados
- Redis para cache (opcional)
- Rate limiting ativo
- Compression middleware habilitado
