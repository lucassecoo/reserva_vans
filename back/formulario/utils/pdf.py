import os
from django.conf import settings
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from django.core.mail import EmailMessage
import logging
import threading
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
from django.conf import settings

logger = logging.getLogger(__name__)

def v(valor):
    """
    Helper: evita None no PDF
    """
    return str(valor) if valor not in [None, ""] else ""


def gerar_pdf_viagem(viagem):
    path = os.path.join(
        settings.MEDIA_ROOT,
        f"viagem_{viagem.id}.pdf"
    )

    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Modern title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=28
    )

    # Modern heading style
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=12,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderColor=colors.HexColor('#2563eb'),
        borderPadding=0,
        leftIndent=0,
        leading=18
    )

    # Modern normal text style
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        leading=16,
        fontName='Helvetica'
    )

    subheading_style = ParagraphStyle(
        name="SubHeading",
        parent=heading_style,
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#374151"),
    )

    elementos = []

    # =========================
    # TÍTULO
    # =========================
    elementos.append(
        Paragraph(
            f"<b>FORMULÁRIO DE VIAGEM</b><br/><font size='14'>Nº {viagem.id}</font>",
            title_style
        )
    )
    elementos.append(Spacer(1, 30))

    # =========================
    # CONTRATANTE
    # =========================
    c = getattr(viagem, "contratante", None)

    elementos.append(Paragraph("Dados do Contratante", heading_style))
    elementos.append(Spacer(1, 12))

    tabela_contratante = Table([
        ["Nome", v(getattr(c, "nome_contratante", ""))],
        ["CPF / CNPJ", v(getattr(c, "cpf_cnpj_contratante", ""))],
        ["RG", v(getattr(c, "rg_contratante", ""))],
        ["Órgão Emissor", v(getattr(c, "orgao_emissor_contratante", ""))],
        ["Telefone", v(getattr(c, "telefone_contratante", ""))],
        ["Motivação da viagem", v(getattr(c, "motivacao_viagem", ""))],
    ], colWidths=[140, 340])

    tabela_contratante.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    elementos.append(tabela_contratante)
    elementos.append(Spacer(1, 24))

    # =========================
    # DADOS DE AEROPORTO (opcional)
    # =========================
    a = getattr(viagem, "dados_aeroporto", None)

    if a:
        elementos.append(Paragraph("Dados do Aeroporto", heading_style))
        elementos.append(Spacer(1, 12))

        tabela_aeroporto = Table([
            ["Voo", v(a.dados_voo)],
            ["Horário de Chegada", v(a.horario_chegada_voo)],
            ["Quantidade de Malas", v(a.quantidade_malas)],
        ], colWidths=[140, 340])

        tabela_aeroporto.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
            ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))

        elementos.append(tabela_aeroporto)


    # =========================
    # ORIGEM
    # =========================
    o = getattr(viagem, "origem", None)

    elementos.append(Paragraph("Origem da Viagem", heading_style))
    elementos.append(Spacer(1, 12))

    tabela_origem = Table([
        ["Endereço", f"{v(o.rua_origem)} {v(o.numero_rua_origem)} {v(o.complemento_origem)}"],
        ["Bairro", v(o.bairro_origem)],
        ["Cidade / Estado", f"{v(o.cidade_origem)} / {v(o.estado_origem)}"],
        ["CEP", v(o.cep_origem)],
        ["Data de Saída", v(o.data_saida)],
        ["Horário de Saída", v(o.horario_saida)],
    ], colWidths=[140, 340])

    tabela_origem.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    elementos.append(tabela_origem)
    elementos.append(Spacer(1, 48))

    # =========================
    # DESTINO
    # =========================
    d = getattr(viagem, "destino", None)

    elementos.append(Paragraph("Destino da Viagem", heading_style))
    elementos.append(Spacer(1, 12))

    tabela_destino = Table([
        ["Endereço", f"{v(d.rua_destino)} {v(d.numero_rua_destino)} {v(d.complemento_destino)}"],
        ["Bairro", v(d.bairro_destino)],
        ["Cidade / Estado", f"{v(d.cidade_destino)} / {v(d.estado_destino)}"],
        ["CEP", v(d.cep_destino)],
    ], colWidths=[140, 340])

    tabela_destino.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    elementos.append(tabela_destino)
    elementos.append(Spacer(1, 24))

    # =========================
    # PARADAS (opcional)
    # =========================
    paradas = viagem.paradas.all()

    elementos.append(Spacer(1, 36))
    elementos.append(Paragraph("Paradas", heading_style))
    elementos.append(Spacer(1, 12))

    if paradas.exists():
        for idx, p in enumerate(paradas, start=1):
            elementos.append(
                Paragraph(f"Parada {idx}", subheading_style)
            )
            elementos.append(Spacer(1, 8))

            tabela_parada = Table([
                ["Endereço", f"{v(p.rua_parada)} {v(p.numero_rua_parada)} {v(p.complemento_parada)}"],
                ["Bairro", v(p.bairro_parada)],
                ["Cidade / UF", f"{v(p.cidade_parada)} / {v(p.uf_parada)}"],
                ["CEP", v(p.cep_parada)],
                ["Horário", v(p.horario_parada)],
                ["Complemento", v(p.complemento_parada)],
            ], colWidths=[140, 340])

            tabela_parada.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))

            elementos.append(tabela_parada)
            elementos.append(Spacer(1, 24))
    else:
        elementos.append(
            Paragraph("Nenhuma parada cadastrada.", normal_style)
        )

    # =========================
    # RETORNO (opcional)
    # =========================
    r = getattr(viagem, "retorno", None)

    if r:
        elementos.append(Paragraph("Retorno", heading_style))
        elementos.append(Spacer(1, 12))

        tabela_retorno = Table([
            ["Data de Retorno", v(r.data_retorno)],
            ["Horário de Retorno", v(r.horario_retorno)],
        ], colWidths=[140, 340])

        tabela_retorno.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor('#1f2937')),
            ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor('#374151')),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))

        elementos.append(tabela_retorno)
        elementos.append(Spacer(1, 24))
    else:
        elementos.append(Paragraph("Retorno", heading_style))
        elementos.append(Spacer(1, 12))
        elementos.append(Paragraph("Sem retorno cadastrado.", normal_style))

    # =========================
    # PASSAGEIROS
    # =========================
    elementos.append(Paragraph("Lista de Passageiros", heading_style))
    elementos.append(Spacer(1, 12))

    qs_passageiros = viagem.passageiros.all()

    if qs_passageiros.exists():
        passageiros_data = [["Nome", "Idade", "RG", "Órgão Emissor"]]

        for p in qs_passageiros:
            passageiros_data.append([
                v(p.nome_passageiro),
                v(p.idade_passageiro),
                v(p.rg_passageiro),
                v(p.orgao_emissor_passageiro),
            ])

        tabela_passageiros = Table(passageiros_data, colWidths=[200, 60, 120, 100])

        tabela_passageiros.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("FONTSIZE", (0, 1), (-1, -1), 10),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor('#374151')),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))

        elementos.append(tabela_passageiros)

    else:
        texto_aviso = Paragraph("Viagem é dentro de Curitiba", styles['Normal'])
        elementos.append(texto_aviso)

    elementos.append(Spacer(1, 24))

    # =========================
    # COMENTARIOS ADICIONAIS
    # =========================
    comentario_obj = getattr(viagem, "comentario_adicional", None)

    elementos.append(Paragraph("Comentários", heading_style))
    elementos.append(Spacer(1, 12))

    if comentario_obj and comentario_obj.comentario:
        texto_comentarios = comentario_obj.comentario.replace("\n", "<br/>")
        elementos.append(Paragraph(texto_comentarios, normal_style))
    else:
        elementos.append(Paragraph("Sem comentários cadastrados.", normal_style))

    elementos.append(Spacer(1, 24))

    # =========================
    # FINALIZA PDF
    # =========================
    doc.build(elementos)

    return path

