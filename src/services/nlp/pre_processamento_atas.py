
from pdfminer.high_level import extract_text
import re
import os

def preprocessar_ata(arquivo, salvar_tagged=True):
    """
    Recebe caminho de um arquivo PDF ou TXT de ata institucional,
    retorna texto tagueado por blocos: [HEADER], [PARTICIPANTES], [CONTEUDO], [ENCAMINHAMENTOS].
    Salva (opcionalmente) o arquivo tagueado no mesmo diretório do arquivo original.
    """
    # Detecta tipo de arquivo
    if arquivo.lower().endswith(".pdf"):
        texto = extract_text(arquivo)
    elif arquivo.lower().endswith(".txt"):
        with open(arquivo, encoding="utf-8") as f:
            texto = f.read()
    else:
        raise Exception("Formato não suportado ainda")
    tagged = taguear_ata(texto)
    if salvar_tagged:
        out_path = os.path.splitext(arquivo)[0] + "_TAGGED.txt"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(tagged)
    return tagged

def taguear_ata(texto):
    """
    Separa blocos da ata institucional e retorna texto tagueado.
    """
    linhas = [l.strip() for l in texto.split('\n') if l.strip()]
    i = 0
    # Título: primeira linha não vazia
    titulo = linhas[0] if linhas else ""
    i += 1
    # Data/Hora
    data_hora = ""
    for idx, l in enumerate(linhas[i:i+3]):
        if re.search(r'\d{2}/\d{2}.*\d{2}:\d{2}', l) or re.search(r'\d{2}/\d{2}/\d{4}', l):
            data_hora = l
            i += idx + 1
            break
    # Participantes
    participantes = ""
    for idx, l in enumerate(linhas[i:i+4]):
        if l.lower().startswith("presentes") or l.lower().startswith("participantes"):
            participantes = l
            i += idx + 1
            break
    # Encaminhamentos/conclusões
    encaminha_idx = None
    for idx, l in enumerate(linhas[i:]):
        if any(word in l.lower() for word in ["encaminhamento", "conclusão", "deliberação", "decisão"]):
            encaminha_idx = i + idx
            break
    if encaminha_idx is not None:
        conteudo = "\n".join(linhas[i:encaminha_idx])
        encaminhamentos = "\n".join(linhas[encaminha_idx:])
    else:
        conteudo = "\n".join(linhas[i:])
        encaminhamentos = ""
    # Monta texto tagueado
    tagged = []
    tagged.append("[HEADER]")
    tagged.append(f"Título: {titulo}")
    tagged.append(f"Data/Hora: {data_hora}")
    tagged.append("")
    if participantes:
        tagged.append("[PARTICIPANTES]")
        tagged.append(participantes)
        tagged.append("")
    tagged.append("[CONTEUDO]")
    tagged.append(conteudo)
    tagged.append("")
    if encaminhamentos.strip():
        tagged.append("[ENCAMINHAMENTOS]")
        tagged.append(encaminhamentos)
        tagged.append("")
    return "\n".join(tagged)

def extrair_bloco(tagged_txt, tag="CONTEUDO"):
    """
    Extrai o conteúdo de um bloco específico ([TAG]) de um texto tagueado.
    """
    m = re.search(rf'\[{tag}\](.*?)\n\[', tagged_txt, flags=re.DOTALL)
    if m:
        return m.group(1).strip()
    # Se for o último bloco
    m = re.search(rf'\[{tag}\](.*)', tagged_txt, flags=re.DOTALL)
    if m:
        return m.group(1).strip()
    return ""
