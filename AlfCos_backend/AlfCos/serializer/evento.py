from rest_framework import serializers
from ..models import *

class AsientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asiento
        fields = (
            "id_evento", "n_asiento", "fecha", "n_grupo", "n_socio", 'mesa'
        )
        read_only_fields = ("id_evento",)
        extra_kwargs = {
            "n_socio": {"required": False},
        }


class EventoSerializer(serializers.ModelSerializer):
    tipo_id = serializers.IntegerField()  # Campo para aceptar el ID del tipo
    tipo = serializers.CharField(source='tipo.nombre', read_only=True)  # Campo de solo lectura para devolver el nombre del tipo
    plazasLibres = serializers.SerializerMethodField()
    nombre = serializers.CharField(
        trim_whitespace=True,
        required=True
    )
    cubiertos_libres = serializers.SerializerMethodField()
    class Meta:
        model = Evento
        fields = (
            "id_evento", "nombre", "fecha_ini", "fecha_fin", "precio", 
            "descripcion", "tipo", "tipo_id", "n_asientos", "num_grupos",
            "plazasLibres", "hora_ini", 'mesas', 'cubiertos', 'usar_mesa',
            'cubiertos_libres'
        )
        read_only_fields = ("id_evento",)

    def create(self, validated_data):
        # Extrae el tipo_id de los datos validados
        tipo_id = validated_data.pop('tipo_id', None)
        if not tipo_id:
            raise serializers.ValidationError({"tipo_id": "Este campo es requerido."})

        # Busca el TipoCuenta correspondiente
        try:
            tipo = TipoEvento.objects.get(id=tipo_id)
        except TipoCuenta.DoesNotExist:
            raise serializers.ValidationError({"tipo_id": "El tipo de cuenta proporcionado no existe."})

        # Asigna el tipo al validated_data y crea la instancia
        validated_data['tipo'] = tipo
        return super().create(validated_data)
    
    def get_plazasLibres(self, obj):
        # Calcula las plazas libres basándose en los asientos asociados al evento
        total_asientos = obj.n_asientos * obj.num_grupos
        asientos_ocupados = Asiento.objects.filter(id_evento=obj.id_evento, n_socio__isnull=False).count()
        return total_asientos - asientos_ocupados
    
    def get_cubiertos_libres(self, obj):
        cubiertos_libres = []
        if obj.usar_mesa:
            for mesa in range(1, obj.mesas + 1):
                cubiertos_ocupados = Asiento.objects.filter(id_evento=obj.id_evento, mesa=mesa).count()
                cubiertos_libres.append(obj.cubiertos - cubiertos_ocupados)
        return cubiertos_libres

class ListaEsperaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaEspera
        fields = (
            "id_evento", "n_socio", "fecha_inscripcion"
        )
        read_only_fields = ("id_evento",)