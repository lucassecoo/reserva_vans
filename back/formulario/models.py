from django.db import models

class Viagem(models.Model):
    criado_em = models.DateTimeField(auto_now_add=True)
    id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"Viagem #{self.id}"


class Contratante(models.Model):
    viagem = models.OneToOneField(
        Viagem,
        on_delete=models.CASCADE,
        related_name="contratante"
    )
    motivacao_viagem = models.CharField(max_length=200)
    nome_contratante = models.CharField(max_length=100)
    rg_contratante = models.CharField(max_length=20, blank=True, null=True)
    telefone_contratante = models.CharField(max_length=20)
    orgao_emissor_contratante = models.CharField(max_length=50)
    cpf_cnpj_contratante = models.CharField(max_length=20)
    cep_contratante = models.CharField(max_length=10)
    rua_contratante = models.CharField(max_length=100)
    numero_rua_contratante = models.CharField(max_length=10)
    complemento_contratante = models.CharField(max_length=100, blank=True, null=True)
    bairro_contratante = models.CharField(max_length=100)
    cidade_contratante = models.CharField(max_length=100)
    estado_contratante = models.CharField(max_length=50)

class OrigemViagem(models.Model):
    viagem = models.OneToOneField(Viagem, on_delete=models.CASCADE, related_name="origem")
    cep_origem = models.CharField(max_length=10)
    rua_origem = models.CharField(max_length=200)
    numero_rua_origem = models.CharField(max_length=10)
    complemento_origem = models.CharField(max_length=200, blank=True, null=True)
    cidade_origem = models.CharField(max_length=100)
    estado_origem = models.CharField(max_length=50)
    bairro_origem = models.CharField(max_length=50)
    data_saida = models.DateField()
    horario_saida = models.TimeField()

class DestinoViagem(models.Model):
    viagem = models.OneToOneField(Viagem, on_delete=models.CASCADE, related_name="destino")
    cep_destino = models.CharField(max_length=10)
    rua_destino = models.CharField(max_length=200)
    numero_rua_destino = models.CharField(max_length=10)
    complemento_destino = models.CharField(max_length=200, blank=True, null=True)
    cidade_destino = models.CharField(max_length=100)
    estado_destino = models.CharField(max_length=50)
    bairro_destino = models.CharField(max_length=50)

class RetornoViagem(models.Model):
    viagem = models.OneToOneField(Viagem, on_delete=models.CASCADE, related_name="retorno")
    data_retorno = models.DateField(null=True)
    horario_retorno = models.TimeField(null=True)

class ParadasViagem(models.Model):
    viagem = models.ForeignKey(
        Viagem,
        on_delete=models.CASCADE,
        related_name="paradas"
    )
    cep_parada = models.CharField(max_length=10)
    rua_parada = models.CharField(max_length=200)
    numero_rua_parada = models.CharField(max_length=10)
    complemento_parada = models.CharField(max_length=100, blank=True, null=True)
    cidade_parada = models.CharField(max_length=100)
    uf_parada = models.CharField(max_length=50)
    bairro_parada = models.CharField(max_length=50)
    horario_parada = models.TimeField()

class Passageiro(models.Model):
    viagem = models.ForeignKey(
        Viagem,
        on_delete=models.CASCADE,
        related_name="passageiros"
    )

    nome_passageiro = models.CharField(max_length=100)
    idade_passageiro = models.IntegerField()
    rg_passageiro = models.CharField(max_length=20)
    orgao_emissor_passageiro = models.CharField(max_length=50)

class DadosAeroporto(models.Model):
    viagem = models.OneToOneField(
        Viagem,
        on_delete=models.CASCADE,
        related_name="dados_aeroporto"
    )
    dados_voo = models.CharField(max_length=100, blank=True, null=True)
    horario_chegada_voo = models.TimeField(blank=True, null=True)
    quantidade_malas = models.IntegerField(blank=True, null=True)

class ComentarioAdicional(models.Model):
    viagem = models.OneToOneField(
        Viagem,
        on_delete=models.CASCADE,
        related_name="comentario_adicional"
    )
    comentario = models.TextField(blank=True, null=True)