#!/usr/bin/env python3
"""
SIGATA - Sistema Integrado de Gestão de Atas
Script rápido para ativar ambiente virtual e iniciar a API

Data: 15/07/2025
Autor: GitHub Copilot
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def main():
    """Função principal simplificada"""
    print("=" * 50)
    print("🏛️  SIGATA - Iniciando API...")
    print("=" * 50)
    
    # Mudar para diretório correto
    target_dir = Path(r"D:\SEMIL\PLI\SIGATA")
    if Path.cwd() != target_dir:
        os.chdir(target_dir)
        print(f"📂 Diretório: {target_dir}")
    
    # Verificar/criar ambiente virtual
    venv_path = Path("venv")
    if not venv_path.exists():
        print("🔧 Criando ambiente virtual...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    
    # Determinar executável Python do venv
    if platform.system() == "Windows":
        python_exe = "venv\\Scripts\\python.exe"
        pip_exe = "venv\\Scripts\\pip.exe"
    else:
        python_exe = "venv/bin/python"
        pip_exe = "venv/bin/pip"
    
    # Instalar Flask rapidamente (mínimo necessário)
    print("📦 Instalando Flask...")
    try:
        subprocess.run([pip_exe, "install", "flask", "flask-cors"], 
                      check=True, capture_output=True)
    except:
        print("⚠️  Usando Python global")
        python_exe = "python"
        subprocess.run(["pip", "install", "flask", "flask-cors"])
    
    # Criar API básica se não existir
    api_file = Path("api.py")
    if not api_file.exists():
        print("� Criando API básica...")
        create_simple_api()
    
    # Iniciar servidor
    print("🚀 Iniciando servidor...")
    print("📍 http://localhost:5000/health")
    print("📍 Pressione Ctrl+C para parar")
    
    try:
        subprocess.run([python_exe, "api.py"])
    except KeyboardInterrupt:
        print("\n👋 SIGATA finalizado!")

def create_simple_api():
    """Cria uma API Flask simples"""
    api_content = '''from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "service": "SIGATA API",
        "time": datetime.now().isoformat()
    })

@app.route('/api/status')
def status():
    return jsonify({
        "success": True,
        "message": "SIGATA API funcionando!",
        "version": "1.0.0"
    })

if __name__ == '__main__':
    print("🚀 SIGATA API - Porta 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
'''
    
    with open("api.py", 'w', encoding='utf-8') as f:
        f.write(api_content)

if __name__ == "__main__":
    main()
