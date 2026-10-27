from django.contrib.auth.hashers import make_password, check_password
from django.db import models

from .socio import Socio
class Usuario(models.Model):
    n_socio = models.OneToOneField(Socio, on_delete=models.SET_NULL, null=True)  # Clave foránea y primaria
    nombre = models.CharField(max_length=50)
    rol = models.CharField(max_length=50)
    password = models.CharField(max_length=128)  # Aumenta el tamaño para almacenar contraseñas encriptadas
    n_user = models.AutoField(primary_key=True)

    def save(self, *args, **kwargs):
        # Encripta la contraseña antes de guardarla
        if self.password and not self.password.startswith('pbkdf2_'):  # Evita encriptar una contraseña ya encriptada
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre