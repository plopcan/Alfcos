from django.db import models

from .evento import Evento
from .socio import Socio

class ListaEspera(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE)
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('socio', 'evento')

    def __str__(self):
        return f'{self.socio} en lista de espera para {self.evento}'