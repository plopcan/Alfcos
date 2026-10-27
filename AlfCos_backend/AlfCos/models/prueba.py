from django.db import models

class Prueba(models.Model):
    nombre = models.CharField(max_length=50)
    telefono = models.CharField(max_length=10)

    def __str__(self):
        return self.nombre + " " + self.apellido