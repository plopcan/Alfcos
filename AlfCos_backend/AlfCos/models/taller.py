from django.db import models

from .dia import Dia

class Taller(models.Model):
    n_taller = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=200)
    monitor = models.CharField(max_length=200)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    plazas = models.IntegerField()
    dia = models.ManyToManyField(Dia)

    def __str__(self):
        return self.nombre