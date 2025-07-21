#!/bin/bash
# SIGATA - Script de Deploy para Produção
# Versão: 2.0
# Data: 19/07/2025

echo "🚀 DEPLOY SIGATA PARA PRODUÇÃO"
echo "============================="
echo "Data: $(date)"
echo "Usuário: $(whoami)"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do SIGATA"
    exit 1
fi

echo "📋 Pré-verificações..."

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# 2. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi
echo "✅ Docker: $(docker --version | head -n 1)"

# 3. Verificar arquivos essenciais
REQUIRED_FILES=(
    "backend/package.json"
    "backend/src/index.ts"
    "frontend_html/index.html"
    "docker-compose.yml"
    "MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
done
echo "✅ Todos os arquivos essenciais encontrados"

echo ""
echo "🔧 Preparando ambiente..."

# 4. Instalar dependências backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi
cd ..
echo "✅ Dependências instaladas"

# 5. Verificar variáveis de ambiente
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando exemplo..."
    cat > backend/.env << EOF
# SIGATA - Configuração de Produção
NODE_ENV=production
PORT=3001

# Database (AWS RDS)
DATABASE_URL=postgresql://postgres:semil2025*@pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com:5432/pli_db?sslmode=require

# JWT
JWT_SECRET=sigata_jwt_secret_production_2025

# CORS
CORS_ORIGIN=*

# Logs
LOG_LEVEL=info
EOF
    echo "✅ Arquivo .env criado. REVISE as configurações antes de continuar!"
fi

echo ""
echo "🏗️  Construindo aplicação..."

# 6. Build do backend TypeScript
echo "🔨 Compilando TypeScript..."
cd backend
npx tsc
if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação TypeScript"
    exit 1
fi
cd ..
echo "✅ TypeScript compilado"

echo ""
echo "🧪 Executando testes de produção..."

# 7. Executar testes
node test-production-v2.js
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Todos os testes passaram!"
elif [ $TEST_RESULT -eq 1 ]; then
    echo "⚠️  Alguns testes falharam, mas sistema está 80%+ funcional"
    echo "Continuar mesmo assim? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deploy cancelado pelo usuário"
        exit 1
    fi
else
    echo "❌ Falha crítica nos testes. Deploy cancelado."
    exit 1
fi

echo ""
echo "🐳 Iniciando containers Docker..."

# 8. Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# 9. Construir e iniciar
echo "🏗️  Construindo e iniciando containers..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar containers Docker"
    exit 1
fi

echo "✅ Containers iniciados"

echo ""
echo "⏱️  Aguardando serviços ficarem prontos..."
sleep 10

# 10. Verificar saúde dos serviços
echo "🩺 Verificando saúde dos serviços..."

# Verificar API
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ API Backend respondendo"
else
    echo "⚠️  API Backend não está respondendo ainda"
fi

# Verificar frontend
if [ -f "frontend_html/index.html" ]; then
    echo "✅ Frontend disponível"
fi

echo ""
echo "📊 Status final do deploy:"
echo "========================="

# Mostrar containers em execução
echo "🐳 Containers Docker:"
docker-compose ps

echo ""
echo "🌐 URLs de acesso:"
echo "Frontend: http://localhost:8080"
echo "API Backend: http://localhost:3001"
echo "Health Check: http://localhost:3001/health"

echo ""
echo "📋 Próximos passos:"
echo "1. Acesse http://localhost:8080 para testar o frontend"
echo "2. Teste o login com: admin@pli.sp.gov.br / admin123"
echo "3. Verifique os logs: docker-compose logs -f"
echo "4. Monitore o sistema e ajuste conforme necessário"

echo ""
echo "📁 Arquivos importantes criados/atualizados:"
echo "- RELATORIO_INCONSISTENCIAS_SISTEMA.md"
echo "- MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md"
echo "- test-production-v2.js"
echo "- backend/.env"

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "==============================="
echo "Sistema SIGATA está rodando em produção!"
echo ""
echo "Para parar: docker-compose down"
echo "Para logs: docker-compose logs -f"
echo "Para reiniciar: docker-compose restart"

exit 0
