from django.db import models

from .tipoEvento import TipoEvento

# Create your models here.
class Evento(models.Model):
    id_evento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=200)
    fecha_ini = models.DateField()
    hora_ini = models.TimeField(null=True, blank=True)
    fecha_fin = models.DateField( null = True)
    num_grupos = models.IntegerField(default=0)
    n_asientos = models.IntegerField(default=0)
    mesas = models.IntegerField(default=0)
    cubiertos = models.IntegerField(default=0)
    usar_mesa = models.BooleanField(default=False)
    precio = models.DecimalField(max_digits=10, decimal_places=2) 
    tipo = models.ForeignKey(TipoEvento, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre + ": " + self.fecha_ini + " - " + self.fecha_fin
    
