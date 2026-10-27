from django.db import models

class TipoEvento(models.Model):
    nombre = models.CharField(max_length=50)
    id = models.AutoField(primary_key=True)

    def __str__(self):
        return self.nombre