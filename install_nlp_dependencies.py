#!/usr/bin/env python3
"""
SIGATA - Instalador de Dependências NLP Avançado
Instala todas as bibliotecas necessárias para o sistema NLP real
"""

import subprocess
import sys
import os

def install_package(package):
    """Instala um pacote Python usando pip"""
    try:
        print(f"📦 Instalando {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} instalado com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar {package}: {e}")
        return False

def download_spacy_model(model):
    """Baixa modelo do spaCy"""
    try:
        print(f"📥 Baixando modelo spaCy: {model}...")
        subprocess.check_call([sys.executable, "-m", "spacy", "download", model])
        print(f"✅ Modelo {model} baixado com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao baixar modelo {model}: {e}")
        return False

def main():
    print("🚀 SIGATA - Instalador de Dependências NLP Avançado")
    print("=" * 60)
    
    # Lista de pacotes principais
    packages = [
        # Análise de Tópicos
        "bertopic",
        "umap-learn",
        "hdbscan",
        
        # Extração de Palavras-chave
        "keybert",
        
        # Métricas de Qualidade
        "bert-score",
        
        # Processamento de Linguagem Natural
        "spacy",
        "transformers",
        "torch",
        
        # Machine Learning
        "scikit-learn",
        "sentence-transformers",
        
        # Análise de Dados
        "numpy",
        "pandas",
        
        # Utilidades
        "nltk",
        "gensim"
    ]
    
    print("🔧 Instalando pacotes Python...")
    failed_packages = []
    
    for package in packages:
        if not install_package(package):
            failed_packages.append(package)
    
    print("\n🌐 Baixando modelos de linguagem...")
    
    # Modelos do spaCy
    spacy_models = ["pt_core_news_sm", "pt_core_news_lg"]
    failed_models = []
    
    for model in spacy_models:
        if not download_spacy_model(model):
            failed_models.append(model)
    
    # Baixar dados do NLTK
    try:
        print("📚 Baixando dados do NLTK...")
        import nltk
        nltk.download('punkt')
        nltk.download('stopwords')
        print("✅ Dados do NLTK baixados!")
    except Exception as e:
        print(f"⚠️ Erro ao baixar dados do NLTK: {e}")
    
    # Relatório final
    print("\n" + "=" * 60)
    print("📋 RELATÓRIO DE INSTALAÇÃO")
    print("=" * 60)
    
    if not failed_packages and not failed_models:
        print("🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!")
        print("✅ Todos os pacotes e modelos foram instalados corretamente")
        print("\n🚀 O SIGATA NLP Avançado está pronto para uso!")
    else:
        print("⚠️ INSTALAÇÃO CONCLUÍDA COM AVISOS")
        
        if failed_packages:
            print("\n❌ Pacotes que falharam:")
            for pkg in failed_packages:
                print(f"   - {pkg}")
        
        if failed_models:
            print("\n❌ Modelos que falharam:")
            for model in failed_models:
                print(f"   - {model}")
        
        print("\n💡 Tente instalar manualmente os pacotes que falharam")
    
    print("\n🔗 Comandos úteis:")
    print("   python -c \"from src.services.nlp.advanced_nlp_engine import initialize_sigata_advanced; sigata = initialize_sigata_advanced(); print('✅ SIGATA NLP carregado!')\"")

if __name__ == "__main__":
    main()
