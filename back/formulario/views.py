from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import (
    Viagem, Contratante, OrigemViagem,
    DestinoViagem, RetornoViagem,
    ParadasViagem, Passageiro, DadosAeroporto, ComentarioAdicional
)
from .utils.pdf import gerar_pdf_viagem, gerar_pdf_passageiros, enviar_pdf_por_email
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name="dispatch")
class CriarViagemView(APIView):
    def post(self, request):
        try:
            data = request.data

            viagem = Viagem.objects.create()

            Contratante.objects.create(
                viagem=viagem,
                **data["contratante"]
            )

            OrigemViagem.objects.create(
                viagem=viagem,
                **data["origem"]
            )

            DestinoViagem.objects.create(
                viagem=viagem,
                **data["destino"]
            )

            dados_aeroporto = data.get("dados_aeroporto")

            if isinstance(dados_aeroporto, dict) and dados_aeroporto:
                DadosAeroporto.objects.create(
                    viagem=viagem,
                    **dados_aeroporto
                )

            comentario_adicional = data.get("comentario_adicional")

            if comentario_adicional:
                if isinstance(comentario_adicional, str):
                    if comentario_adicional.strip():
                        ComentarioAdicional.objects.create(
                            viagem=viagem,
                            comentario=comentario_adicional.strip()
                        )
                elif isinstance(comentario_adicional, dict):
                    ComentarioAdicional.objects.create(
                        viagem=viagem,
                        **comentario_adicional
                    )

            dados_retorno = data.get("retorno")

            if dados_retorno:
                RetornoViagem.objects.create(
                    viagem=viagem,
                    **dados_retorno
                )

            for parada in data.get("paradas", []):
                ParadasViagem.objects.create(
                    viagem=viagem,
                    **parada
                )

            passageiros_list = data.get("passageiros", [])
            if passageiros_list:
                for p in data["passageiros"]:
                    Passageiro.objects.create(
                        viagem=viagem,
                        **p
                    )
                gerar_pdf_passageiros(viagem)

            gerar_pdf_viagem(viagem)

            enviar_pdf_por_email(viagem, viagem.contratante, "acciariturismo@gmail.com")

            return Response(
                {
                    "success": True,
                    "viagem_id": viagem.id
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"erro": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )