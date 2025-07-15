# SIGATA - Quick Start Guide

## 🚀 Instalação Rápida (5 minutos)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Redis (opcional, para cache)

### 1. Clone e Configure
```bash
git clone <repository>
cd SIGATA
cp backend/.env.example backend/.env
```

### 2. Configure Banco de Dados
```bash
# Criar banco PostgreSQL
psql -U postgres -f docs/database.sql
```

### 3. Instale Dependências
```bash
cd backend
npm install
```

### 4. Configure OpenAI API
Edite `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

### 5. Execute o Sistema
```bash
npm run dev
```

## 🎯 Uso Básico

### Upload de Documento
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@ata_reuniao.pdf"
```

### Criar Análise
```bash
curl -X POST http://localhost:3000/api/analyses \
  -H "Content-Type: application/json" \
  -d '{"documentId": "uuid-do-documento"}'
```

### Ver Resultado
```bash
curl http://localhost:3000/api/analyses/uuid-da-analise
```

## 📊 API Response Example
```json
{
  "id": "uuid",
  "status": "completed",
  "result": {
    "summary": "Reunião para aprovar orçamento...",
    "keywords": ["orçamento", "aprovação", "projeto"],
    "participants": ["João Silva", "Maria Santos"],
    "decisions": ["Aprovado orçamento de R$ 100k"],
    "actionItems": [
      {
        "item": "Preparar relatório",
        "responsible": "João Silva",
        "deadline": "2025-01-20"
      }
    ]
  }
}
```

## 🐳 Docker (Alternativa)
```bash
docker-compose up -d
```

## 🔧 Troubleshooting

### Erro de Conexão com BD
```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432
```

### Erro OpenAI API
- Verifique se a API key está correta
- Confirme saldo na conta OpenAI

### Erro de Upload
- Verifique permissões da pasta `uploads/`
- Confirme tamanho máximo do arquivo (10MB)

## 📞 Suporte
- Email: suporte@pli.sp.gov.br
- Documentação: ./docs/
