@echo off
REM ===================================================
REM SIGATA - Sistema Integrado de Gestão de Atas
REM Script para ativar ambiente virtual e iniciar API
REM ===================================================

echo.
echo ========================================
echo 🏛️  SIGATA - PLI São Paulo
echo 🚀 Iniciando servidor da API...
echo ========================================
echo.

REM Mudar para o diretório do projeto
cd /d "D:\SEMIL\PLI\SIGATA"

REM Verificar se o ambiente virtual existe
if not exist "venv" (
    echo ❌ Ambiente virtual não encontrado!
    echo 🔧 Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Erro ao criar ambiente virtual!
        pause
        exit /b 1
    )
    echo ✅ Ambiente virtual criado!
)

REM Ativar ambiente virtual
echo 🔄 Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Atualizar pip
echo 📦 Atualizando pip...
python -m pip install --upgrade pip

REM Instalar dependências se existir requirements.txt
if exist "requirements.txt" (
    echo 📥 Instalando dependências Python...
    pip install -r requirements.txt
    echo ✅ Dependências instaladas!
) else (
    echo ⚠️  Arquivo requirements.txt não encontrado
)

REM Instalar Flask básico se necessário
pip install flask flask-cors

REM Iniciar a API
echo 🚀 Iniciando API...
echo 📍 API disponível em: http://localhost:5000
echo 📍 Health check: http://localhost:5000/health
echo.
echo ⚠️  Pressione Ctrl+C para parar o servidor
echo.

python start_api.py

pause
