from ..models import *
from ..serializers import *
from rest_framework import viewsets, permissions

class PruebaViewSet(viewsets.ModelViewSet):
    queryset = Prueba.objects.all()
    serializer_class = PruebaSerializer
    permission_classes = [permissions.AllowAny]
