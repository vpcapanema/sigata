import sys
import os

print("🐍 Testando Sistema NLP SIGATA")
print("=" * 40)
print(f"Python: {sys.version}")
print(f"Caminho: {sys.executable}")

try:
    import spacy
    print("✅ spaCy instalado:", spacy.__version__)
    
    import transformers
    print("✅ Transformers instalado:", transformers.__version__)
    
    import bertopic
    print("✅ BERTopic instalado:", bertopic.__version__)
    
    import keybert
    print("✅ KeyBERT instalado:", keybert.__version__)
    
    import sklearn
    print("✅ scikit-learn instalado:", sklearn.__version__)
    
    print("\n🎯 TODAS AS DEPENDÊNCIAS NLP FUNCIONANDO!")
    print("🚀 Sistema pronto para processamento avançado!")
    
except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    
except Exception as e:
    print(f"❌ Erro geral: {e}")
