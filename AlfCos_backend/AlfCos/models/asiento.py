from django.db import models

from .socio import Socio
from .evento import Evento


# Create your models here.
class Asiento(models.Model):
    n_asiento = models.IntegerField()
    fecha = models.DateField(null=True, blank=True)
    n_grupo = models.IntegerField()
    mesa = models.IntegerField(default=0)
    n_socio = models.ForeignKey(Socio, on_delete=models.SET_NULL, null=True, blank=True)
    id_evento = models.ForeignKey(Evento, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['id_evento', 'n_grupo', 'n_asiento'], name='unique_asiento')
        ]


    @staticmethod
    def crear_asientos_para_evento(evento, cantidad_grupos, asientos_por_grupo):
        for grupo in range(1, cantidad_grupos + 1):
            for asiento in range(1, asientos_por_grupo + 1):
                Asiento.objects.create(
                    n_asiento=asiento,
                    n_grupo=grupo,
                    id_evento=evento
                )

