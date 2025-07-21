"""
Demonstração Completa do Sistema SIGATA Híbrido NLP
Exemplo prático do fluxo de processamento de documentos
"""

import sys
import os
from datetime import datetime

# Adicionar o caminho dos serviços
sys.path.append(os.path.join(os.path.dirname(__file__), 'src/services'))

def exemplo_fluxo_completo():
    """
    Demonstra o fluxo completo do sistema SIGATA
    """
    print("🎯 SISTEMA SIGATA - DEMONSTRAÇÃO COMPLETA")
    print("=" * 60)
    
    # ==== ETAPA 1: DOCUMENTOS DE ENTRADA ====
    print("\n📄 ETAPA 1: DOCUMENTOS DE ENTRADA")
    print("-" * 40)
    
    # Simulando atas de reunião reais do PLI
    documentos_entrada = [
        """
        ATA DE REUNIÃO - PLI/SP 2025
        Data: 10/07/2025 | Horário: 14:00-16:00
        
        PARTICIPANTES:
        - João Silva (Coordenador Técnico)
        - Maria Santos (Analista de Sistemas)
        - Pedro Costa (Especialista em IA)
        
        PAUTA:
        1. Implementação do módulo de NLP
        2. Integração com PostgreSQL
        3. Desenvolvimento da interface web
        4. Cronograma de testes
        
        DECISÕES:
        - Aprovado uso de BERTopic para análise de tópicos
        - Definida arquitetura de microserviços
        - Prazo final: 30/12/2025
        """,
        
        """
        RELATÓRIO ORÇAMENTÁRIO - PROJETO PLI
        Período: Julho 2025
        
        INVESTIMENTOS APROVADOS:
        - Infraestrutura de servidores: R$ 150.000
        - Licenças de software: R$ 80.000  
        - Treinamento da equipe: R$ 50.000
        - Consultoria especializada: R$ 120.000
        
        PRÓXIMAS AÇÕES:
        - Contratação de consultores em IA
        - Aquisição de hardware para processamento
        - Curso de capacitação em NLP
        """,
        
        """
        WORKSHOP TÉCNICO - TECNOLOGIAS NLP
        Data: 12/07/2025
        
        CONTEÚDO APRESENTADO:
        1. Transformers e arquitetura BERT
        2. Técnicas de fine-tuning
        3. Processamento de texto em português
        4. Métricas de avaliação (BLEU, ROUGE)
        5. Implementação prática com KeyBERT
        
        PARTICIPANTES FEEDBACK:
        - Tecnologia promissora para análise de atas
        - Necessário treinamento adicional
        - Proposta de POC em agosto
        """
    ]
    
    titulos_documentos = [
        "Ata Reunião - Implementação PLI",
        "Relatório Orçamentário - Julho 2025", 
        "Workshop Técnico - NLP Avançado"
    ]
    
    print(f"✅ {len(documentos_entrada)} documentos carregados:")
    for i, titulo in enumerate(titulos_documentos, 1):
        print(f"   {i}. {titulo}")
        print(f"      Tamanho: {len(documentos_entrada[i-1])} caracteres")
    
    # ==== ETAPA 2: INICIALIZAÇÃO DO SISTEMA ====
    print(f"\n🔧 ETAPA 2: INICIALIZAÇÃO DO SISTEMA")
    print("-" * 40)
    
    try:
        from nlpHybridService import SigataHybridNLP
        
        print("🎯 Inicializando SIGATA Hybrid NLP...")
        service = SigataHybridNLP()
        
        print(f"✅ Sistema inicializado")
        print(f"📊 Modo avançado disponível: {service.advanced_available}")
        
        if service.advanced_available:
            print("🚀 Bibliotecas detectadas: BERTopic, KeyBERT, Transformers")
        else:
            print("🔧 Modo fallback: Análise baseada em regras")
            
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return False
    
    # ==== ETAPA 3: PROCESSAMENTO AUTOMÁTICO ====
    print(f"\n⚙️ ETAPA 3: PROCESSAMENTO AUTOMÁTICO")
    print("-" * 40)
    
    print("🔍 Iniciando análise de documentos...")
    
    try:
        # Chamar o sistema de análise
        resultados = service.analyze_documents(documentos_entrada, titulos_documentos)
        
        print(f"✅ Análise concluída!")
        print(f"📊 Método usado: {resultados['method'].upper()}")
        print(f"🎯 Tópicos identificados: {len(resultados['topics'])}")
        print(f"⚡ Tecnologia: {resultados['metadata']['technology']}")
        
    except Exception as e:
        print(f"❌ Erro no processamento: {e}")
        return False
    
    # ==== ETAPA 4: ANÁLISE DOS RESULTADOS ====
    print(f"\n📊 ETAPA 4: RESULTADOS DA ANÁLISE")
    print("-" * 40)
    
    for i, topico in enumerate(resultados['topics'], 1):
        print(f"\n🔍 TÓPICO {i}: {topico['topic_label']}")
        print(f"   📋 Documentos relacionados: {topico['document_count']}")
        
        # Mostrar documentos relacionados
        for doc_idx in topico['document_indices']:
            print(f"      • {titulos_documentos[doc_idx]}")
        
        # Palavras-chave principais
        palavras_chave = [kw['term'] for kw in topico['keywords'][:5]]
        print(f"   🔑 Palavras-chave: {', '.join(palavras_chave)}")
        
        # Resumo gerado
        resumo = topico['summary'][:150] + "..." if len(topico['summary']) > 150 else topico['summary']
        print(f"   📝 Resumo: {resumo}")
        
        # Métricas de qualidade
        print(f"   📈 Qualidade: {topico['metrics']['quality_grade']}")
        print(f"   📊 Cobertura: {topico['metrics']['keyword_coverage']:.1%}")
    
    # ==== ETAPA 5: MÉTRICAS GLOBAIS ====
    print(f"\n📈 ETAPA 5: MÉTRICAS GLOBAIS")
    print("-" * 40)
    
    metrics = resultados['global_metrics']
    metadata = resultados['metadata']
    
    print(f"📄 Total de documentos processados: {metadata['total_documents']}")
    print(f"🎯 Total de tópicos identificados: {metadata['total_topics']}")
    print(f"⏰ Data de processamento: {datetime.fromisoformat(metadata['processing_date']).strftime('%d/%m/%Y %H:%M:%S')}")
    
    if 'mean_quality' in metrics:
        print(f"🏆 Qualidade média: {metrics['mean_quality']:.1%}")
        print(f"📊 Qualidade mínima: {metrics['min_quality']:.1%}")
        print(f"🚀 Qualidade máxima: {metrics['max_quality']:.1%}")
    
    # ==== ETAPA 6: GERAÇÃO DE RELATÓRIO ====
    print(f"\n📋 ETAPA 6: GERAÇÃO DE RELATÓRIO HTML")
    print("-" * 40)
    
    try:
        print("🎨 Gerando relatório HTML...")
        html_report = service.generate_html_report(resultados)
        
        # Salvar relatório
        report_path = f"D:/SEMIL/PLI/SIGATA/backend/relatorio_sigata_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_report)
        
        print(f"✅ Relatório salvo: {os.path.basename(report_path)}")
        print(f"📁 Local: {report_path}")
        print(f"📏 Tamanho: {len(html_report):,} caracteres")
        
    except Exception as e:
        print(f"❌ Erro na geração do relatório: {e}")
    
    # ==== RESUMO FINAL ====
    print(f"\n🎉 FLUXO CONCLUÍDO COM SUCESSO!")
    print("=" * 60)
    print(f"📊 RESUMO EXECUTIVO:")
    print(f"   • Sistema: SIGATA Hybrid NLP")
    print(f"   • Modo: {resultados['method'].title()}")
    print(f"   • Documentos: {len(documentos_entrada)} processados")
    print(f"   • Tópicos: {len(resultados['topics'])} identificados")
    print(f"   • Tempo: Processamento em tempo real")
    print(f"   • Relatório: HTML gerado automaticamente")
    
    return True

