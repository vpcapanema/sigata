#!/usr/bin/env python3
"""
SIGATA - Inicialização Super Rápida
Apenas ativa o venv e roda Flask
"""

import os
import subprocess
import sys
from pathlib import Path

# Mudar para diretório do projeto
os.chdir(r"D:\SEMIL\PLI\SIGATA")

# Ativar venv se existir, senão usar Python global
if Path("venv/Scripts/python.exe").exists():
    python_cmd = "venv/Scripts/python.exe"
else:
    python_cmd = "python"

print("🚀 SIGATA - Iniciando rapidamente...")

# Instalar Flask se necessário (silencioso)
try:
    subprocess.run([python_cmd, "-c", "import flask"], capture_output=True, check=True)
except:
    print("📦 Instalando Flask...")
    subprocess.run([python_cmd, "-m", "pip", "install", "flask", "flask-cors"], capture_output=True)

# Criar API mínima se não existir
if not Path("api.py").exists():
    with open("api.py", "w") as f:
        f.write('''from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "service": "SIGATA"})

@app.route('/api/status')  
def status():
    return jsonify({"success": True, "message": "SIGATA funcionando!"})

if __name__ == '__main__':
    print("🚀 SIGATA API - http://localhost:5000/health")
    app.run(host='0.0.0.0', port=5000, debug=True)
''')

# Iniciar
print("📍 http://localhost:5000/health")
subprocess.run([python_cmd, "api.py"])
