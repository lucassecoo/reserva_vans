from rest_framework import serializers
from .models import (
    Viagem,
    Contratante,
    OrigemViagem,
    DestinoViagem,
    RetornoViagem,
    ParadasViagem,
    Passageiro,
    DadosAeroporto
)

class ContratanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contratante
        exclude = ['id']


class OrigemViagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrigemViagem
        exclude = ['id']


class DestinoViagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinoViagem
        exclude = ['id']


class RetornoViagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetornoViagem
        exclude = ['id']


class ParadasViagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParadasViagem
        exclude = ['id', 'viagem']


class PassageiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passageiro
        exclude = ['id', 'viagem']

class DadosAeroportoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DadosAeroporto
        exclude = ['id', 'viagem']

class ViagemSerializer(serializers.ModelSerializer):
    contratante = ContratanteSerializer()
    origem = OrigemViagemSerializer()
    destino = DestinoViagemSerializer()
    retorno = RetornoViagemSerializer()
    paradas = ParadasViagemSerializer(many=True, required=False)
    passageiros = PassageiroSerializer(many=True)
    dados_aeroporto = DadosAeroportoSerializer(required=False)

    class Meta:
        model = Viagem
        fields = [
            'id',
            'criado_em',
            'contratante',
            'origem',
            'destino',
            'retorno',
            'paradas',
            'passageiros',
            'dados_aeroporto'
        ]

    def create(self, validated_data):
        """
        Criação completa da viagem com todos os relacionamentos
        """

        contratante_data = validated_data.pop('contratante')
        origem_data = validated_data.pop('origem')
        destino_data = validated_data.pop('destino')
        retorno_data = validated_data.pop('retorno')
        paradas_data = validated_data.pop('paradas', [])
        passageiros_data = validated_data.pop('passageiros')
        dados_aeroporto_data = validated_data.pop('dados_aeroporto', None)

        # cria a viagem
        viagem = Viagem.objects.create(**validated_data)

        # cria dados relacionados
        Contratante.objects.create(viagem=viagem, **contratante_data)
        OrigemViagem.objects.create(viagem=viagem, **origem_data)
        DestinoViagem.objects.create(viagem=viagem, **destino_data)
        RetornoViagem.objects.create(viagem=viagem, **retorno_data)

        if dados_aeroporto_data:
            DadosAeroporto.objects.create(viagem=viagem, **dados_aeroporto_data)

        for parada in paradas_data:
            ParadasViagem.objects.create(viagem=viagem, **parada)

        for passageiro in passageiros_data:
            Passageiro.objects.create(viagem=viagem, **passageiro)

        return viagem
