from django.db import models
from .socio import Socio
from .taller import Taller

class Clase(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE)
    taller = models.ForeignKey(Taller, on_delete=models.CASCADE)
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('socio', 'taller')

    def __str__(self):
        return f'{self.socio} inscrito en {self.taller}'