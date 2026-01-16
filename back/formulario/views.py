from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import (
    Viagem, Contratante, OrigemViagem,
    DestinoViagem, RetornoViagem,
    ParadasViagem, Passageiro, DadosAeroporto
)
from .utils.pdf import gerar_pdf_viagem

class CriarViagemView(APIView):
    def post(self, request):
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

        DadosAeroporto.objects.create(
            viagem=viagem,
            **data["dados_aeroporto"]
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

        for p in data["passageiros"]:
            Passageiro.objects.create(
                viagem=viagem,
                **p
            )

        gerar_pdf_viagem(viagem)

        return Response(
            {
                "success": True,
                "viagem_id": viagem.id
            },
            status=status.HTTP_201_CREATED
        )
