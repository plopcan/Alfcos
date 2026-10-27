from rest_framework import serializers
from ..models import *

class CuentaSerializer(serializers.ModelSerializer):
    tipo_id = serializers.IntegerField(write_only=True)  # Campo para aceptar el ID del tipo
    tipo = serializers.CharField(source='tipo.tipo', read_only=True)  # Campo de solo lectura para devolver el nombre del tipo

    class Meta:
        model = Cuenta
        fields = (
            "id_cuenta", "cantidad", "fecha", "tipo", "tipo_id", "descripcion", "anulada"
        )
        read_only_fields = ("id_cuenta", "fecha", "tipo")  # 'tipo' es de solo lectura

    def create(self, validated_data):
        # Extrae el tipo_id de los datos validados
        tipo_id = validated_data.pop('tipo_id', None)
        if not tipo_id:
            raise serializers.ValidationError({"tipo_id": "Este campo es requerido."})

        # Busca el TipoCuenta correspondiente
        try:
            tipo = TipoCuenta.objects.get(id=tipo_id)
        except TipoCuenta.DoesNotExist:
            raise serializers.ValidationError({"tipo_id": "El tipo de cuenta proporcionado no existe."})

        # Asigna el tipo al validated_data y crea la instancia
        validated_data['tipo'] = tipo
        return super().create(validated_data)

class CuotaSerializer(serializers.ModelSerializer):
    periodo = serializers.ChoiceField(choices=[('1semestre', '1semestre'), ('2semestre', '2semestre'), ('anio', 'anio')])
    class Meta:
        model = Cuota
        fields = (
            "id_cuota", "n_socio", "fecha", "periodo"
        )
        read_only_fields = ("id_cuota", "fecha")

class CuentaEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaEvento
        fields = (
            "id_cuenta", "id_evento", "fecha", "subtipo"
        )
        read_only_fields = ("id_cuenta", "id_evento", "fecha", "subtipo")