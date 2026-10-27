from django.db import models

class Sexo(models.Model):
    nombre = models.CharField(max_length=50)
    sexo_id = models.AutoField(primary_key=True)

    def __str__(self):
        return self.nombre