def explicar_fluxo_tecnico():
    """Explica os detalhes técnicos do fluxo"""
    print(f"\n🔬 DETALHES TÉCNICOS DO FLUXO")
    print("=" * 60)
    
    fluxo_steps = [
        {
            "etapa": "1. DETECÇÃO DE MODO",
            "processo": "Sistema verifica disponibilidade de bibliotecas avançadas",
            "tecnico": "Import BERTopic, KeyBERT, Transformers → advanced_available = True/False"
        },
        {
            "etapa": "2. PRÉ-PROCESSAMENTO", 
            "processo": "Limpeza e normalização do texto",
            "tecnico": "Regex para caracteres especiais, remoção de espaços, tokenização"
        },
        {
            "etapa": "3. DECISÃO DE ROTA",
            "processo": "Escolha entre modo avançado ou fallback",
            "tecnico": "if advanced_available: try_advanced() else: fallback_analysis()"
        },
        {
            "etapa": "4A. MODO AVANÇADO",
            "processo": "BERTopic para clustering, KeyBERT para keywords",
            "tecnico": "SentenceTransformer embeddings → UMAP → HDBSCAN clustering"
        },
        {
            "etapa": "4B. MODO FALLBACK", 
            "processo": "Análise baseada em frequência e regras",
            "tecnico": "Counter(words) → similarity matrix → basic clustering"
        },
        {
            "etapa": "5. EXTRAÇÃO DE FEATURES",
            "processo": "Identificação de tópicos, keywords, resumos",
            "tecnico": "Topic modeling + keyword scoring + extractive summarization"
        },
        {
            "etapa": "6. CÁLCULO DE MÉTRICAS",
            "processo": "Avaliação da qualidade dos resultados",
            "tecnico": "BERTScore/Jaccard similarity + keyword coverage + compression ratio"
        },
        {
            "etapa": "7. FORMATAÇÃO DE SAÍDA",
            "processo": "Estruturação dos resultados em JSON",
            "tecnico": "AnalysisResults interface → topics[] + metadata + metrics"
        },
        {
            "etapa": "8. GERAÇÃO DE RELATÓRIO",
            "processo": "HTML com visualizações e estatísticas",
            "tecnico": "Template HTML + CSS Grid + responsive design"
        }
    ]
    
    for step in fluxo_steps:
        print(f"\n{step['etapa']}")
        print(f"   🎯 Processo: {step['processo']}")
        print(f"   ⚙️ Técnico: {step['tecnico']}")
    
    print(f"\n🔄 FLUXO DE FALLBACK AUTOMÁTICO:")
    print(f"   1. Tenta modo avançado")
    print(f"   2. Detecta erro (ex: poucos dados)")
    print(f"   3. Captura exceção graciosamente")
    print(f"   4. Ativa modo fallback")
    print(f"   5. Continua processamento")
    print(f"   6. Retorna resultados válidos")

if __name__ == "__main__":
    # Executar demonstração completa
    sucesso = exemplo_fluxo_completo()
    
    if sucesso:
        explicar_fluxo_tecnico()
    
    print(f"\n🎯 SIGATA - Sistema Integrado de Gestão de Atas")
    print(f"📅 PLI/SP 2025 - Processamento Inteligente de Documentos")
