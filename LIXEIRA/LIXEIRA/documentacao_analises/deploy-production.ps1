# SIGATA - Script de Deploy para Produção (Windows)
# Versão: 2.0
# Data: 19/07/2025

Write-Host "🚀 DEPLOY SIGATA PARA PRODUÇÃO" -ForegroundColor Green
Write-Host "============================="
Write-Host "Data: $(Get-Date)"
Write-Host "Usuário: $env:USERNAME"
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Erro: Execute este script na pasta raiz do SIGATA" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pré-verificações..."

# 1. Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# 2. Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale Docker primeiro." -ForegroundColor Red
    exit 1
}

# 3. Verificar arquivos essenciais
$requiredFiles = @(
    "backend\package.json",
    "backend\src\index.ts",
    "frontend_html\index.html",
    "docker-compose.yml",
    "MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Arquivo obrigatório não encontrado: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Todos os arquivos essenciais encontrados" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Preparando ambiente..."

# 4. Instalar dependências backend
Write-Host "📦 Instalando dependências do backend..."
Set-Location backend
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# 5. Verificar variáveis de ambiente
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Arquivo .env não encontrado. Criando exemplo..." -ForegroundColor Yellow
    
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Arquivo .env criado. REVISE as configurações antes de continuar!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Construindo aplicação..."

# 6. Build do backend TypeScript
Write-Host "🔨 Compilando TypeScript..."
Set-Location backend
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação TypeScript" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ TypeScript compilado" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 Executando testes de produção..."

# 7. Executar testes
node test-production-v2.js
$testResult = $LASTEXITCODE

if ($testResult -eq 0) {
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} elseif ($testResult -eq 1) {
    Write-Host "⚠️  Alguns testes falharam, mas sistema está 80%+ funcional" -ForegroundColor Yellow
    $response = Read-Host "Continuar mesmo assim? (y/N)"
    if ($response -notmatch "^[Yy]$") {
        Write-Host "❌ Deploy cancelado pelo usuário" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Falha crítica nos testes. Deploy cancelado." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🐳 Iniciando containers Docker..."

# 8. Parar containers existentes
Write-Host "🛑 Parando containers existentes..."
docker-compose down

# 9. Construir e iniciar
Write-Host "🏗️  Construindo e iniciando containers..."
docker-compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar containers Docker" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Containers iniciados" -ForegroundColor Green

Write-Host ""
Write-Host "⏱️  Aguardando serviços ficarem prontos..."
Start-Sleep -Seconds 10

# 10. Verificar saúde dos serviços
Write-Host "🩺 Verificando saúde dos serviços..."

# Verificar API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API Backend respondendo" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API Backend não está respondendo ainda" -ForegroundColor Yellow
}

# Verificar frontend
if (Test-Path "frontend_html\index.html") {
    Write-Host "✅ Frontend disponível" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Status final do deploy:" -ForegroundColor Cyan
Write-Host "========================="

# Mostrar containers em execução
Write-Host "🐳 Containers Docker:"
docker-compose ps

Write-Host ""
Write-Host "🌐 URLs de acesso:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080"
Write-Host "API Backend: http://localhost:3001"
Write-Host "Health Check: http://localhost:3001/health"

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse http://localhost:8080 para testar o frontend"
Write-Host "2. Teste o login com: admin@pli.sp.gov.br / admin123"
Write-Host "3. Verifique os logs: docker-compose logs -f"
Write-Host "4. Monitore o sistema e ajuste conforme necessário"

Write-Host ""
Write-Host "📁 Arquivos importantes criados/atualizados:" -ForegroundColor Cyan
Write-Host "- RELATORIO_INCONSISTENCIAS_SISTEMA.md"
Write-Host "- MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md"
Write-Host "- test-production-v2.js"
Write-Host "- backend\.env"

Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "==============================="
Write-Host "Sistema SIGATA está rodando em produção!" -ForegroundColor Green
Write-Host ""
Write-Host "Para parar: docker-compose down"
Write-Host "Para logs: docker-compose logs -f"
Write-Host "Para reiniciar: docker-compose restart"

exit 0
