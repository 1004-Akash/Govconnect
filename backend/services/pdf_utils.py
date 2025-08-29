from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import tempfile
import json

def json_to_pdf(json_data: dict, title: str = "Document") -> str:
    """Converts JSON data to a PDF file and returns the file path."""
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    c = canvas.Canvas(temp_pdf.name, pagesize=letter)
    width, height = letter
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, height - 72, title)
    c.setFont("Helvetica", 10)
    y = height - 100
    def draw_dict(d, indent=0):
        nonlocal y
        for k, v in d.items():
            line = f"{'  '*indent}{k}: {v if not isinstance(v, dict) else ''}"
            c.drawString(72, y, line[:100])
            y -= 14
            if y < 72:
                c.showPage()
                y = height - 72
            if isinstance(v, dict):
                draw_dict(v, indent+1)
    draw_dict(json_data)
    c.save()
    return temp_pdf.name
