from rest_framework import serializers

from ..models import Taller, Dia, Clase

class TallerSerializer(serializers.ModelSerializer):
    dia = serializers.PrimaryKeyRelatedField(many=True, queryset=Dia.objects.all())
    plazas_libres = serializers.SerializerMethodField()
    nombre = serializers.CharField(
        trim_whitespace=True,
        required=True
    )
    class Meta:
        model = Taller
        fields = ('n_taller', 'nombre', 'descripcion', 'monitor', 'hora_inicio', 'hora_fin', 'plazas', 'dia', 'plazas_libres')
        read_only_fields = ('n_taller',)
        depth = 1
        extra_kwargs = {
            "dia": {'required': False},
        }
    
    def get_plazas_libres(self, obj):
        plazasOcupadas = Clase.objects.filter(taller_id=obj.n_taller).count()
        return obj.plazas - plazasOcupadas