def gerar_pdf_passageiros(viagem):
    path = os.path.join(
        settings.MEDIA_ROOT,
        f"passageiros_{viagem.id}.pdf"
    )

    styles = getSampleStyleSheet()

    # Modern title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=28
    )

    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50,
    )

    # Modern heading style
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=12,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderColor=colors.HexColor('#2563eb'),
        borderPadding=0,
        leftIndent=0,
        leading=18
    )

    elementos = []

    elementos.append(
        Paragraph(
            f"<b>Lista de passageiros</b><br/><font size='14'>Viagem Nº {viagem.id}</font>",
            title_style
        )
    )

    elementos.append(Paragraph("Lista de Passageiros", heading_style))
    elementos.append(Spacer(1, 12))

    qs_passageiros = viagem.passageiros.all()

    if qs_passageiros.exists():
        passageiros_data = [["Nome", "Idade", "RG", "Órgão Emissor"]]

        for p in qs_passageiros:
            passageiros_data.append([
                v(p.nome_passageiro),
                v(p.idade_passageiro),
                v(p.rg_passageiro),
                v(p.orgao_emissor_passageiro),
            ])

        tabela_passageiros = Table(passageiros_data, colWidths=[200, 60, 120, 100])

        tabela_passageiros.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("FONTSIZE", (0, 1), (-1, -1), 10),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor('#374151')),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))

        elementos.append(tabela_passageiros)

    doc.build(elementos)

    return path

def enviar_email_sendgrid(email_destino, assunto, corpo, anexos_paths=[]):
    message = Mail(
        from_email=settings.DEFAULT_FROM_EMAIL,
        to_emails=email_destino,
        subject=assunto,
        plain_text_content=corpo
    )

    # Adiciona todos os anexos
    for path in anexos_paths:
        if os.path.exists(path):
            with open(path, "rb") as f:
                data = f.read()
                encoded = base64.b64encode(data).decode()
                attachment = Attachment(
                    FileContent(encoded),
                    FileName(os.path.basename(path)),
                    FileType("application/pdf"),
                    Disposition("attachment")
                )
                message.add_attachment(attachment)

    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email enviado para {email_destino}, status: {response.status_code}")
    except Exception as e:
        logger.error(f"Erro ao enviar email via SendGrid: {e}")

def enviar_pdf_por_email(viagem, contratante, email_destino):
    caminho_passageiros = os.path.join(
        settings.MEDIA_ROOT,
        f"passageiros_{viagem.id}.pdf"
    )

    caminho_viagem = os.path.join(
        settings.MEDIA_ROOT,
        f"viagem_{viagem.id}.pdf"
    )

    assunto = f"Dados da viagem {viagem.id} - {contratante.nome_contratante}"
    corpo = (
        "Olá,\n\n"
        f"Segue em anexo os PDFs com os dados da viagem do contratante "
        f"{contratante.nome_contratante}.\n\n"
        "Atenciosamente,\n"
        "Sistema de Reservas"
    )

    anexos = []
    if os.path.exists(caminho_passageiros):
        anexos.append(caminho_passageiros)
    if os.path.exists(caminho_viagem):
        anexos.append(caminho_viagem)

    # Envio assíncrono
    threading.Thread(
        target=enviar_email_sendgrid,
        args=(email_destino, assunto, corpo, anexos)
    ).start()
