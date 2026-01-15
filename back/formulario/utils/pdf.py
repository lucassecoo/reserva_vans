from reportlab.pdfgen import canvas
import os
from django.conf import settings

def gerar_pdf(passageiro):
    path = os.path.join(settings.MEDIA_ROOT, f"form_{passageiro.id}.pdf")
    c = canvas.Canvas(path)

    c.drawString(100, 800, f"Nome: {passageiro.nome}")
    c.drawString(100, 780, f"Telefone: {passageiro.telefone}")
    c.drawString(100, 760, f"Email: {passageiro.email}")
    c.drawString(100, 740, f"Origem: {passageiro.origem}")
    c.drawString(100, 720, f"Destino: {passageiro.destino}")
    c.drawString(100, 700, f"Data: {passageiro.data}")
    c.drawString(100, 680, f"Horário: {passageiro.horario}")

    c.save()
    return path
