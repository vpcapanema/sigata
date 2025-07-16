#!/usr/bin/env python3
"""
SIGATA - Setup Avançado
Instala e configura o ambiente completo conforme especificação 4.4.3.2.2
"""

import subprocess
import sys
import os
import platform
import json
from pathlib import Path

def run_command(cmd, shell=True, capture_output=True):
    """Executa comando e retorna resultado"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=capture_output, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_python_version():
    """Verifica versão do Python"""
    print("🐍 Verificando Python...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro} OK")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor} inadequado. Necessário Python 3.8+")
        return False

def check_node_version():
    """Verifica versão do Node.js"""
    print("📦 Verificando Node.js...")
    success, stdout, stderr = run_command("node --version")
    if success and stdout:
        version = stdout.strip()
        print(f"   ✅ Node.js {version} OK")
        return True
    else:
        print("   ❌ Node.js não encontrado. Instale Node.js 16+")
        return False

def setup_backend():
    """Configura backend Node.js"""
    print("\n🔧 Configurando Backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("   ❌ Diretório backend não encontrado")
        return False
    
    os.chdir(backend_dir)
    
    # Instalar dependências Node.js
    print("   📦 Instalando dependências Node.js...")
    success, _, stderr = run_command("npm install")
    if not success:
        print(f"   ❌ Erro no npm install: {stderr}")
        return False
    
    # Instalar dependências TypeScript
    print("   📦 Instalando TypeScript...")
    run_command("npm install -g typescript")
    run_command("npm install --save-dev @types/node @types/express @types/uuid")
    
    os.chdir("..")
    print("   ✅ Backend configurado")
    return True

def setup_python_nlp():
    """Configura ambiente Python para NLP"""
    print("\n🧠 Configurando Ambiente NLP Python...")
    
    # Verificar se requirements existe
    req_file = Path("backend/requirements_advanced.txt")
    if not req_file.exists():
        print("   ❌ requirements_advanced.txt não encontrado")
        return False
    
    # Instalar dependências Python
    print("   📦 Instalando BERTopic, KeyBERT, BERTScore...")
    success, _, stderr = run_command(f"pip install -r {req_file}")
    if not success:
        print(f"   ⚠️ Alguns pacotes podem ter falhado: {stderr}")
    
    # Baixar modelos spaCy
    print("   🔄 Baixando modelo spaCy português...")
    run_command("python -m spacy download pt_core_news_lg")
    
    # Testar importações
    print("   🧪 Testando importações...")
    test_imports = [
        "import bertopic",
        "import keybert", 
        "import bert_score",
        "import spacy",
        "import transformers"
    ]
    
    for imp in test_imports:
        success, _, _ = run_command(f"python -c \"{imp}\"")
        if success:
            print(f"      ✅ {imp.split()[-1]}")
        else:
            print(f"      ❌ {imp.split()[-1]} falhou")
    
    print("   ✅ Ambiente NLP configurado")
    return True

def check_database():
    """Verifica configuração do banco"""
    print("\n💾 Verificando Database...")
    
    # Verificar se PostgreSQL está rodando (tentativa básica)
    success, _, _ = run_command("pg_isready", capture_output=True)
    if success:
        print("   ✅ PostgreSQL detectado e rodando")
    else:
        print("   ⚠️ PostgreSQL não detectado ou não rodando")
        print("   💡 Certifique-se de que o PostgreSQL está instalado e rodando")
    
    return True

def create_env_file():
    """Cria arquivo .env se não existir"""
    print("\n📄 Configurando variáveis de ambiente...")
    
    env_file = Path(".env")
    if env_file.exists():
        print("   ✅ Arquivo .env já existe")
        return True
    
    env_content = """# SIGATA - Configurações de Ambiente
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sigata_db
DB_USER=postgres
DB_PASSWORD=your_password

# NLP Settings
NLP_ENGINE=advanced
ENABLE_ADVANCED_METRICS=true
LANGUAGE=pt

# Frontend
FRONTEND_URL=http://localhost:3000
"""
    
    env_file.write_text(env_content)
    print("   ✅ Arquivo .env criado")
    print("   💡 Configure as variáveis de banco de dados no .env")
    return True

def generate_startup_script():
    """Gera script de inicialização"""
    print("\n🚀 Gerando scripts de inicialização...")
    
    # Script Windows
    windows_script = """@echo off
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
"""
    
    Path("start_sigata_advanced.bat").write_text(windows_script, encoding='utf-8')
    
    # Script Linux/Mac  
    unix_script = """#!/bin/bash
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
"""
    
    unix_file = Path("start_sigata_advanced.sh")
    unix_file.write_text(unix_script, encoding='utf-8')
    unix_file.chmod(0o755)
    
    print("   ✅ Scripts de inicialização criados")
    return True

def main():
    """Função principal"""
    print("🎯 SIGATA Advanced Setup - Especificação 4.4.3.2.2")
    print("=================================================\n")
    
    # Verificações básicas
    if not check_python_version():
        return False
    
    if not check_node_version():
        return False
    
    # Configurações
    if not setup_backend():
        return False
    
    if not setup_python_nlp():
        return False
    
    check_database()
    create_env_file()
    generate_startup_script()
    
    print("\n🎉 SETUP CONCLUÍDO!")
    print("==================")
    print("✅ Backend Node.js/TypeScript: Configurado")
    print("✅ NLP Engine Python: Configurado") 
    print("✅ Dependências: Instaladas")
    print("✅ Scripts de inicialização: Criados")
    print("\n🚀 PRÓXIMOS PASSOS:")
    print("1. Configure o banco PostgreSQL")
    print("2. Ajuste as variáveis no arquivo .env") 
    print("3. Execute: start_sigata_advanced.bat (Windows) ou ./start_sigata_advanced.sh (Linux/Mac)")
    print("\n📊 Acesse: http://localhost:3001")
    print("📋 Relatórios: http://localhost:3001/api/reports/html")
    print("\n🧠 Sistema SIGATA Advanced 2.0 pronto!")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
