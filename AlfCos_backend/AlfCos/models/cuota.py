from django.db import models

from .socio import Socio

from .cuentas import Cuenta

class Cuota(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE)
    cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE)
    periodo = models.CharField(max_length=10)
    fecha = models.DateTimeField()

    class Meta:
        unique_together = ('socio', 'cuenta', 'fecha')