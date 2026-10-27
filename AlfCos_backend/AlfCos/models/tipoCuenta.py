from django.db import models

class TipoCuenta(models.Model):
    id = models.AutoField(primary_key=True) 
    tipo = models.CharField(max_length=20, unique=True)  # Cambia primary_key=True a unique=True