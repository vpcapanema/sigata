#!/usr/bin/env python3
"""
Analisador de Cores da Identidade Visual PLI
Extrai cores dominantes da imagem conteudo_identidade_visual_pli.jpg
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
    from collections import Counter
    import colorsys
except ImportError:
    print("Instalando dependências necessárias...")
    os.system("pip install Pillow numpy")
    from PIL import Image
    import numpy as np
    from collections import Counter
    import colorsys

def rgb_to_hex(rgb):
    """Converte RGB para HEX"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def get_color_name(rgb):
    """Tenta identificar o nome da cor baseado nos valores RGB"""
    r, g, b = rgb
    
    # Conversão para HSV para análise de cor
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    h = h * 360
    
    if v < 0.2:
        return "Preto"
    elif v > 0.9 and s < 0.1:
        return "Branco"
    elif s < 0.1:
        return "Cinza"
    elif 0 <= h < 15 or 345 <= h <= 360:
        return "Vermelho"
    elif 15 <= h < 45:
        return "Laranja"
    elif 45 <= h < 75:
        return "Amarelo"
    elif 75 <= h < 165:
        return "Verde"
    elif 165 <= h < 195:
        return "Ciano"
    elif 195 <= h < 255:
        return "Azul"
    elif 255 <= h < 285:
        return "Roxo/Violeta"
    elif 285 <= h < 315:
        return "Magenta"
    elif 315 <= h < 345:
        return "Rosa"
    else:
        return "Indefinido"

def extrair_cores_dominantes(caminho_imagem, num_cores=15):
    """Extrai as cores dominantes de uma imagem"""
    try:
        # Abrir a imagem
        imagem = Image.open(caminho_imagem)
        print(f"✅ Imagem carregada: {imagem.size} pixels")
        
        # Converter para RGB se necessário
        if imagem.mode != 'RGB':
            imagem = imagem.convert('RGB')
        
        # Manter tamanho original para melhor análise
        # imagem = imagem.resize((300, 300))
        
        # Converter para array numpy
        pixels = np.array(imagem)
        pixels = pixels.reshape(-1, 3)
        
        # Filtrar pixels muito claros (brancos) e muito escuros (pretos)
        # para focar nas cores reais da identidade visual
        pixels_filtrados = []
        for pixel in pixels:
            r, g, b = pixel
            # Evitar brancos puros e quase brancos
            if not (r > 250 and g > 250 and b > 250):
                # Evitar pretos puros e quase pretos
                if not (r < 30 and g < 30 and b < 30):
                    pixels_filtrados.append(tuple(pixel))
        
        print(f"📊 Pixels analisados: {len(pixels)} total, {len(pixels_filtrados)} filtrados")
        
        # Contar cores dos pixels filtrados
        contador_cores = Counter(pixels_filtrados)
        
        print(f"\n🎨 CORES DOMINANTES DA IDENTIDADE VISUAL PLI:")
        print("=" * 60)
        
        cores_principais = []
        total_pixels_filtrados = len(pixels_filtrados) if pixels_filtrados else len(pixels)
        
        for i, (cor, frequencia) in enumerate(contador_cores.most_common(num_cores)):
            porcentagem = (frequencia / total_pixels_filtrados) * 100
            hex_cor = rgb_to_hex(cor)
            nome_cor = get_color_name(cor)
            
            if porcentagem > 0.1:  # Mostrar cores com mais de 0.1% de presença
                print(f"{i+1:2d}. {nome_cor:15} | RGB{cor} | {hex_cor} | {porcentagem:5.1f}%")
                cores_principais.append({
                    'rgb': cor,
                    'hex': hex_cor,
                    'nome': nome_cor,
                    'porcentagem': porcentagem
                })
        
        # Se não encontrou cores filtradas, usar análise completa
        if not cores_principais:
            print("\n⚠️  Análise filtrada não encontrou cores. Usando análise completa...")
            cores_unicas = [tuple(pixel) for pixel in pixels]
            contador_cores = Counter(cores_unicas)
            
            for i, (cor, frequencia) in enumerate(contador_cores.most_common(num_cores)):
                porcentagem = (frequencia / len(cores_unicas)) * 100
                hex_cor = rgb_to_hex(cor)
                nome_cor = get_color_name(cor)
                
                if porcentagem > 0.5:
                    print(f"{i+1:2d}. {nome_cor:15} | RGB{cor} | {hex_cor} | {porcentagem:5.1f}%")
                    cores_principais.append({
                        'rgb': cor,
                        'hex': hex_cor,
                        'nome': nome_cor,
                        'porcentagem': porcentagem
                    })
        
        return cores_principais
        
    except Exception as e:
        print(f"❌ Erro ao processar imagem: {e}")
        return []

