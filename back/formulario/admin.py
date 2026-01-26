from django.contrib import admin
from .models import (
    Viagem,
    Contratante,
    OrigemViagem,
    DestinoViagem,
    RetornoViagem,
    ParadasViagem,
    Passageiro,
    DadosAeroporto,
    ComentarioAdicional,
)

# Inline admins para mostrar dados relacionados dentro de Viagem
class ContratanteInline(admin.StackedInline):
    model = Contratante
    extra = 0

class OrigemViagemInline(admin.StackedInline):
    model = OrigemViagem
    extra = 0

class DestinoViagemInline(admin.StackedInline):
    model = DestinoViagem
    extra = 0

class RetornoViagemInline(admin.StackedInline):
    model = RetornoViagem
    extra = 0

class ParadasViagemInline(admin.TabularInline):
    model = ParadasViagem
    extra = 0

class PassageiroInline(admin.TabularInline):
    model = Passageiro
    extra = 0

class DadosAeroportoInline(admin.StackedInline):
    model = DadosAeroporto
    extra = 0

class ComentarioAdicionalInline(admin.StackedInline):
    model = ComentarioAdicional
    extra = 0

@admin.register(Viagem)
class ViagemAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome_contratante', 'cidade_destino', 'criado_em')
    ordering = ('-criado_em',)
    inlines = [
        ContratanteInline,
        OrigemViagemInline,
        DestinoViagemInline,
        RetornoViagemInline,
        ParadasViagemInline,
        PassageiroInline,
        DadosAeroportoInline,
        ComentarioAdicionalInline,
    ]

    def nome_contratante(self, obj):
        return obj.contratante.nome_contratante if hasattr(obj, 'contratante') else '-'
    nome_contratante.short_description = 'Contratante'

    def cidade_destino(self, obj):
        return obj.destino.cidade_destino if hasattr(obj, 'destino') else '-'
    cidade_destino.short_description = 'Destino'

@admin.register(Contratante)
class ContratanteAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'nome_contratante', 'cpf_cnpj_contratante')
    search_fields = ('nome_contratante', 'cpf_cnpj_contratante')

@admin.register(OrigemViagem)
class OrigemViagemAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'cidade_origem', 'estado_origem')
    search_fields = ('cidade_origem',)

@admin.register(DestinoViagem)
class DestinoViagemAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'cidade_destino', 'estado_destino')
    search_fields = ('cidade_destino',)

@admin.register(RetornoViagem)
class RetornoViagemAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'data_retorno', 'horario_retorno')

@admin.register(ParadasViagem)
class ParadasViagemAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'cidade_parada', 'horario_parada')
    search_fields = ('cidade_parada',)

@admin.register(Passageiro)
class PassageiroAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'nome_passageiro', 'idade_passageiro', 'rg_passageiro')
    search_fields = ('nome_passageiro', 'rg_passageiro')

@admin.register(DadosAeroporto)
class DadosAeroportoAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'dados_voo', 'horario_chegada_voo', 'quantidade_malas')

@admin.register(ComentarioAdicional)
class ComentarioAdicionalAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'comentario')

