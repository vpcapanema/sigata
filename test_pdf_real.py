#!/usr/bin/env python3
"""
Teste do sistema NLP SIGATA Advanced com arquivo PDF real
"""
import sys
import os
import json
import PyPDF2
from pathlib import Path

# Adicionar o caminho do módulo
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'services', 'nlp'))

def extract_pdf_text(pdf_path):
    """Extrai texto de um arquivo PDF"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            return text.strip()
    except Exception as e:
        print(f"❌ Erro ao extrair texto do PDF: {e}")
        return None

try:
    from advanced_nlp_engine import initialize_sigata_advanced
    
    # Caminho do arquivo PDF real
    pdf_path = r"D:\SEMIL\PLI\SIGATA\arquivos_teste\Atas_PDF_Individuais\ABIFER_-_Compartilhamento_de_projetos_30_06_às_10_.pdf"
    
    print(f"🚀 Iniciando teste do SIGATA Advanced NLP com arquivo real...")
    print(f"📁 Arquivo: {os.path.basename(pdf_path)}")
    
    # Verificar se o arquivo existe
    if not os.path.exists(pdf_path):
        print(f"❌ Arquivo não encontrado: {pdf_path}")
        sys.exit(1)
    
    # Extrair texto do PDF
    print("📄 Extraindo texto do PDF...")
    text = extract_pdf_text(pdf_path)
    
    if not text:
        print("❌ Falha na extração de texto do PDF")
        sys.exit(1)
    
    print(f"✅ Texto extraído: {len(text)} caracteres")
    print(f"📝 Prévia do texto:\n{text[:500]}...")
    
    # Inicializar o sistema NLP
    print("\n🧠 Inicializando sistema NLP avançado...")
    sigata = initialize_sigata_advanced()
    
    # Criar chunks adequados para o BERTopic
    sentences = [s.strip() + '.' for s in text.split('.') if len(s.strip()) > 30]
    
    # Garantir quantidade adequada para BERTopic
    while len(sentences) < 15:
        base_sentences = sentences[:5] if sentences else [
            "Esta é uma ata de reunião importante do projeto.",
            "Os participantes discutiram questões técnicas e administrativas.",
            "Foram tomadas decisões importantes para o andamento dos trabalhos.",
            "As ações foram definidas com responsáveis e prazos específicos.",
            "A reunião foi conduzida de forma produtiva e eficiente."
        ]
        sentences.extend(base_sentences)
    
    # Processar documento
    print(f"\n⚡ Processando documento com {len(sentences)} chunks...")
    document_id = f"abifer_ata_{os.path.basename(pdf_path).replace('.pdf', '')}"
    
    result = sigata.process_document(text, document_id, sentences)
    
    # Converter resultado para JSON
    output = {
        'success': True,
        'document_info': {
            'filename': os.path.basename(pdf_path),
            'path': pdf_path,
            'text_length': len(text),
            'chunks_count': len(sentences)
        },
        'analysis_results': {
            'document_id': result.document_id,
            'timestamp': result.timestamp.isoformat(),
            'topics': result.topics,
            'keywords': result.keywords[:15],  # Top 15 keywords
            'entities': result.entities,
            'participants': result.participants,
            'decisions': result.decisions,
            'actions': result.actions,
            'summary': result.summary,
            'performance_score': result.performance_score,
            'confidence_interval': result.confidence_interval_95,
            'metrics': {
                'coherence_c_v': result.coherence_metrics.c_v,
                'word_pairs': result.coherence_metrics.word_pairs,
                'bert_precision': result.bert_score_metrics.precision,
                'bert_recall': result.bert_score_metrics.recall,
                'bert_f1': result.bert_score_metrics.f1_score,
                'mmr_score': result.mmr_metrics.mmr_score
            }
        }
    }
    
    print("\n✅ Processamento concluído com sucesso!")
    print("\n" + "="*80)
    print("📊 RESULTADOS DA ANÁLISE:")
    print("="*80)
    
    # Mostrar resumo executivo
    print(f"📁 Arquivo: {output['document_info']['filename']}")
    print(f"📝 Tamanho: {output['document_info']['text_length']} caracteres")
    print(f"🎯 Performance Score: {output['analysis_results']['performance_score']:.3f}")
    print(f"👥 Participantes encontrados: {len(output['analysis_results']['participants'])}")
    print(f"🎭 Tópicos identificados: {len(output['analysis_results']['topics'])}")
    print(f"🔑 Palavras-chave: {len(output['analysis_results']['keywords'])}")
    print(f"📋 Decisões extraídas: {len(output['analysis_results']['decisions'])}")
    print(f"⚡ Ações identificadas: {len(output['analysis_results']['actions'])}")
    
    # Mostrar participantes
    if output['analysis_results']['participants']:
        print(f"\n👥 PARTICIPANTES IDENTIFICADOS:")
        for i, participant in enumerate(output['analysis_results']['participants'], 1):
            print(f"  {i}. {participant}")
    
    # Mostrar tópicos principais
    if output['analysis_results']['topics']:
        print(f"\n🎭 TÓPICOS PRINCIPAIS:")
        for topic in output['analysis_results']['topics'][:3]:
            words = ', '.join(topic['words'][:5])
            print(f"  • {topic['name']}: {words}")
    
    # Mostrar palavras-chave top
    if output['analysis_results']['keywords']:
        print(f"\n🔑 PALAVRAS-CHAVE TOP 10:")
        for kw in output['analysis_results']['keywords'][:10]:
            print(f"  • {kw['word']} (relevância: {kw['relevance']:.3f})")
    
    # Mostrar decisões
    if output['analysis_results']['decisions']:
        print(f"\n📋 DECISÕES EXTRAÍDAS:")
        for i, decision in enumerate(output['analysis_results']['decisions'], 1):
            text_preview = decision['text'][:100] + "..." if len(decision['text']) > 100 else decision['text']
            print(f"  {i}. {text_preview} (palavra-chave: {decision['keyword']})")
    
    # Mostrar ações
    if output['analysis_results']['actions']:
        print(f"\n⚡ AÇÕES IDENTIFICADAS:")
        for i, action in enumerate(output['analysis_results']['actions'], 1):
            text_preview = action['text'][:100] + "..." if len(action['text']) > 100 else action['text']
            print(f"  {i}. {text_preview} (palavra-chave: {action['keyword']})")
    
    print("\n" + "="*80)
    print(f"📊 RESUMO: {output['analysis_results']['summary']}")
    print("="*80)
    
    # Salvar resultado completo em arquivo
    output_file = f"resultado_analise_{document_id}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Resultado completo salvo em: {output_file}")

except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    print("Execute: pip install PyPDF2")
    output = {
        'success': False,
        'error': f'Dependências não encontradas: {str(e)}',
        'message': 'Execute: pip install PyPDF2 bertopic keybert bert-score spacy'
    }
    print(json.dumps(output, indent=2))

except Exception as e:
    print(f"❌ Erro geral: {e}")
    output = {
        'success': False,
        'error': str(e)
    }
    print(json.dumps(output, indent=2))
