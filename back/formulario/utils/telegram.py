import telegram

BOT_TOKEN = "SEU_TOKEN_AQUI"
CHAT_ID = "SEU_CHAT_ID"

def enviar_pdf_telegram(pdf_path, nome_cliente):
    bot = telegram.Bot(token=BOT_TOKEN)
    bot.send_document(
        chat_id=CHAT_ID,
        document=open(pdf_path, "rb"),
        caption=f"Novo formulário enviado por {nome_cliente}"
    )
