# SIGATA - Sistema Integrado de Gestão de Atas

## 🎯 Visão Geral
Sistema completo para processamento e análise de atas de reunião usando NLP avançado.

## 🏗️ Arquitetura
- **Backend**: Node.js + TypeScript + Express
- **NLP**: OpenAI GPT + Regex patterns  
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Frontend**: React + TypeScript

## ⚡ Instalação Rápida

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend  
```bash
cd frontend
npm install
npm start
```

## 📊 Funcionalidades Principais

### 🔍 Extração de Informações
- ✅ Resumos automáticos
- ✅ Palavras-chave relevantes
- ✅ Entidades (pessoas, datas, organizações)
- ✅ Análise de sentimento
- ✅ Participantes da reunião
- ✅ Decisões tomadas
- ✅ Itens de ação com responsáveis
- ✅ Dados da reunião (data, local, duração)

### 📈 Métricas e Relatórios
- ✅ Métricas de confiança
- ✅ Taxa de precisão
- ✅ Relatórios analíticos
- ✅ Dashboard executivo

## 🚀 API Endpoints

### Documentos
- `POST /api/documents/upload` - Upload de documento
- `GET /api/documents` - Lista documentos
- `GET /api/documents/:id` - Detalhes do documento

### Análises
- `POST /api/analyses` - Criar análise
- `GET /api/analyses` - Lista análises
- `GET /api/analyses/:id` - Resultado da análise

### Relatórios
- `GET /api/reports/metrics` - Métricas do sistema
- `GET /api/reports/export` - Exportar relatórios

## 🔧 Configuração

### Variáveis de Ambiente
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/sigata
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret
```

## 📦 Dependências
- express
- prisma
- openai
- redis
- pdf-parse
- mammoth
- multer

## 🛠️ Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar testes
npm test
```

## 📋 TODO
- [ ] Configurar banco PostgreSQL
- [ ] Implementar autenticação JWT
- [ ] Criar interface web
- [ ] Testes automatizados
- [ ] Docker compose
- [ ] Deploy em produção

## 👥 Equipe PLI-SP
Sistema desenvolvido para o Programa de Localização de Indústrias de São Paulo.
