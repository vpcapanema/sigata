import os
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch

def create_pdf():
    try:
        # Ler o arquivo TXT
        with open('teste_ata_sigata.txt', 'r', encoding='utf-8') as f:
            content = f.read()

        # Criar PDF
        doc = SimpleDocTemplate('teste_ata_sigata.pdf', pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Dividir em linhas e processar
        lines = content.split('\n')
        for line in lines:
            if line.strip():
                if line.isupper() or line.startswith('ATA DE'):
                    # Título
                    p = Paragraph(line, styles['Title'])
                elif line.startswith('Data:') or line.startswith('Local:'):
                    # Subtítulo
                    p = Paragraph(line, styles['Heading2'])
                elif any(line.startswith(h) for h in ['PARTICIPANTES:', 'ASSUNTOS', 'DECISÕES', 'PRÓXIMOS', 'OBSERVAÇÕES:']):
                    # Headers
                    p = Paragraph(line, styles['Heading1'])
                else:
                    # Texto normal
                    p = Paragraph(line, styles['Normal'])
                story.append(p)
                story.append(Spacer(1, 0.1*inch))

        # Gerar PDF
        doc.build(story)
        print('✅ PDF criado com sucesso: teste_ata_sigata.pdf')
        
    except Exception as e:
        print(f'❌ Erro ao criar PDF: {e}')

if __name__ == '__main__':
    create_pdf()
