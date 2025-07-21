import sys
from PyPDF2 import PdfReader

if len(sys.argv) < 3:
    print("Uso: temp_extract_pdf.py <input.pdf> <output.txt>")
    sys.exit(1)

pdf_path = sys.argv[1]
txt_path = sys.argv[2]

with open(txt_path, "w", encoding="utf-8") as out:
    reader = PdfReader(pdf_path)
    for page in reader.pages:
        text = page.extract_text()
        if text:
            out.write(text + "\n")
print(f"Texto extraído para {txt_path}")
