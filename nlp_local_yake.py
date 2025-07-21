
import spacy
import yake

# Carrega modelo spaCy
nlp = spacy.load('pt_core_news_lg')

# Inicializa extrator YAKE
kw_extractor = yake.KeywordExtractor(lan="pt", n=1, top=10)

def extrair_keywords_yake(texto, top_n=10):
    keywords = kw_extractor.extract_keywords(texto)
    return [kw for kw, score in keywords]

def extrair_keywords_yake_por_topico(lista_topicos, top_n=5):
    resultados = []
    for topico in lista_topicos:
        kws = kw_extractor.extract_keywords(topico)
        selecionados = [kw for kw, score in kws[:top_n]]
        resultados.append(selecionados)
    return resultados

def processar_local(texto):
    doc = nlp(texto)

    entidades = []
    pessoas = set()
    orgs = set()
    locais = set()
    for ent in doc.ents:
        if ent.label_ in ['PER', 'PESSOA']:
            pessoas.add(ent.text)
        elif ent.label_ in ['ORG', 'ORGANIZACAO']:
            orgs.add(ent.text)
        elif ent.label_ in ['LOC', 'LUGAR']:
            locais.add(ent.text)
        entidades.append({'tipo': ent.label_, 'valor': ent.text})

    palavras_chave = extrair_keywords_yake(texto)
    topicos = texto.split('\n• ')

    palavras_chave_por_topico = extrair_keywords_yake_por_topico(topicos)

    return {
        'assunto': palavras_chave[0] if palavras_chave else '',
        'palavras_chave_gerais': palavras_chave,
        'topicos': topicos,
        'palavras_chave_por_topico': palavras_chave_por_topico,
        'pessoas_participantes': list(pessoas),
        'entidades_participantes': list(orgs),
        'locais': list(locais),
        'entidades': entidades,
        'resumo_geral': topicos[0] if topicos else '',
    }
