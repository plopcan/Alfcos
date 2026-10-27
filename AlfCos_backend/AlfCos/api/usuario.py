from ..models import Usuario
from ..serializers import UsuarioSerializer
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.hashers import check_password

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='buscar')
    def buscar_usuario(self, request):
        nombre = request.query_params.get('nombre')
        password = request.query_params.get('password')

        if nombre is not None and password is not None:
            try:
                usuario = Usuario.objects.get(nombre=nombre)
                if check_password(password, usuario.password):  # Verifica la contraseña
                    serializer = UsuarioSerializer(usuario)
                    return Response(serializer.data)
                else:
                    return Response({'error': 'Contraseña incorrecta'}, status=400)
            except Usuario.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=404)
        else:
            return Response({'error': 'Faltan parámetros nombre y/o contraseña'}, status=400)
        
    @action(detail=False, methods=['post'], url_path='buscarRegistrado')
    def buscar_Registrado(self, request):
        n_socio = request.data.get('n_socio')
        
        usuario = Usuario.objects.get(n_socio=n_socio)
        if n_socio is not None:
            serializer = UsuarioSerializer(usuario)
            return Response(serializer.data)
        else:
            return Response({'error': 'No se puedo cargar el usuario'}, status=400)