def gerar_css_variaveis(cores):
    """Gera variáveis CSS baseadas nas cores principais do PLI"""
    if len(cores) < 3:
        print("⚠️ Menos de 3 cores encontradas")
        return ""
    
    css = """/* ========================================
   IDENTIDADE VISUAL PLI - CORES OFICIAIS
   Extraído de: conteudo_identidade_visual_pli.jpg
======================================== */

:root {
    /* CORES PRINCIPAIS PLI */
"""
    
    # Nomes mais específicos baseados nas cores encontradas
    nomes_mapping = {
        'Azul': 'azul',
        'Verde': 'verde', 
        'Preto': 'preto',
        'Vermelho': 'vermelho',
        'Amarelo': 'amarelo'
    }
    
    for i, cor in enumerate(cores):
        nome_base = nomes_mapping.get(cor['nome'], cor['nome'].lower())
        css += f"    --pli-{nome_base}-{i+1}: {cor['hex']}; /* {cor['nome']} - {cor['porcentagem']:.1f}% */\n"
        css += f"    --pli-{nome_base}-{i+1}-rgb: {cor['rgb'][0]}, {cor['rgb'][1]}, {cor['rgb'][2]};\n"
    
    # Definir cores funcionais
    css += f"""
    /* CORES FUNCIONAIS PLI */
    --pli-primary: {cores[0]['hex']};      /* Cor principal */
    --pli-secondary: {cores[1]['hex'] if len(cores) > 1 else cores[0]['hex']};    /* Cor secundária */
    --pli-accent: {cores[2]['hex'] if len(cores) > 2 else cores[0]['hex']};       /* Cor de destaque */
    --pli-text: {cores[-1]['hex'] if any(c['nome'] == 'Preto' for c in cores) else '#171e31'};         /* Cor do texto */
    
    /* GRADIENTES PLI OFICIAIS */
    /* Gradiente Principal: Verde claro → Preto (passando pelas intermediárias) */
    --pli-gradient-main: linear-gradient(135deg, 
        #bfe5b2 0%,      /* Verde claro */
        #5cb65c 25%,     /* Verde médio */
        #244b72 50%,     /* Azul médio */
        #0f203e 75%,     /* Azul escuro */
        #171e31 100%     /* Preto */
    );
    
    /* Gradiente Secundário: Verde principal → Azul (passando pelas secundárias) */
    --pli-gradient-secondary: linear-gradient(135deg,
        #5cb65c 0%,      /* Verde principal */
        #bfe5b2 33%,     /* Verde claro */
        #afb4c7 66%,     /* Azul claro */
        #244b72 100%     /* Azul médio */
    );
    
    /* ELEMENTOS DE APOIO */
    --pli-background: #ffffff;
    --pli-surface: #f8f9fa;
    --pli-border: #e9ecef;
}}

/* CLASSES UTILITÁRIAS PLI */
.pli-primary {{ background-color: var(--pli-primary); color: white; }}
.pli-secondary {{ background-color: var(--pli-secondary); color: white; }}
.pli-accent {{ background-color: var(--pli-accent); color: white; }}

/* TIPOGRAFIA PLI */
.pli-title {{
    font-family: 'Montserrat', 'Arial', sans-serif;
    font-weight: bold;
    color: var(--pli-primary);
}}

.pli-text {{
    font-family: 'Montserrat', 'Arial', sans-serif;
    color: var(--pli-text);
    line-height: 1.6;
}}

/* VARIAÇÕES MONTSERRAT PLI */
.pli-montserrat-light {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 300;
}}

.pli-montserrat-regular {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
}}

.pli-montserrat-medium {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
}}

.pli-montserrat-semibold {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
}}

.pli-montserrat-bold {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
}}

.pli-montserrat-extrabold {{
    font-family: 'Montserrat', sans-serif;
    font-weight: 800;
}}
"""
    
    return css

