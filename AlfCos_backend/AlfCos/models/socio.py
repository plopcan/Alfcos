import hashlib
import os
from django.db import models

from .sexo import Sexo

# Create your models here.

def upload_to(instance, filename):
    # Crear subcarpetas basadas en el hash del ID del socio
    hash_id = hashlib.md5(str(instance.n_socio).encode()).hexdigest()[:2]
    return os.path.join('socios', hash_id, filename)

class Socio(models.Model):
    n_socio = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    dni = models.CharField(max_length=9)
    telefono = models.CharField(max_length=10)
    email = models.EmailField(null=True, blank=True)
    direccion = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    pagado = models.BooleanField(default=True)
    foto = models.ImageField(upload_to=upload_to, null=True, blank=True)
    c_postal = models.CharField(max_length=5, default="")
    strickes = models.IntegerField(default=0)
    sexo = models.ForeignKey(Sexo, on_delete=models.SET_NULL, null=True, blank=True, to_field='sexo_id')

    def __str__(self):
        return self.nombre + " " + self.apellido
    
def get_socio_by_dni(dni):
    return Socio.objects.get(dni=dni)

def get_socio_by_id(id):
    return Socio.objects.get(n_socio=id)
