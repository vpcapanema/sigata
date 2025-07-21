#!/usr/bin/env python3
"""
Teste direto do sistema NLP SIGATA Advanced
"""
import sys
import os
import json

# Adicionar o caminho do módulo
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'services', 'nlp'))

try:
    from advanced_nlp_engine import initialize_sigata_advanced
    
    # Texto de teste
    test_text = """
    ATA DE REUNIÃO - TESTE SIGATA
    Data: 19 de julho de 2025
    Local: Brasília, DF

    PARTICIPANTES:
    - João Silva (Coordenador)
    - Maria Santos (Analista)
    - Carlos Oliveira (Desenvolvedor)
    - Ana Costa (Gestora de Projetos)

    DECISÕES TOMADAS:
    1. Foi decidido implementar o sistema NLP avançado
    2. Aprovado o uso das tecnologias BERTopic e KeyBERT
    3. Definido que o prazo será de 30 dias

    AÇÕES DEFINIDAS:
    - João Silva ficou responsável pela coordenação geral
    - Maria Santos deve finalizar a análise de requisitos
    - Carlos Oliveira irá implementar o backend
    - Ana Costa deverá acompanhar o cronograma

    A reunião foi encerrada às 16:30h com todos os objetivos alcançados.
    """
    
    print("🚀 Iniciando teste do SIGATA Advanced NLP...")
    
    # Inicializar o sistema
    sigata = initialize_sigata_advanced()
    
    # Criar chunks suficientes para BERTopic funcionar
    sentences = [s.strip() + '.' for s in test_text.split('.') if len(s.strip()) > 20]
    
    # Garantir pelo menos 10 sentenças distintas
    while len(sentences) < 10:
        # Recriar variações das sentenças existentes
        base_sentences = sentences[:3] if sentences else [
            "Esta é uma reunião importante sobre o projeto SIGATA.",
            "Os participantes discutiram questões técnicas relevantes.", 
            "Foram tomadas decisões importantes para o andamento do projeto."
        ]
        sentences.extend(base_sentences)
    
    # Processar documento com chunks adequados
    result = sigata.process_document(test_text, "teste_sigata_001", sentences)
    
    # Converter resultado para JSON
    output = {
        'success': True,
        'document_id': result.document_id,
        'timestamp': result.timestamp.isoformat(),
        'topics': result.topics,
        'keywords': result.keywords,
        'entities': result.entities,
        'participants': result.participants,
        'decisions': result.decisions,
        'actions': result.actions,
        'summary': result.summary,
        'performance_score': result.performance_score,
        'confidence_interval': result.confidence_interval_95,
        'coherence_metrics': {
            'c_v': result.coherence_metrics.c_v,
            'word_pairs': result.coherence_metrics.word_pairs
        },
        'bert_score_metrics': {
            'precision': result.bert_score_metrics.precision,
            'recall': result.bert_score_metrics.recall,
            'f1_score': result.bert_score_metrics.f1_score
        },
        'mmr_metrics': {
            'mmr_score': result.mmr_metrics.mmr_score,
            'similarity_score': result.mmr_metrics.similarity_score
        }
    }
    
    print("✅ Processamento concluído com sucesso!")
    print(json.dumps(output, indent=2, ensure_ascii=False))

except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    output = {
        'success': False,
        'error': f'Dependências NLP não encontradas: {str(e)}',
        'message': 'Execute: pip install bertopic keybert bert-score spacy'
    }
    print(json.dumps(output, indent=2))

except Exception as e:
    print(f"❌ Erro geral: {e}")
    output = {
        'success': False,
        'error': str(e)
    }
    print(json.dumps(output, indent=2))