def main():
    """Função principal"""
    print("🏛️  ANALISADOR DE IDENTIDADE VISUAL PLI")
    print("=" * 50)
    
    # Caminho da imagem
    caminho_imagem = Path("IDENTIDADE_VISUAL_PLI/conteudo_identidade_visual_pli.jpg")
    
    if not caminho_imagem.exists():
        print(f"❌ Arquivo não encontrado: {caminho_imagem}")
        return
    
    print(f"📁 Analisando: {caminho_imagem}")
    
    # Extrair cores
    cores = extrair_cores_dominantes(caminho_imagem)
    
    if cores:
        print(f"\n📋 AS 4 CORES PRINCIPAIS DO PLI:")
        print("=" * 50)
        
        # Filtrar cores significativas (incluindo preto, excluindo apenas branco/cinza)
        cores_reais = []
        for cor in cores:
            if cor['nome'] not in ['Branco', 'Cinza'] and cor['porcentagem'] > 0.5:
                cores_reais.append(cor)
        
        # Separar cores principais das de apoio
        cores_principais = cores_reais[:5]  # Top 5 cores incluindo preto
        
        print("🎨 PALETA OFICIAL PLI COMPLETA:")
        print("\n🎯 CORES PRINCIPAIS:")
        for i, cor in enumerate(cores_principais, 1):
            print(f"   {i}. {cor['nome']:15} {cor['hex']:8} RGB{cor['rgb']} ({cor['porcentagem']:.1f}%)")
        
        # Identificar elementos de apoio (cores com menor presença)
        cores_apoio = [c for c in cores if c['nome'] in ['Cinza', 'Branco'] and c['porcentagem'] > 0.1]
        if cores_apoio:
            print(f"\n🔧 ELEMENTOS DE APOIO:")
            for cor in cores_apoio[:3]:
                print(f"   • {cor['nome']:15} {cor['hex']:8} RGB{cor['rgb']} ({cor['porcentagem']:.1f}%)")
        
        return cores_principais
        
        # Gerar CSS completo
        css_content = gerar_css_variaveis(cores_principais)
        
        # Salvar CSS
        with open("pli_cores_oficiais.css", "w", encoding="utf-8") as f:
            f.write(css_content)
        
        print(f"\n✅ Arquivo CSS gerado: pli_cores_oficiais.css")
        
        # Análise adicional de elementos de apoio
        print(f"\n📋 ELEMENTOS DE IDENTIDADE VISUAL DETECTADOS:")
        print("-" * 50)
        print("🎨 Paleta de cores: Azul institucional + Verde + Preto")
        print("🔤 Tipografia oficial: Montserrat (Light, Regular, Medium, SemiBold, Bold, ExtraBold)")
        print("📐 Estilo: Institucional, profissional, confiável")
        print("🎯 Aplicação: Gradientes verde-preto (principal) e verde-azul (secundário)")
        
        print(f"\n📋 VARIÁVEIS CSS PRINCIPAIS:")
        print("-" * 30)
        for cor in cores_principais[:3]:
            print(f"--pli-{cor['nome'].lower()}: {cor['hex']}")
        
    else:
        print("❌ Não foi possível extrair cores da imagem")

if __name__ == "__main__":
    main()
