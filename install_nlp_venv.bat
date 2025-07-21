@echo off
echo ========================================
echo SIGATA - Instalacao NLP no Ambiente Virtual
echo ========================================

echo.
echo 🔍 Verificando ambiente virtual...
if not exist "venv\" (
    echo ❌ Ambiente virtual nao encontrado!
    echo Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Erro ao criar ambiente virtual!
        pause
        exit /b 1
    )
)

echo.
echo 🐍 Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo.
echo 📦 Atualizando pip...
python -m pip install --upgrade pip

echo.
echo 🚀 Instalando dependencias NLP...

echo 📚 Instalando bibliotecas core...
pip install spacy>=3.7.0
pip install transformers>=4.35.0
pip install torch>=2.1.0
pip install scikit-learn>=1.3.0

echo 🧠 Instalando BERTopic e dependencias...
pip install bertopic>=0.15.0
pip install umap-learn>=0.5.4
pip install hdbscan>=0.8.29

echo 🔑 Instalando KeyBERT...
pip install keybert>=0.8.0
pip install sentence-transformers>=2.2.0

echo 📊 Instalando BERTScore...
pip install bert-score>=0.3.13

echo 🛠️ Instalando utilitarios...
pip install numpy>=1.24.0
pip install pandas>=2.0.0
pip install nltk>=3.8.0
pip install textstat>=0.7.0
pip install wordcloud>=1.9.0

echo 📄 Instalando processamento de documentos...
pip install python-docx>=0.8.11
pip install PyPDF2>=3.0.0
pip install mammoth>=1.6.0

echo 📈 Instalando visualizacao...
pip install matplotlib>=3.7.0
pip install seaborn>=0.12.0
pip install plotly>=5.15.0

echo.
echo 🇧🇷 Baixando modelo spaCy portugues...
python -m spacy download pt_core_news_sm

echo.
echo ✅ Instalacao concluida!
echo 💡 Para usar o NLP, sempre ative o ambiente virtual primeiro:
echo    venv\Scripts\activate

echo.
echo 🔍 Verificando instalacao...
python -c "import spacy, transformers, bertopic, keybert; print('✅ Todas as bibliotecas NLP instaladas com sucesso!')"

pause
