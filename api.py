#!/usr/bin/env python3
"""
SIGATA - API Básica
Servidor Flask simples para iniciar o projeto
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        "status": "healthy",
        "service": "SIGATA API",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """Lista documentos (placeholder)"""
    return jsonify({
        "success": True,
        "data": {
            "documents": [],
            "total": 0,
            "message": "Nenhum documento encontrado"
        }
    })

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload de documento (placeholder)"""
    return jsonify({
        "success": True,
        "data": {
            "message": "Funcionalidade de upload em desenvolvimento",
            "file_received": request.files.get('file') is not None
        }
    })

@app.route('/api/analysis', methods=['GET'])
def get_analysis():
    """Obter análises (placeholder)"""
    return jsonify({
        "success": True,
        "data": {
            "analysis": [],
            "message": "Serviços de análise NLP em desenvolvimento"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 SIGATA API iniciando na porta {port}")
    print(f"📍 Acesse: http://localhost:{port}/health")
    app.run(host='0.0.0.0', port=port, debug=True)
