from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from ..models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(
        trim_whitespace=True,  # trim automático de espacios en blanco
        required=True
    )
    class Meta:
        model = Usuario
        fields = (
            "nombre", "n_socio", "password", "rol", "n_user"
        )
        read_only_fields = ("n_user",)

    def validate_password(self, value):
        if value and not value.startswith('pbkdf2_'):  # Evita encriptar una contraseña ya encriptada
            return make_password(value)
        return value

    def create(self, validated_data):
        validated_data['password'] = self.validate_password(validated_data.get('password'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = self.validate_password(validated_data.get('password'))
        return super().update(instance, validated_data)