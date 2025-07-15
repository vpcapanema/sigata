"""
Teste do Sistema SIGATA Híbrido NLP
Valida funcionalidade com fallback automático
"""

import sys
import os

# Adicionar o caminho dos serviços
sys.path.append(os.path.join(os.path.dirname(__file__), '../src/services'))

def test_hybrid_nlp():
    """Testa o serviço híbrido de NLP"""
    print("🧪 Testando SIGATA Hybrid NLP Service...")
    
    try:
        from nlpHybridService import SigataHybridNLP, analyze_meeting_minutes
        
        # Documentos de teste
        test_documents = [
            "Reunião sobre implementação do sistema SIGATA. Foram discutidas funcionalidades de análise de documentos e processamento de linguagem natural.",
            "Análise de orçamento para o projeto PLI. Aprovados investimentos em infraestrutura de IA e treinamento da equipe técnica.",
            "Revisão de cronograma e marcos do projeto. Definidas datas para entrega dos módulos de NLP e interface de usuário."
        ]
        
        test_titles = [
            "Reunião SIGATA - Implementação",
            "Análise Orçamentária PLI",
            "Revisão de Cronograma"
        ]
        
        print(f"📄 Testando com {len(test_documents)} documentos...")
        
        # Teste 1: Análise usando função direta
        print("\n1️⃣ Testando função analyze_meeting_minutes...")
        results = analyze_meeting_minutes(test_documents, test_titles)
        
        # Validar resultado
        assert 'method' in results, "Resultado deve conter campo 'method'"
        assert 'topics' in results, "Resultado deve conter campo 'topics'"
        assert 'metadata' in results, "Resultado deve conter campo 'metadata'"
        assert 'global_metrics' in results, "Resultado deve conter campo 'global_metrics'"
        
        print(f"✅ Método usado: {results['method']}")
        print(f"✅ Tópicos encontrados: {len(results['topics'])}")
        print(f"✅ Tecnologia: {results['metadata']['technology']}")
        
        # Teste 2: Análise usando classe direta
        print("\n2️⃣ Testando classe SigataHybridNLP...")
        service = SigataHybridNLP()
        results2 = service.analyze_documents(test_documents, test_titles)
        
        assert len(results2['topics']) > 0, "Deve retornar pelo menos um tópico"
        print(f"✅ Análise da classe: {len(results2['topics'])} tópicos")
        
        # Teste 3: Geração de relatório HTML
        print("\n3️⃣ Testando geração de relatório HTML...")
        html_report = service.generate_html_report(results)
        
        assert len(html_report) > 100, "Relatório HTML deve ter conteúdo significativo"
        assert "SIGATA" in html_report, "Relatório deve conter referência ao SIGATA"
        assert "html" in html_report.lower(), "Deve ser um documento HTML válido"
        
        print(f"✅ Relatório HTML gerado: {len(html_report)} caracteres")
        
        # Teste 4: Verificar qualidade dos tópicos
        print("\n4️⃣ Validando qualidade dos tópicos...")
        for i, topic in enumerate(results['topics']):
            assert 'keywords' in topic, f"Tópico {i} deve ter palavras-chave"
            assert 'summary' in topic, f"Tópico {i} deve ter resumo"
            assert 'metrics' in topic, f"Tópico {i} deve ter métricas"
            assert len(topic['keywords']) > 0, f"Tópico {i} deve ter pelo menos uma palavra-chave"
            
            print(f"  📌 Tópico {i+1}: {topic['topic_label']}")
            print(f"     Palavras-chave: {[kw['term'] for kw in topic['keywords'][:3]]}")
            print(f"     Qualidade: {topic['metrics']['quality_grade']}")
        
        print(f"\n🎯 TESTE CONCLUÍDO COM SUCESSO!")
        print(f"📊 Resumo:")
        print(f"   • Método: {results['method']}")
        print(f"   • Documentos processados: {results['metadata']['total_documents']}")
        print(f"   • Tópicos identificados: {results['metadata']['total_topics']}")
        print(f"   • Tecnologia: {results['metadata']['technology']}")
        
        if 'mean_quality' in results['global_metrics']:
            quality = results['global_metrics']['mean_quality']
            print(f"   • Qualidade média: {quality:.1%}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erro de importação: {e}")
        print("⚠️ Verifique se o arquivo nlpHybridService.py está no local correto")
        return False
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_fallback_mode():
    """Testa especificamente o modo fallback"""
    print("\n🔧 Testando modo fallback específico...")
    
    try:
        from nlpHybridService import SigataHybridNLP
        
        service = SigataHybridNLP()
        
        # Forçar modo fallback temporariamente
        service.advanced_available = False
        
        test_docs = ["Documento de teste para verificar funcionamento do modo fallback."]
        results = service.analyze_documents(test_docs)
        
        assert results['method'] == 'fallback', "Deve usar método fallback"
        assert len(results['topics']) > 0, "Deve retornar tópicos mesmo em fallback"
        
        print(f"✅ Modo fallback funcionando: {len(results['topics'])} tópicos")
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de fallback: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SIGATA Hybrid NLP - Bateria de Testes")
    print("=" * 50)
    
    success = True
    
    # Teste principal
    if not test_hybrid_nlp():
        success = False
    
    # Teste de fallback
    if not test_fallback_mode():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Sistema SIGATA Híbrido está funcionando corretamente")
        print("🔄 Fallback automático validado")
        print("📈 Pronto para integração em produção")
    else:
        print("❌ ALGUNS TESTES FALHARAM")
        print("⚠️ Verifique os erros acima e corrija antes de prosseguir")
    
    print("\n🎯 Sistema SIGATA - PLI/SP")
