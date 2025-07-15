"""
Serviço NLP Avançado do SIGATA
Processamento robusto usando tecnologias de ponta
"""

import sys
import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from collections import Counter

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SigataAdvancedNLP:
    """
    Serviço NLP Avançado do SIGATA
    Processamento robusto obrigatório usando:
    - BERTopic para modelagem de tópicos
    - KeyBERT para extração semântica de palavras-chave  
    - BERTScore para métricas de qualidade
    - Clustering alternativo robusto para casos especiais
    """
    
    def __init__(self):
        self.advanced_available = self._check_advanced_libraries()
        if not self.advanced_available:
            raise RuntimeError("❌ Bibliotecas avançadas obrigatórias não disponíveis! Instale: pip install bertopic keybert bert-score transformers sentence-transformers")
        
        logger.info(f"🎯 SIGATA Advanced NLP inicializado - Modo robusto ativado")
        self._init_advanced_mode()
    
    def _check_advanced_libraries(self) -> bool:
        """Verifica se bibliotecas avançadas estão disponíveis"""
        try:
            import bertopic
            import keybert
            import transformers
            import sentence_transformers
            logger.info("✅ Bibliotecas avançadas disponíveis")
            return True
        except ImportError as e:
            logger.info(f"⚠️ Bibliotecas avançadas não disponíveis: {e}")
            return False
    
    def _init_advanced_mode(self):
        """Inicializa modo avançado obrigatório"""
        try:
            from bertopic import BERTopic
            from keybert import KeyBERT
            from sentence_transformers import SentenceTransformer
            
            # Modelos otimizados e eficientes
            self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            self.keybert_model = KeyBERT(model=self.embedding_model)
            
            logger.info("🚀 Modo avançado robusto configurado com sucesso")
        except Exception as e:
            raise RuntimeError(f"Falha crítica na configuração avançada: {e}")
    
    def analyze_documents(self, documents: List[str], document_titles: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Análise avançada obrigatória de documentos
        """
        logger.info(f"📊 Analisando {len(documents)} documentos com modo avançado...")
        
        return self._analyze_advanced(documents, document_titles)
    
    def _analyze_advanced(self, documents: List[str], document_titles: Optional[List[str]] = None) -> Dict[str, Any]:
        """Análise usando bibliotecas avançadas com configuração robusta"""
        logger.info("🔬 Executando análise avançada robusta...")
        
        # Pré-processamento
        processed_docs = [self._preprocess_text(doc) for doc in documents]
        
        # Configuração robusta do BERTopic
        try:
            # Configurar BERTopic com parâmetros mais robustos
            from bertopic import BERTopic
            from umap import UMAP
            from hdbscan import HDBSCAN
            
            # UMAP com configuração robusta
            umap_model = UMAP(
                n_neighbors=max(2, min(15, len(documents)//2)),
                n_components=min(5, len(documents)-1),
                min_dist=0.0,
                metric='cosine',
                random_state=42
            )
            
            # HDBSCAN com configuração robusta  
            hdbscan_model = HDBSCAN(
                min_cluster_size=max(2, len(documents)//4),
                min_samples=1,
                metric='euclidean',
                cluster_selection_method='eom'
            )
            
            # BERTopic robusto
            topic_model = BERTopic(
                embedding_model=self.embedding_model,
                umap_model=umap_model,
                hdbscan_model=hdbscan_model,
                calculate_probabilities=False,  # Desabilitar para evitar erros
                verbose=False
            )
            
            topics, probabilities = topic_model.fit_transform(processed_docs)
            topic_info = topic_model.get_topic_info()
            
        except Exception as e:
            logger.error(f"Erro no BERTopic robusto: {e}")
            # Se BERTopic falhar, usar clustering alternativo robusto
            topics, topic_info = self._alternative_clustering(processed_docs)
        
        results = {
            'method': 'advanced',
            'topics': [],
            'metadata': {
                'total_documents': len(documents),
                'total_topics': len(set(topics)) if topics else 1,
                'processing_date': datetime.now().isoformat(),
                'technology': 'SIGATA Advanced NLP (BERTopic + KeyBERT + Robust Clustering)'
            }
        }
        
        # Processar cada tópico
        unique_topics = list(set(topics)) if topics else [0]
        
        for topic_id in unique_topics:
            if topic_id == -1:  # Pular outliers se existirem
                continue
                
            topic_docs_indices = [i for i, t in enumerate(topics) if t == topic_id] if topics else list(range(len(documents)))
            topic_documents = [documents[i] for i in topic_docs_indices]
            
            if not topic_documents:
                continue
            
            # Combinar documentos do tópico
            combined_text = ' '.join(topic_documents)
            
            # Extrair palavras-chave com KeyBERT robusto
            try:
                keywords = self.keybert_model.extract_keywords(
                    combined_text,
                    keyphrase_ngram_range=(1, 3),
                    stop_words='portuguese',
                    top_k=10,
                    use_mmr=True,
                    diversity=0.7
                )
            except Exception as e:
                logger.warning(f"KeyBERT falhou, usando extração robusta: {e}")
                keywords = self._extract_keywords_robust(combined_text)
            
            # Gerar resumo robusto
            summary = self._generate_summary_robust(combined_text)
            
            # Calcular métricas avançadas
            metrics = self._calculate_metrics_robust(summary, combined_text, keywords)
            
            topic_result = {
                'topic_id': topic_id,
                'topic_label': f"Tópico {topic_id + 1}: {keywords[0][0] if keywords else 'Geral'}",
                'document_count': len(topic_documents),
                'document_indices': topic_docs_indices,
                'keywords': [{'term': kw[0] if isinstance(kw, tuple) else kw, 'score': kw[1] if isinstance(kw, tuple) else 0.8} for kw in keywords[:8]],
                'summary': summary,
                'metrics': metrics
            }
            
            if document_titles:
                topic_result['document_titles'] = [document_titles[i] for i in topic_docs_indices]
            
            results['topics'].append(topic_result)
        
        # Se nenhum tópico foi criado, criar um tópico geral
        if not results['topics']:
            combined_text = ' '.join(documents)
            keywords = self._extract_keywords_robust(combined_text)
            summary = self._generate_summary_robust(combined_text)
            metrics = self._calculate_metrics_robust(summary, combined_text, keywords)
            
            results['topics'] = [{
                'topic_id': 0,
                'topic_label': f"Tópico Geral: {keywords[0] if keywords else 'Documentos'}",
                'document_count': len(documents),
                'document_indices': list(range(len(documents))),
                'document_titles': document_titles,
                'keywords': [{'term': kw, 'score': 0.8} for kw in keywords[:8]],
                'summary': summary,
                'metrics': metrics
            }]
        
        # Atualizar metadata
        results['metadata']['total_topics'] = len(results['topics'])
        
        # Métricas globais
        results['global_metrics'] = self._calculate_global_metrics(results['topics'])
        
        logger.info(f"✅ Análise avançada robusta concluída: {len(results['topics'])} tópicos")
        return results
    
    def _alternative_clustering(self, processed_docs: List[str]) -> tuple:
        """Clustering alternativo robusto quando BERTopic falha"""
        logger.info("🔧 Usando clustering alternativo robusto...")
        
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.cluster import KMeans
            import numpy as np
            
            # TF-IDF robusto
            vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words=None,  # Usaremos nossa lista custom
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.95
            )
            
            tfidf_matrix = vectorizer.fit_transform(processed_docs)
            
            # K-means robusto
            n_clusters = min(max(2, len(processed_docs)//2), len(processed_docs))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            topics = kmeans.fit_predict(tfidf_matrix)
            
            # Simular topic_info
            topic_info = [{'Topic': i, 'Count': np.sum(topics == i)} for i in range(n_clusters)]
            
            return topics.tolist(), topic_info
            
        except Exception as e:
            logger.warning(f"Clustering alternativo falhou: {e}")
            # Último recurso: um tópico para todos
            return [0] * len(processed_docs), [{'Topic': 0, 'Count': len(processed_docs)}]
    
    def _extract_keywords_robust(self, text: str) -> List[tuple]:
        """Extração robusta de palavras-chave quando KeyBERT falha"""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            import numpy as np
            
            # TF-IDF para palavras-chave
            vectorizer = TfidfVectorizer(
                max_features=20,
                ngram_range=(1, 3),
                stop_words=self._get_portuguese_stopwords()
            )
            
            tfidf_matrix = vectorizer.fit_transform([text])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Combinar e ordenar
            keyword_scores = list(zip(feature_names, scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return keyword_scores[:10]
            
        except Exception as e:
            logger.warning(f"Extração TF-IDF falhou: {e}")
            # Método mais básico
            return self._extract_keywords_frequency_robust(text)
    
    def _extract_keywords_frequency_robust(self, text: str) -> List[tuple]:
        """Extração por frequência como último recurso"""
        stop_words = self._get_portuguese_stopwords()
        
        # Extrair palavras
        words = re.findall(r'\b[a-záêçõàéíóúâôü]+\b', text.lower())
        
        # Filtrar palavras significativas
        meaningful_words = [
            word for word in words 
            if len(word) > 3 and word not in stop_words
        ]
        
        # Contar frequências
        from collections import Counter
        word_count = Counter(meaningful_words)
        
        # Normalizar scores
        max_count = max(word_count.values()) if word_count else 1
        normalized_scores = [(word, count/max_count) for word, count in word_count.most_common(10)]
        
        return normalized_scores
    
    def _get_portuguese_stopwords(self) -> set:
        """Lista robusta de stopwords em português"""
        return {
            'de', 'da', 'do', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
            'por', 'para', 'com', 'sem', 'sob', 'sobre', 'entre', 'até',
            'desde', 'durante', 'mediante', 'conforme', 'segundo', 'perante',
            'e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'entretanto',
            'a', 'o', 'os', 'as', 'um', 'uma', 'uns', 'umas',
            'que', 'se', 'como', 'quando', 'onde', 'quanto', 'qual', 'quais',
            'ele', 'ela', 'eles', 'elas', 'eu', 'tu', 'nós', 'vós',
            'ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'vir', 'dar',
            'foi', 'será', 'são', 'foram', 'está', 'estão', 'tem', 'têm',
            'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
            'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
            'muito', 'mais', 'menos', 'bem', 'mal', 'melhor', 'pior',
            'grande', 'pequeno', 'novo', 'velho', 'primeiro', 'último'
        }
    
    def _generate_summary_robust(self, text: str, max_sentences: int = 3) -> str:
        """Geração robusta de resumo"""
        # Dividir em frases
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip() and len(s.strip()) > 10]
        
        if len(sentences) <= max_sentences:
            return '. '.join(sentences) + '.'
        
        try:
            # Método 1: TF-IDF para ranking de frases
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            vectorizer = TfidfVectorizer(stop_words=list(self._get_portuguese_stopwords()))
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Score por soma dos TF-IDF
            sentence_scores = tfidf_matrix.sum(axis=1).A1
            
            # Selecionar top frases
            top_indices = sentence_scores.argsort()[-max_sentences:][::-1]
            top_indices.sort()  # Manter ordem original
            
            selected_sentences = [sentences[i] for i in top_indices]
            
        except Exception as e:
            logger.warning(f"Resumo TF-IDF falhou: {e}")
            # Método 2: Por posição e tamanho
            selected_sentences = []
            
            # Primeira frase
            if sentences:
                selected_sentences.append(sentences[0])
            
            # Frases do meio (mais representativas)
            if len(sentences) > 2:
                mid_idx = len(sentences) // 2
                selected_sentences.append(sentences[mid_idx])
            
            # Última frase se sobrar espaço
            if len(sentences) > 1 and len(selected_sentences) < max_sentences:
                selected_sentences.append(sentences[-1])
        
        return '. '.join(selected_sentences) + '.'
    
    def _calculate_metrics_robust(self, summary: str, original_text: str, keywords: List[tuple]) -> Dict[str, Any]:
        """Calcula métricas robustas"""
        try:
            # Tentar BERTScore primeiro
            from bert_score import score as bert_score
            
            P, R, F1 = bert_score([summary], [original_text], lang='pt', verbose=False)
            
            metrics = {
                'bert_score': {
                    'precision': float(P.mean()),
                    'recall': float(R.mean()),
                    'f1': float(F1.mean())
                },
                'keyword_coverage': self._calculate_keyword_coverage_robust(summary, keywords),
                'compression_ratio': len(summary) / len(original_text) if original_text else 0,
                'quality_grade': self._get_quality_grade(float(F1.mean()))
            }
            
        except Exception as e:
            logger.warning(f"BERTScore falhou: {e}")
            # Métricas alternativas robustas
            
            # Similaridade de Jaccard
            summary_words = set(re.findall(r'\b\w+\b', summary.lower()))
            original_words = set(re.findall(r'\b\w+\b', original_text.lower()))
            
            intersection = len(summary_words & original_words)
            union = len(summary_words | original_words)
            jaccard_similarity = intersection / union if union > 0 else 0
            
            # Cobertura de palavras-chave
            keyword_coverage = self._calculate_keyword_coverage_robust(summary, keywords)
            
            # Score combinado
            combined_score = (keyword_coverage * 0.6 + jaccard_similarity * 0.4)
            
            metrics = {
                'similarity_score': jaccard_similarity,
                'keyword_coverage': keyword_coverage,
                'compression_ratio': len(summary) / len(original_text) if original_text else 0,
                'combined_score': combined_score,
                'quality_grade': self._get_quality_grade(combined_score)
            }
        
        return metrics
    
    def _calculate_keyword_coverage_robust(self, summary: str, keywords: List[tuple]) -> float:
        """Calcula cobertura de palavras-chave robusta"""
        if not keywords:
            return 0.0
        
        summary_lower = summary.lower()
        covered = 0
        
        for kw_data in keywords:
            # Keyword pode ser tuple (word, score) ou string
            keyword = kw_data[0] if isinstance(kw_data, tuple) else kw_data
            keyword = keyword.lower() if isinstance(keyword, str) else str(keyword).lower()
            
            if keyword in summary_lower:
                covered += 1
        
        return covered / len(keywords)
        """Análise usando métodos robustos de fallback"""
        logger.info("🔧 Executando análise fallback...")
        
        results = {
            'method': 'fallback',
            'topics': [],
            'metadata': {
                'total_documents': len(documents),
                'total_topics': min(len(documents), 5),  # Máximo 5 tópicos
                'processing_date': datetime.now().isoformat(),
                'technology': 'Rule-based + Frequency analysis'
            }
        }
        
        # Análise baseada em clustering de palavras-chave
        all_keywords = []
        doc_keywords = []
        
        for i, doc in enumerate(documents):
            keywords = self._extract_keywords_frequency(doc)
            doc_keywords.append(keywords)
            all_keywords.extend(keywords)
        
        # Identificar tópicos por agrupamento de palavras-chave similares
        topic_clusters = self._cluster_keywords(doc_keywords)
        
        for topic_id, doc_indices in enumerate(topic_clusters):
            if not doc_indices:
                continue
            
            topic_documents = [documents[i] for i in doc_indices]
            combined_text = ' '.join(topic_documents)
            
            # Extrair palavras-chave do tópico
            topic_keywords = self._extract_keywords_frequency(combined_text, top_k=8)
            
            # Gerar resumo
            summary = self._generate_summary(combined_text)
            
            # Calcular métricas básicas
            metrics = self._calculate_metrics_fallback(summary, combined_text, topic_keywords)
            
            topic_result = {
                'topic_id': topic_id,
                'topic_label': f"Tópico {topic_id + 1}",
                'document_count': len(doc_indices),
                'document_indices': doc_indices,
                'keywords': [{'term': kw, 'score': 0.8} for kw in topic_keywords],
                'summary': summary,
                'metrics': metrics
            }
            
            if document_titles:
                topic_result['document_titles'] = [document_titles[i] for i in doc_indices]
            
            results['topics'].append(topic_result)
        
        # Métricas globais
        results['global_metrics'] = self._calculate_global_metrics(results['topics'])
        
        logger.info(f"✅ Análise fallback concluída: {len(results['topics'])} tópicos")
        return results
    
    def _preprocess_text(self, text: str) -> str:
        """Pré-processamento de texto"""
        # Remove caracteres especiais, mantém acentos
        text = re.sub(r'[^\w\s\u00C0-\u017F]', ' ', text)
        # Remove espaços extras
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _extract_keywords_frequency(self, text: str, top_k: int = 10) -> List[str]:
        """Extração de palavras-chave por frequência"""
        # Palavras vazias portuguesas
        stop_words = {
            'de', 'da', 'do', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
            'por', 'para', 'com', 'sem', 'sob', 'sobre', 'entre', 'até',
            'desde', 'durante', 'mediante', 'conforme', 'segundo', 'perante',
            'e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'entretanto',
            'a', 'o', 'os', 'as', 'um', 'uma', 'uns', 'umas',
            'que', 'se', 'como', 'quando', 'onde', 'quanto', 'qual', 'quais',
            'ele', 'ela', 'eles', 'elas', 'eu', 'tu', 'nós', 'vós',
            'ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'vir', 'dar',
            'foi', 'será', 'são', 'foram', 'está', 'estão', 'tem', 'têm'
        }
        
        # Extrair palavras
        words = re.findall(r'\b[a-záêçõàéíóúâôü]+\b', text.lower())
        
        # Filtrar palavras significativas
        meaningful_words = [
            word for word in words 
            if len(word) > 3 and word not in stop_words
        ]
        
        # Contar frequências
        word_count = Counter(meaningful_words)
        
        return [word for word, count in word_count.most_common(top_k)]
    
    def _generate_summary(self, text: str, max_sentences: int = 3) -> str:
        """Gera resumo extrativo"""
        # Dividir em frases
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        if len(sentences) <= max_sentences:
            return '. '.join(sentences) + '.'
        
        # Ranquear frases por frequência de palavras-chave
        keywords = self._extract_keywords_frequency(text, top_k=10)
        
        sentence_scores = []
        for sentence in sentences:
            score = sum(1 for keyword in keywords if keyword in sentence.lower())
            sentence_scores.append((sentence, score))
        
        # Selecionar top frases
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:max_sentences]
        
        # Manter ordem original
        selected_sentences = []
        for sentence in sentences:
            if any(sentence == s[0] for s in top_sentences):
                selected_sentences.append(sentence)
                if len(selected_sentences) >= max_sentences:
                    break
        
        return '. '.join(selected_sentences) + '.'
    
    def _calculate_metrics_advanced(self, summary: str, original_text: str, keywords: List[tuple]) -> Dict[str, Any]:
        """Calcula métricas para modo avançado"""
        try:
            from bert_score import score as bert_score
            
            # BERTScore
            P, R, F1 = bert_score([summary], [original_text], lang='pt', verbose=False)
            
            metrics = {
                'bert_score': {
                    'precision': float(P.mean()),
                    'recall': float(R.mean()),
                    'f1': float(F1.mean())
                },
                'keyword_coverage': self._calculate_keyword_coverage(summary, keywords),
                'compression_ratio': len(summary) / len(original_text),
                'quality_grade': self._get_quality_grade(float(F1.mean()))
            }
        except:
            # Fallback para métricas básicas
            metrics = self._calculate_metrics_fallback(summary, original_text, [kw[0] for kw in keywords])
        
        return metrics
    
    def _calculate_keyword_coverage(self, summary: str, keywords: List[tuple]) -> float:
        """Calcula cobertura de palavras-chave no resumo"""
        if not keywords:
            return 0.0
        
        summary_lower = summary.lower()
        covered = sum(1 for kw, score in keywords if kw.lower() in summary_lower)
        return covered / len(keywords)
    
    def _get_quality_grade(self, score: float) -> str:
        """Converte score em grade qualitativa"""
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
    
    def _calculate_global_metrics(self, topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcula métricas globais"""
        if not topics:
            return {}
        
        # Coletar scores dos tópicos
        scores = []
        for topic in topics:
            metrics = topic.get('metrics', {})
            if 'combined_score' in metrics:
                scores.append(metrics['combined_score'])
            elif 'bert_score' in metrics:
                scores.append(metrics['bert_score']['f1'])
        
        if scores:
            return {
                'mean_quality': sum(scores) / len(scores),
                'min_quality': min(scores),
                'max_quality': max(scores),
                'total_topics': len(topics),
                'total_documents': sum(topic['document_count'] for topic in topics)
            }
        
        return {
            'total_topics': len(topics),
            'total_documents': sum(topic['document_count'] for topic in topics)
        }
    
    def generate_html_report(self, results: Dict[str, Any]) -> str:
        """Gera relatório HTML"""
        topics = results.get('topics', [])
        metadata = results.get('metadata', {})
        global_metrics = results.get('global_metrics', {})
        
        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SIGATA - Relatório de Análise NLP</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }}
                .container {{ max-width: 1200px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }}
                .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
                .stat-card {{ background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }}
                .stat-number {{ font-size: 2em; font-weight: bold; color: #667eea; }}
                .topic {{ background: white; margin: 20px 0; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .topic-title {{ color: #333; margin-bottom: 15px; }}
                .summary {{ background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 15px 0; }}
                .keywords {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }}
                .keyword {{ background: #e3f2fd; color: #1976d2; padding: 5px 12px; border-radius: 15px; font-size: 0.9em; }}
                .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0; }}
                .metric {{ text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px; }}
                .quality-excellent {{ background: #d4edda; color: #155724; }}
                .quality-muito-bom {{ background: #d1ecf1; color: #0c5460; }}
                .quality-bom {{ background: #fff3cd; color: #856404; }}
                .quality-regular {{ background: #f8d7da; color: #721c24; }}
                .quality-insuficiente {{ background: #f5c6cb; color: #721c24; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 SIGATA - Análise NLP Avançada</h1>
                    <p>Sistema Integrado de Gestão de Atas - PLI/SP</p>
                    <p>Método: {results.get('method', 'N/A').title()} | Tecnologia: {metadata.get('technology', 'N/A')}</p>
                    <p>Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">{metadata.get('total_documents', 0)}</div>
                        <div>Documentos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{metadata.get('total_topics', 0)}</div>
                        <div>Tópicos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{global_metrics.get('mean_quality', 0):.1%}</div>
                        <div>Qualidade Média</div>
                    </div>
                </div>
        """
        
        # Adicionar tópicos
        for i, topic in enumerate(topics, 1):
            keywords_html = ''.join([
                f'<span class="keyword">{kw["term"]}</span>' 
                for kw in topic.get('keywords', [])[:8]
            ])
            
            quality = topic.get('metrics', {}).get('quality_grade', 'Regular')
            quality_class = f"quality-{quality.lower().replace(' ', '-')}"
            
            html += f"""
                <div class="topic">
                    <h3 class="topic-title">🔍 {topic.get('topic_label', f'Tópico {i}')} 
                        <span class="keyword {quality_class}" style="float: right;">{quality}</span>
                    </h3>
                    
                    <p><strong>📋 Documentos:</strong> {topic.get('document_count', 0)} documentos</p>
                    
                    <div class="summary">
                        <h4>📝 Resumo:</h4>
                        <p>{topic.get('summary', 'Resumo não disponível')}</p>
                    </div>
                    
                    <h4>🔑 Palavras-chave:</h4>
                    <div class="keywords">{keywords_html}</div>
                    
                    <h4>📊 Métricas:</h4>
                    <div class="metrics">
            """
            
            metrics = topic.get('metrics', {})
            if 'combined_score' in metrics:
                html += f'<div class="metric"><strong>Score Geral</strong><br>{metrics["combined_score"]:.3f}</div>'
            if 'keyword_coverage' in metrics:
                html += f'<div class="metric"><strong>Cobertura</strong><br>{metrics["keyword_coverage"]:.1%}</div>'
            if 'compression_ratio' in metrics:
                html += f'<div class="metric"><strong>Compressão</strong><br>{metrics["compression_ratio"]:.1%}</div>'
            
            html += """
                    </div>
                </div>
            """
        
        html += """
                <div style="text-align: center; margin-top: 40px; padding: 20px; background: white; border-radius: 10px;">
                    <h3>🎯 Sistema SIGATA - Processamento Inteligente de Documentos</h3>
                    <p>Análise semântica avançada com fallback automático para máxima confiabilidade.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html

# Função de conveniência para uso direto
def analyze_meeting_minutes(documents: List[str], document_titles: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Função principal para análise de atas de reunião
    """
    service = SigataAdvancedNLP()
    return service.analyze_documents(documents, document_titles)

# Exemplo de uso
if __name__ == "__main__":
    # Teste rápido
    sample_docs = [
        "Reunião sobre implementação de sistema de IA avançado. Participantes discutiram tecnologias BERTopic, KeyBERT e cronograma robusto.",
        "Análise de orçamento do projeto PLI. Foram aprovados investimentos em infraestrutura de machine learning e treinamento especializado."
    ]
    
    print("🧪 Testando SIGATA Advanced NLP...")
    results = analyze_meeting_minutes(sample_docs)
    print(f"✅ Análise concluída: {len(results['topics'])} tópicos identificados")
    print(f"📊 Método usado: {results['method']}")
    print(f"🚀 Tecnologia: {results['metadata']['technology']}")
