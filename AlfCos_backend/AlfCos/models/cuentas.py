from django.utils import timezone
from django.db import models

from .tipoCuenta import TipoCuenta

class Cuenta(models.Model):
    id_cuenta = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2) 
    fecha = models.DateTimeField(default=timezone.now)
    tipo = models.ForeignKey(TipoCuenta, on_delete=models.CASCADE)
    anulada = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.descripcion}: {self.cantidad} - {self.fecha} - {self.tipo}"