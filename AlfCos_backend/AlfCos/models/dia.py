from django.db import models

class Dia(models.Model):
    dia = models.CharField(max_length=20, primary_key=True)

    def __str__(self):
        return self.dia