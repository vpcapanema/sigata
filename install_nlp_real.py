"""
SIGATA - Instalador de Dependências NLP
==========================================
Instala todas as dependências necessárias para o sistema NLP avançado
no ambiente virtual Python do SIGATA.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command):
    """Executa comando e mostra output em tempo real"""
    print(f"\n🔧 Executando: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ Sucesso: {command}")
        if result.stdout:
            print(result.stdout)
    else:
        print(f"❌ Erro: {command}")
        print(result.stderr)
    return result.returncode == 0

def main():
    print("🚀 SIGATA - Instalação de Dependências NLP")
    print("=" * 50)
    
    # Verificar se estamos no ambiente virtual
    venv_path = Path("venv")
    if not venv_path.exists():
        print("❌ Ambiente virtual não encontrado!")
        print("Execute: python -m venv venv")
        return
    
    # Usar pip do ambiente virtual
    pip_cmd = str(venv_path / "Scripts" / "pip.exe") if os.name == 'nt' else str(venv_path / "bin" / "pip")
    
    print(f"📦 Usando pip do ambiente virtual: {pip_cmd}")
    
    # Lista de dependências NLP
    dependencies = [
        # Core NLP
        "spacy>=3.7.0",
        "transformers>=4.35.0",
        "torch>=2.1.0",
        "scikit-learn>=1.3.0",
        
        # BERTopic e relacionados
        "bertopic>=0.15.0",
        "umap-learn>=0.5.4",
        "hdbscan>=0.8.29",
        
        # KeyBERT
        "keybert>=0.8.0",
        "sentence-transformers>=2.2.0",
        
        # BERTScore
        "bert-score>=0.3.13",
        
        # Utilitários
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "nltk>=3.8.0",
        "textstat>=0.7.0",
        "wordcloud>=1.9.0",
        
        # Processamento de texto
        "python-docx>=0.8.11",
        "PyPDF2>=3.0.0",
        "mammoth>=1.6.0",
        
        # Visualização
        "matplotlib>=3.7.0",
        "seaborn>=0.12.0",
        "plotly>=5.15.0"
    ]
    
    print(f"\n📋 Instalando {len(dependencies)} dependências...")
    
    # Atualizar pip primeiro
    print("\n🔄 Atualizando pip...")
    run_command(f'"{pip_cmd}" install --upgrade pip')
    
    # Instalar dependências uma por uma para melhor controle
    success_count = 0
    for dep in dependencies:
        if run_command(f'"{pip_cmd}" install {dep}'):
            success_count += 1
        else:
            print(f"⚠️  Falha ao instalar: {dep}")
    
    print(f"\n📊 Resultado:")
    print(f"✅ Instaladas com sucesso: {success_count}/{len(dependencies)}")
    
    # Baixar modelo spaCy português
    print("\n🇧🇷 Baixando modelo spaCy para português...")
    python_cmd = str(venv_path / "Scripts" / "python.exe") if os.name == 'nt' else str(venv_path / "bin" / "python")
    run_command(f'"{python_cmd}" -m spacy download pt_core_news_sm')
    
    print("\n🎉 Instalação concluída!")
    print("💡 Para ativar o ambiente virtual:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")

if __name__ == "__main__":
    main()
