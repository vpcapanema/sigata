#!/bin/bash
echo "SIGATA Advanced 2.0 - Iniciando Sistema..."
echo "================================================"

echo "Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado!"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Python não encontrado!"
    exit 1
fi

echo "Compilando TypeScript..."
cd backend
npx tsc
if [ $? -ne 0 ]; then
    echo "Erro na compilação TypeScript!"
    exit 1
fi

echo "Iniciando servidor SIGATA..."
node dist/index.js
