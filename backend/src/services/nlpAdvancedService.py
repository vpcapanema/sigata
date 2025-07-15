"""
SIGATA - Sistema Integrado de Gestão de Atas
Serviço NLP Avançado para Análise de Documentos

Este módulo implementa funcionalidades avançadas de processamento de linguagem natural
para extração de resumos, palavras-chave e métricas de qualidade.

Tecnologias utilizadas:
- BERTopic: Modelagem de tópicos semanticamente avançada
- KeyBERT: Extração de palavras-chave baseada em BERT
- BERTScore: Métricas de qualidade de aderência
- Transformers: Modelos de sumarização e análise
- spaCy: Processamento básico de texto em português
"""

import os
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
import numpy as np
import pandas as pd

# Bibliotecas NLP Avançadas
from bertopic import BERTopic
from keybert import KeyBERT
from bert_score import score as bert_score
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer
import spacy
from spacy.lang.pt.stop_words import STOP_WORDS

# Bibliotecas de Métricas
from rouge_score import rouge_scorer
from sacrebleu.metrics import BLEU
import nltk
from nltk.translate.meteor_score import meteor_score

# Bibliotecas de Visualização
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SigataAdvancedNLP:
    """
    Serviço NLP Avançado do SIGATA
    
    Implementa funcionalidades enterprise-grade para:
    - Extração de resumos por tópico com métricas de aderência
    - Identificação de palavras-chave por tópico
    - Análise semântica avançada de documentos
    - Métricas de qualidade e aderência
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Inicializa o serviço NLP avançado
        
        Args:
            config: Configurações personalizadas para o serviço
        """
        self.config = config or {}
        logger.info("🚀 Inicializando SIGATA Advanced NLP Service...")
        
        # Configurações padrão
        self.embedding_model_name = self.config.get('embedding_model', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.summarization_model_name = self.config.get('summarization_model', 'unicamp-dl/ptt5-base-portuguese-vocab')
        self.min_topic_size = self.config.get('min_topic_size', 3)
        self.max_keywords_per_topic = self.config.get('max_keywords_per_topic', 10)
        
        # Inicialização dos modelos
        self._initialize_models()
        
        logger.info("✅ SIGATA Advanced NLP Service inicializado com sucesso!")
    
    def _initialize_models(self):
        """Inicializa todos os modelos NLP necessários"""
        try:
            logger.info("📚 Carregando modelos NLP...")
            
            # 1. Modelo de Embeddings Multilíngue
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            logger.info(f"✓ Modelo de embeddings carregado: {self.embedding_model_name}")
            
            # 2. Modelo spaCy para português
            self.nlp = spacy.load('pt_core_news_sm')
            logger.info("✓ spaCy português carregado: pt_core_news_sm")
            
            # 3. KeyBERT para extração de palavras-chave
            self.keybert_model = KeyBERT(model=self.embedding_model)
            logger.info("✓ KeyBERT inicializado")
            
            # 4. BERTopic para modelagem de tópicos
            self.topic_model = BERTopic(
                embedding_model=self.embedding_model,
                min_topic_size=self.min_topic_size,
                calculate_probabilities=True,
                verbose=True
            )
            logger.info("✓ BERTopic inicializado")
            
            # 5. Pipeline de Sumarização (PTT5 - Portuguese T5)
            try:
                self.summarizer = pipeline(
                    "summarization",
                    model=self.summarization_model_name,
                    tokenizer=self.summarization_model_name,
                    max_length=512,
                    min_length=50,
                    do_sample=False
                )
                logger.info(f"✓ Modelo de sumarização carregado: {self.summarization_model_name}")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao carregar modelo PT-T5: {e}")
                logger.info("🔄 Usando modelo de sumarização alternativo...")
                self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
            
            # 6. Inicializar NLTK para METEOR
            try:
                nltk.download('wordnet', quiet=True)
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                logger.info("✓ NLTK resources baixados")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao baixar recursos NLTK: {e}")
            
            # 7. ROUGE Scorer
            self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
            logger.info("✓ ROUGE scorer inicializado")
            
            # 8. BLEU Scorer
            self.bleu_scorer = BLEU()
            logger.info("✓ BLEU scorer inicializado")
            
        except Exception as e:
            logger.error(f"❌ Erro na inicialização dos modelos: {e}")
            raise
    
    def extract_topics_and_summaries(self, documents: List[str], document_titles: List[str] = None) -> Dict[str, Any]:
        """
        Extrai tópicos e gera resumos semânticos para cada tópico identificado
        
        Args:
            documents: Lista de documentos/textos para análise
            document_titles: Títulos correspondentes aos documentos (opcional)
        
        Returns:
            Dict contendo tópicos, resumos, palavras-chave e métricas
        """
        logger.info(f"📊 Iniciando análise de {len(documents)} documentos...")
        
        try:
            # 1. Pré-processamento dos documentos
            processed_docs = self._preprocess_documents(documents)
            
            # 2. Modelagem de tópicos com BERTopic
            topics, probabilities = self.topic_model.fit_transform(processed_docs)
            
            # 3. Obter informações dos tópicos
            topic_info = self.topic_model.get_topic_info()
            
            # 4. Processar cada tópico
            results = {
                'topics': [],
                'summaries': [],
                'keywords': [],
                'metrics': {},
                'metadata': {
                    'total_documents': len(documents),
                    'total_topics': len(topic_info) - 1,  # -1 para excluir outliers (-1)
                    'processing_date': datetime.now().isoformat()
                }
            }
            
            # Processar cada tópico identificado (excluindo outliers)
            for topic_id in range(len(topic_info)):
                if topic_id == -1:  # Pular outliers
                    continue
                
                # Documentos pertencentes a este tópico
                topic_docs_indices = [i for i, t in enumerate(topics) if t == topic_id]
                topic_documents = [documents[i] for i in topic_docs_indices]
                
                if not topic_documents:
                    continue
                
                # Processar tópico
                topic_result = self._process_single_topic(
                    topic_id=topic_id,
                    topic_documents=topic_documents,
                    document_indices=topic_docs_indices,
                    document_titles=document_titles
                )
                
                results['topics'].append(topic_result)
            
            # 5. Calcular métricas globais
            results['metrics'] = self._calculate_global_metrics(results['topics'], documents)
            
            logger.info(f"✅ Análise concluída: {len(results['topics'])} tópicos identificados")
            return results
            
        except Exception as e:
            logger.error(f"❌ Erro na extração de tópicos: {e}")
            raise
    
    def _preprocess_documents(self, documents: List[str]) -> List[str]:
        """Pré-processa documentos para análise NLP"""
        processed = []
        
        for doc in documents:
            # Processamento com spaCy
            spacy_doc = self.nlp(doc)
            
            # Extrair tokens significativos (sem stop words, pontuação, espaços)
            tokens = [
                token.lemma_.lower() 
                for token in spacy_doc 
                if not token.is_stop 
                and not token.is_punct 
                and not token.is_space 
                and len(token.text) > 2
                and token.text.lower() not in STOP_WORDS
            ]
            
            processed.append(' '.join(tokens))
        
        return processed
    
    def _process_single_topic(self, topic_id: int, topic_documents: List[str], 
                            document_indices: List[int], document_titles: List[str] = None) -> Dict[str, Any]:
        """Processa um único tópico extraindo resumo, palavras-chave e métricas"""
        
        logger.info(f"🔍 Processando tópico {topic_id} com {len(topic_documents)} documentos...")
        
        # 1. Obter palavras-chave do tópico via BERTopic
        topic_words = self.topic_model.get_topic(topic_id)
        bertopic_keywords = [word for word, score in topic_words[:self.max_keywords_per_topic]]
        
        # 2. Combinar documentos do tópico
        combined_text = ' '.join(topic_documents)
        
        # 3. Extração avançada de palavras-chave com KeyBERT
        keybert_keywords = self.keybert_model.extract_keywords(
            combined_text,
            keyphrase_ngram_range=(1, 3),
            stop_words='portuguese',
            top_k=self.max_keywords_per_topic,
            use_mmr=True,
            diversity=0.5
        )
        
        # 4. Combinar e priorizar palavras-chave
        final_keywords = self._merge_keywords(bertopic_keywords, keybert_keywords)
        
        # 5. Gerar resumo do tópico
        topic_summary = self._generate_topic_summary(combined_text)
        
        # 6. Calcular métricas de aderência
        adherence_metrics = self._calculate_adherence_metrics(topic_summary, combined_text, final_keywords)
        
        # 7. Preparar resultado
        result = {
            'topic_id': topic_id,
            'topic_label': f"Tópico {topic_id}",
            'document_count': len(topic_documents),
            'document_indices': document_indices,
            'keywords': final_keywords,
            'summary': topic_summary,
            'metrics': adherence_metrics,
            'confidence_scores': {
                'topic_coherence': float(np.mean([self.topic_model.probabilities_[idx] for idx in document_indices])),
                'keyword_relevance': float(np.mean([score for _, score in keybert_keywords[:5]])),
                'summary_quality': adherence_metrics.get('bert_score', {}).get('f1', 0.0)
            }
        }
        
        # Adicionar títulos se disponíveis
        if document_titles:
            result['document_titles'] = [document_titles[i] for i in document_indices]
        
        return result
    
    def _merge_keywords(self, bertopic_keywords: List[str], keybert_keywords: List[Tuple[str, float]]) -> List[Dict[str, Any]]:
        """Combina e prioriza palavras-chave de diferentes métodos"""
        
        # Converter KeyBERT para formato padronizado
        keybert_dict = {kw: score for kw, score in keybert_keywords}
        
        # Combinar e pontuar
        final_keywords = []
        processed_terms = set()
        
        # Priorizar KeyBERT (mais semântico)
        for keyword, score in keybert_keywords:
            if keyword.lower() not in processed_terms:
                final_keywords.append({
                    'term': keyword,
                    'score': float(score),
                    'source': 'keybert',
                    'relevance': 'high'
                })
                processed_terms.add(keyword.lower())
        
        # Adicionar BERTopic únicos
        for keyword in bertopic_keywords:
            if keyword.lower() not in processed_terms:
                final_keywords.append({
                    'term': keyword,
                    'score': 0.8,  # Score padrão para BERTopic
                    'source': 'bertopic',
                    'relevance': 'medium'
                })
                processed_terms.add(keyword.lower())
        
        # Ordenar por score
        final_keywords.sort(key=lambda x: x['score'], reverse=True)
        
        return final_keywords[:self.max_keywords_per_topic]
    
    def _generate_topic_summary(self, text: str, max_length: int = 300) -> Dict[str, Any]:
        """Gera resumo usando modelo de sumarização avançado"""
        
        try:
            # Limitar tamanho do input
            if len(text) > 2000:
                text = text[:2000] + "..."
            
            # Gerar resumo
            summary_result = self.summarizer(
                text,
                max_length=max_length,
                min_length=50,
                do_sample=False
            )
            
            summary_text = summary_result[0]['summary_text']
            
            return {
                'text': summary_text,
                'method': 'transformer_based',
                'model': self.summarization_model_name,
                'compression_ratio': len(summary_text) / len(text),
                'word_count': len(summary_text.split())
            }
            
        except Exception as e:
            logger.warning(f"⚠️ Erro na sumarização automática: {e}")
            
            # Fallback: resumo extrativo simples
            sentences = text.split('.')[:5]  # Primeiras 5 frases
            fallback_summary = '. '.join(sentences) + '.'
            
            return {
                'text': fallback_summary,
                'method': 'extractive_fallback',
                'model': 'rule_based',
                'compression_ratio': len(fallback_summary) / len(text),
                'word_count': len(fallback_summary.split())
            }
    
    def _calculate_adherence_metrics(self, summary: Dict[str, Any], original_text: str, keywords: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcula métricas de aderência entre resumo e texto original"""
        
        summary_text = summary['text']
        metrics = {}
        
        try:
            # 1. BERTScore - Similaridade semântica
            P, R, F1 = bert_score([summary_text], [original_text], lang='pt', verbose=False)
            metrics['bert_score'] = {
                'precision': float(P.mean()),
                'recall': float(R.mean()),
                'f1': float(F1.mean())
            }
            
            # 2. ROUGE Score - Sobreposição de n-gramas
            rouge_scores = self.rouge_scorer.score(original_text, summary_text)
            metrics['rouge'] = {
                'rouge1': {
                    'precision': rouge_scores['rouge1'].precision,
                    'recall': rouge_scores['rouge1'].recall,
                    'fmeasure': rouge_scores['rouge1'].fmeasure
                },
                'rouge2': {
                    'precision': rouge_scores['rouge2'].precision,
                    'recall': rouge_scores['rouge2'].recall,
                    'fmeasure': rouge_scores['rouge2'].fmeasure
                },
                'rougeL': {
                    'precision': rouge_scores['rougeL'].precision,
                    'recall': rouge_scores['rougeL'].recall,
                    'fmeasure': rouge_scores['rougeL'].fmeasure
                }
            }
            
            # 3. BLEU Score - Qualidade de tradução/sumarização
            try:
                bleu_score = self.bleu_scorer.sentence_score(summary_text, [original_text])
                metrics['bleu'] = {
                    'score': float(bleu_score.score),
                    'precision': [float(p) for p in bleu_score.precisions]
                }
            except Exception:
                metrics['bleu'] = {'score': 0.0, 'precision': [0.0, 0.0, 0.0, 0.0]}
            
            # 4. Cobertura de palavras-chave
            keyword_terms = [kw['term'].lower() for kw in keywords]
            summary_lower = summary_text.lower()
            
            keywords_in_summary = sum(1 for term in keyword_terms if term in summary_lower)
            keyword_coverage = keywords_in_summary / len(keyword_terms) if keyword_terms else 0
            
            metrics['keyword_coverage'] = {
                'total_keywords': len(keyword_terms),
                'keywords_in_summary': keywords_in_summary,
                'coverage_ratio': keyword_coverage
            }
            
            # 5. Score de aderência geral (combinação ponderada)
            adherence_score = (
                metrics['bert_score']['f1'] * 0.4 +
                metrics['rouge']['rougeL']['fmeasure'] * 0.3 +
                metrics['bleu']['score'] / 100 * 0.2 +
                keyword_coverage * 0.1
            )
            
            metrics['overall_adherence'] = {
                'score': float(adherence_score),
                'grade': self._get_quality_grade(adherence_score),
                'confidence': 'high' if adherence_score > 0.7 else 'medium' if adherence_score > 0.5 else 'low'
            }
            
        except Exception as e:
            logger.error(f"❌ Erro no cálculo de métricas: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    def _get_quality_grade(self, score: float) -> str:
        """Converte score numérico em grade qualitativa"""
        if score >= 0.8:
            return 'Excelente'
        elif score >= 0.7:
            return 'Muito Bom'
        elif score >= 0.6:
            return 'Bom'
        elif score >= 0.5:
            return 'Regular'
        else:
            return 'Insuficiente'
    
    def _calculate_global_metrics(self, topics: List[Dict[str, Any]], original_documents: List[str]) -> Dict[str, Any]:
        """Calcula métricas globais da análise"""
        
        if not topics:
            return {}
        
        # Métricas de qualidade por tópico
        adherence_scores = [topic['metrics'].get('overall_adherence', {}).get('score', 0) for topic in topics]
        keyword_coverages = [topic['metrics'].get('keyword_coverage', {}).get('coverage_ratio', 0) for topic in topics]
        bert_f1_scores = [topic['metrics'].get('bert_score', {}).get('f1', 0) for topic in topics]
        
        return {
            'quality_distribution': {
                'mean_adherence': float(np.mean(adherence_scores)),
                'std_adherence': float(np.std(adherence_scores)),
                'min_adherence': float(np.min(adherence_scores)),
                'max_adherence': float(np.max(adherence_scores))
            },
            'keyword_analysis': {
                'mean_coverage': float(np.mean(keyword_coverages)),
                'total_unique_keywords': len(set(kw['term'] for topic in topics for kw in topic['keywords']))
            },
            'semantic_quality': {
                'mean_bert_f1': float(np.mean(bert_f1_scores)),
                'high_quality_topics': sum(1 for score in adherence_scores if score > 0.7),
                'total_topics': len(topics)
            },
            'coverage_analysis': {
                'documents_processed': len(original_documents),
                'documents_categorized': sum(topic['document_count'] for topic in topics),
                'average_docs_per_topic': float(np.mean([topic['document_count'] for topic in topics]))
            }
        }
    
    def generate_analysis_report(self, results: Dict[str, Any], output_path: str = None) -> str:
        """Gera relatório completo da análise em formato HTML"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SIGATA - Relatório de Análise NLP</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
                .metric-card {{ background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 5px solid #007bff; }}
                .topic-section {{ background: #fff; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #dee2e6; }}
                .keywords {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }}
                .keyword {{ background: #e3f2fd; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }}
                .summary-box {{ background: #f1f8e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 10px 0; }}
                .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }}
                .quality-badge {{ padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }}
                .excelente {{ background: #d4edda; color: #155724; }}
                .muito-bom {{ background: #d1ecf1; color: #0c5460; }}
                .bom {{ background: #fff3cd; color: #856404; }}
                .regular {{ background: #f8d7da; color: #721c24; }}
                .insuficiente {{ background: #f5c6cb; color: #721c24; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 SIGATA - Relatório de Análise NLP Avançada</h1>
                    <p>Sistema Integrado de Gestão de Atas - PLI/SP</p>
                    <p><em>Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}</em></p>
                </div>
                
                <div class="metric-card">
                    <h2>📊 Resumo Executivo</h2>
                    <div class="metrics-grid">
                        <div><strong>Total de Documentos:</strong> {results['metadata']['total_documents']}</div>
                        <div><strong>Tópicos Identificados:</strong> {results['metadata']['total_topics']}</div>
                        <div><strong>Qualidade Média:</strong> {results['metrics'].get('quality_distribution', {}).get('mean_adherence', 0):.2%}</div>
                        <div><strong>Tópicos de Alta Qualidade:</strong> {results['metrics'].get('semantic_quality', {}).get('high_quality_topics', 0)}</div>
                    </div>
                </div>
        """
        
        # Adicionar seção para cada tópico
        for i, topic in enumerate(results.get('topics', []), 1):
            quality_grade = topic['metrics'].get('overall_adherence', {}).get('grade', 'Regular')
            quality_class = quality_grade.lower().replace(' ', '-')
            
            keywords_html = ''.join([f'<span class="keyword">{kw["term"]}</span>' for kw in topic['keywords'][:8]])
            
            html_content += f"""
                <div class="topic-section">
                    <h3>🔍 {topic['topic_label']} 
                        <span class="quality-badge {quality_class}">{quality_grade}</span>
                    </h3>
                    
                    <p><strong>📋 Documentos:</strong> {topic['document_count']} documentos analisados</p>
                    
                    <div class="summary-box">
                        <h4>📝 Resumo do Tópico:</h4>
                        <p>{topic['summary']['text']}</p>
                        <small><em>Método: {topic['summary']['method']} | Taxa de compressão: {topic['summary']['compression_ratio']:.1%}</em></small>
                    </div>
                    
                    <h4>🔑 Palavras-chave Identificadas:</h4>
                    <div class="keywords">{keywords_html}</div>
                    
                    <h4>📈 Métricas de Qualidade:</h4>
                    <div class="metrics-grid">
                        <div><strong>BERTScore F1:</strong> {topic['metrics'].get('bert_score', {}).get('f1', 0):.3f}</div>
                        <div><strong>ROUGE-L:</strong> {topic['metrics'].get('rouge', {}).get('rougeL', {}).get('fmeasure', 0):.3f}</div>
                        <div><strong>Cobertura de Palavras-chave:</strong> {topic['metrics'].get('keyword_coverage', {}).get('coverage_ratio', 0):.1%}</div>
                        <div><strong>Score de Aderência:</strong> {topic['metrics'].get('overall_adherence', {}).get('score', 0):.3f}</div>
                    </div>
                </div>
            """
        
        # Finalizar HTML
        html_content += """
                <div class="metric-card">
                    <h2>🎯 Conclusões e Recomendações</h2>
                    <p>Esta análise utilizou tecnologias de ponta em NLP para extrair insights semânticos dos documentos.</p>
                    <p><strong>Tecnologias utilizadas:</strong> BERTopic, KeyBERT, BERTScore, Transformers, spaCy</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Salvar arquivo se caminho fornecido
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            logger.info(f"📄 Relatório salvo em: {output_path}")
        
        return html_content

# Função de conveniência para uso direto
def analyze_meeting_minutes(documents: List[str], document_titles: List[str] = None, config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Função principal para análise de atas de reunião
    
    Args:
        documents: Lista de textos das atas
        document_titles: Títulos das atas (opcional)
        config: Configurações personalizadas
    
    Returns:
        Resultados completos da análise
    """
    nlp_service = SigataAdvancedNLP(config)
    return nlp_service.extract_topics_and_summaries(documents, document_titles)

# Exemplo de uso
if __name__ == "__main__":
    # Dados de exemplo
    sample_documents = [
        "A reunião discutiu os avanços no projeto de digitalização dos documentos governamentais. Foi apresentado o cronograma de implementação e as métricas de sucesso.",
        "Foram abordadas as questões de segurança da informação e proteção de dados pessoais conforme a LGPD. A equipe técnica apresentou as medidas de compliance.",
        "O orçamento para o próximo trimestre foi revisado. Foram aprovados os investimentos em infraestrutura de TI e capacitação da equipe.",
    ]
    
    sample_titles = [
        "Ata - Reunião Digitalização 001",
        "Ata - Reunião Segurança 002", 
        "Ata - Reunião Orçamento 003"
    ]
    
    print("🧪 Executando análise de exemplo...")
    results = analyze_meeting_minutes(sample_documents, sample_titles)
    print(f"✅ Análise concluída! {len(results['topics'])} tópicos identificados.")
