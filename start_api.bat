@echo off
REM ===================================================
REM SIGATA - Sistema Integrado de Gestão de Atas
REM Script para iniciar servidor Node.js (Monorepo)
REM ===================================================

echo.
echo ========================================
echo 🏛️  SIGATA - PLI São Paulo
echo 🚀 Iniciando servidor Node.js...
echo ========================================
echo.

REM Mudar para o diretório do projeto
cd /d "D:\SEMIL\PLI\SIGATA"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo ❌ Dependências não encontradas!
    echo � Instalando dependências Node.js...
    npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
)

REM Iniciar o servidor de desenvolvimento
echo 🚀 Iniciando servidor Node.js...
echo 📍 API disponível em: http://localhost:3001
echo 📍 Health check: http://localhost:3001/health
echo.
echo ⚠️  Pressione Ctrl+C para parar o servidor
echo.

npm run dev

pause
