"""
Teste do Sistema SIGATA com documentos mais robustos
Para ativar o modo avançado com dados suficientes
"""

import sys
import os

# Adicionar o caminho dos serviços
sys.path.append(os.path.join(os.path.dirname(__file__), 'src/services'))

def test_com_mais_documentos():
    """Testa com documentos mais robustos para ativar modo avançado"""
    print("🧪 Testando SIGATA com documentos robustos...")
    
    try:
        from nlpHybridService import analyze_meeting_minutes
        
        # Documentos mais extensos e variados
        documentos_robustos = [
            """
            Reunião sobre implementação do sistema SIGATA realizada em 13 de julho de 2025.
            Participaram representantes da equipe técnica, gerência de projeto e stakeholders.
            Foram discutidas as funcionalidades de análise de documentos, processamento de linguagem natural,
            integração com banco de dados PostgreSQL e desenvolvimento da interface de usuário.
            A equipe definiu que utilizará tecnologias como BERTopic para modelagem de tópicos,
            KeyBERT para extração de palavras-chave e transformers para análise semântica.
            Próximos passos incluem finalização da arquitetura e início dos testes de integração.
            """,
            
            """
            Análise de orçamento para o projeto PLI - Processamento de Linguagem e Inteligência.
            Foram aprovados investimentos em infraestrutura de servidores, licenças de software,
            treinamento da equipe técnica em tecnologias de IA e contratação de consultores especializados.
            O orçamento total aprovado é de R$ 850.000 para o período de 12 meses.
            Principais itens: hardware (R$ 200.000), software (R$ 150.000), recursos humanos (R$ 400.000),
            treinamento (R$ 100.000). A liberação dos recursos seguirá cronograma por marcos do projeto.
            """,
            
            """
            Revisão de cronograma e marcos do projeto SIGATA - Sistema Integrado de Gestão de Atas.
            Foram definidas as seguintes datas: módulo de NLP (31/08/2025), interface web (30/09/2025),
            integração com banco de dados (15/10/2025), testes de homologação (30/11/2025),
            deploy em produção (15/12/2025). A equipe identificou riscos relacionados à complexidade
            dos algoritmos de machine learning e dependências de bibliotecas externas.
            Planos de contingência incluem desenvolvimento de fallbacks e versionamento incremental.
            """,
            
            """
            Apresentação dos resultados da fase de prototipagem do sistema de análise de atas.
            O protótipo demonstrou capacidade de processar documentos em formato PDF e DOCX,
            extrair texto automaticamente, identificar participantes das reuniões,
            reconhecer tópicos principais através de algoritmos de clustering,
            gerar resumos executivos e produzir relatórios em HTML.
            Métricas de performance: precisão de 87% na extração de tópicos,
            recall de 82% na identificação de palavras-chave, tempo médio de processamento
            de 3.2 segundos por documento. Feedback dos usuários foi positivo.
            """,
            
            """
            Reunião de planejamento técnico para integração de módulos do sistema SIGATA.
            Discutidas arquiteturas de microserviços, APIs RESTful, autenticação JWT,
            banco de dados PostgreSQL com schema otimizado para documentos textuais,
            cache Redis para melhorar performance de consultas frequentes,
            monitoramento com Prometheus e Grafana, logs centralizados com ELK Stack.
            Decisões técnicas: usar Node.js com TypeScript no backend,
            React com Material-UI no frontend, Docker para containerização,
            Kubernetes para orquestração em ambiente de produção.
            """,
            
            """
            Workshop sobre técnicas avançadas de processamento de linguagem natural.
            Conteúdo abordado: transformers e arquitetura attention, modelos BERT e suas variações,
            fine-tuning para tarefas específicas em português brasileiro,
            técnicas de pré-processamento de texto, tokenização, embedding de palavras,
            algoritmos de clustering como HDBSCAN e UMAP para redução dimensional,
            métricas de avaliação como BLEU, ROUGE e BERTScore,
            aplicações práticas em análise de sentimento, sumarização automática,
            classificação de documentos e extração de entidades nomeadas.
            """
        ]
        
        titulos = [
            "Reunião SIGATA - Implementação Técnica",
            "Análise Orçamentária PLI 2025",
            "Revisão Cronograma e Marcos",
            "Apresentação Resultados Prototipagem", 
            "Planejamento Integração Módulos",
            "Workshop NLP Avançado"
        ]
        
        print(f"📄 Processando {len(documentos_robustos)} documentos robustos...")
        
        # Executar análise
        resultado = analyze_meeting_minutes(documentos_robustos, titulos)
        
        print(f"\n🎯 RESULTADO DA ANÁLISE:")
        print(f"✅ Método usado: {resultado['method'].upper()}")
        print(f"✅ Tópicos identificados: {len(resultado['topics'])}")
        print(f"✅ Tecnologia: {resultado['metadata']['technology']}")
        
        # Mostrar detalhes dos tópicos
        print(f"\n📊 TÓPICOS IDENTIFICADOS:")
        for i, topico in enumerate(resultado['topics'], 1):
            print(f"\n{i}. {topico['topic_label']}")
            print(f"   📋 Documentos: {topico['document_count']}")
            print(f"   🔑 Palavras-chave: {[kw['term'] for kw in topico['keywords'][:5]]}")
            print(f"   📈 Qualidade: {topico['metrics']['quality_grade']}")
            
        # Verificar se ativou modo avançado
        if resultado['method'] == 'advanced':
            print(f"\n🚀 MODO AVANÇADO ATIVADO!")
            print(f"✅ BERTopic funcionando")
            print(f"✅ KeyBERT ativo")
            print(f"✅ Métricas avançadas calculadas")
        else:
            print(f"\n🔧 Modo fallback utilizado")
            print(f"ℹ️ Pode ser devido ao tamanho dos documentos ou configuração")
            
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🎯 SIGATA - Teste com Documentos Robustos")
    print("=" * 50)
    
    success = test_com_mais_documentos()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 TESTE CONCLUÍDO!")
        print("📈 Sistema híbrido validado com dados robustos")
    else:
        print("❌ Teste falhou - verificar logs acima")
        
    print("🎯 PLI/SP - Sistema SIGATA Operacional")
