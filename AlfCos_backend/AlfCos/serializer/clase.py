from rest_framework import serializers
from ..models import *

class ClaseSerializer(serializers.ModelSerializer):
    taller = serializers.PrimaryKeyRelatedField(queryset=Taller.objects.all())
    socio = serializers.PrimaryKeyRelatedField(queryset=Socio.objects.all())

    class Meta:
        model = Clase
        fields = ('socio', 'taller', 'fecha_inscripcion')
        read_only_fields = ('fecha_inscripcion',)