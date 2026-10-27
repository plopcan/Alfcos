from rest_framework import serializers
from ..models import Prueba

class PruebaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prueba
        fields = (
            "nombre", "telefono"
        )
        extra_kwargs = {
            "telefono": {"required": False},
        }