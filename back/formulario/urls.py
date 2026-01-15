from django.urls import path
from .views import CriarViagemView

urlpatterns = [
    path("enviar/", CriarViagemView.as_view()),
]
