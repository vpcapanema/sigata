@echo off
echo SIGATA Advanced 2.0 - Iniciando Sistema...
echo ================================================

echo Verificando dependências...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js não encontrado!
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python não encontrado!
    pause
    exit /b 1
)

echo Compilando TypeScript...
cd backend
npx tsc
if %errorlevel% neq 0 (
    echo Erro na compilação TypeScript!
    pause
    exit /b 1
)

echo Iniciando servidor SIGATA...
node dist/index.js

pause
