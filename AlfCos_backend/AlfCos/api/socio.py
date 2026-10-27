from ..models import Socio
from ..serializers import SocioSerializer
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from datetime import datetime
from ..models import Cuota
from django.utils.timezone import now, make_aware
from .utils import tomarFecha
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
from weasyprint import HTML

class SocioViewSet(viewsets.ModelViewSet):
    queryset = Socio.objects.all()
    serializer_class = SocioSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)  # Permitir subida de archivos

    def create(self, request, *args, **kwargs):
        try:
            # Extraer datos del formulario
            data = request.data
            foto = request.FILES.get('foto')  # Obtener la imagen si está presente
            print("Data:", data)  # Verifica los datos recibidos
            # Crear el socio
            socio = Socio.objects.create(
                nombre=data.get('nombre'),
                apellido=data.get('apellido'),
                dni=data.get('dni'),
                telefono=data.get('telefono'),
                c_postal=data.get('c_postal'),
                email=data.get('email'),
                direccion=data.get('direccion'),
                fecha_nacimiento=data.get('fecha_nacimiento'),
                pagado=data.get('pagado', True),
                sexo_id=data.get('sexo_id'),  # Relación con la tabla Sexo
                foto=foto  # Asignar la imagen
            )
        
            # Serializar y devolver la respuesta
            serializer = self.get_serializer(socio)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def update(self, request, *args, **kwargs):
        try:
            # Obtener el socio por su ID (pk)
            partial = kwargs.pop('partial', False)  # Permitir actualizaciones parciales
            instance = self.get_object()

            # Extraer datos del formulario
            data = request.data
            foto = request.FILES.get('foto')  # Obtener la imagen si está presente

            # Actualizar los campos del socio
            instance.nombre = data.get('nombre', instance.nombre)
            instance.apellido = data.get('apellido', instance.apellido)
            instance.dni = data.get('dni', instance.dni)
            instance.telefono = data.get('telefono', instance.telefono)
            instance.c_postal = data.get('c_postal', instance.c_postal)
            instance.email = data.get('email', instance.email)
            instance.direccion = data.get('direccion', instance.direccion)
            instance.fecha_nacimiento = data.get('fecha_nacimiento', instance.fecha_nacimiento)
            instance.pagado = data.get('pagado', instance.pagado)
            instance.sexo_id = data.get('sexo_id', instance.sexo_id)

            # Actualizar la foto si se envió una nueva
            if foto:
                instance.foto.delete(save=False)  # Eliminar la foto anterior si existe
                instance.foto = foto

            # Guardar los cambios
            instance.save()

            # Serializar y devolver la respuesta
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    @action(detail=False, methods=['post'], url_path='filtrar')
    def buscarSocio(self, request):
        nombre = request.data.get('nombre')
        n_socio = request.data.get('n_socio')
        apellidos = request.data.get('apellidos')
        sexo = request.data.get('sexo')
        pagado = request.data.get('pagado')
        dni = request.data.get('dni')

        # Construir la consulta dinámica
        query = Q()
        if nombre:
            query &= Q(nombre__icontains=nombre)
        if n_socio:
            query &= Q(n_socio=n_socio)
        if apellidos:
            query &= Q(apellido__icontains=apellidos)
        if sexo:
            query &= Q(sexo=sexo)
        if pagado:
            query &= Q(pagado=pagado)
        if dni:
            query &= Q(dni=dni)

        socios = Socio.objects.filter(query)
        # Paginación manual si se reciben page y page_size
        page_size = int(request.data.get('page_size', 10))
        page_number = int(request.data.get('page', 1))
        total = socios.count()
        start = (page_number - 1) * page_size
        end = start + page_size
        items = socios[start:end]
        serializer = SocioSerializer(items, many=True)
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='paginar')
    def paginar_socios(self, request):
        page_size = int(request.query_params.get('page_size', 10))
        page_number = int(request.query_params.get('page', 1))
        ordering = request.query_params.get('ordering', '-n_socio')
        
        queryset = self.get_queryset().order_by(ordering)
        total = queryset.count()
        
        # Aplica paginación manual
        start = (page_number - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        
        serializer = SocioSerializer(items, many=True)
        
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'], url_path='mostrarSocio')
    def mostrarSocio(self, request):
        year = datetime.now().year
        n_socio = request.data.get('n_socio')
        
        try:
            socio = Socio.objects.get(n_socio=n_socio)
            serializer = SocioSerializer(socio)
            
            fecha_inicio = make_aware(tomarFecha(30, 'Diciembre', year - 1))
            fecha_fin = make_aware(tomarFecha(1, 'enero', year + 1))
            cuotas = Cuota.objects.filter(socio=socio, fecha__range=[fecha_inicio, fecha_fin])
            
            periodos_pagados = list(cuotas.values_list('periodo', flat=True))
            
            data = serializer.data
            data['periodos_pagados'] = periodos_pagados
            return Response(data)
        except Socio.DoesNotExist:
            return Response({"detail": "Socio not found."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    @action(detail=False, methods=['post'], url_path='descargar_socios')
    def descargar_socios(self, request):
        nombre = request.data.get('nombre')
        apellidos = request.data.get('apellidos')
        sexo = request.data.get('sexo')
        dni = request.data.get('dni')
        orden = request.data.get('orden')
        year = datetime.now().year
        # Construir la consulta dinámica
        query = Q()
        if nombre:
            query &= Q(nombre__icontains=nombre)
        if apellidos:
            query &= Q(apellido__icontains=apellidos)
        if sexo:
            query &= Q(sexo=sexo)
        if dni:
            query &= Q(dni=dni)

        
        socios = Socio.objects.filter(query).order_by(orden)  # Filtrar cuentas según los filtros recibidos
        datos = []
        for socio in socios:
            dato = dict()
            dato['nombre'] = socio.nombre
            dato['n_socio'] = socio.n_socio
            dato['apellido'] = socio.apellido
            dato['dni'] = socio.dni
            dato['telefono'] = socio.telefono

            fecha_inicio = make_aware(tomarFecha(30, 'Diciembre', year - 1))
            fecha_fin = make_aware(tomarFecha(1, 'enero', year + 1))
            cuotas = Cuota.objects.filter(socio=socio, fecha__range=[fecha_inicio, fecha_fin])
            if cuotas.count() > 0:
                periodos = ['1s' if c.periodo == '1semestre' else '2s' if c.periodo == '2semestre' else 'anio' for c in cuotas]
                dato['periodos'] = periodos
            else:
                dato['periodos'] = 'No pagado'
            datos.append(dato)
        html_string = render_to_string('socios.html', {'socios': datos})  # Render template with accounts
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="socios.pdf"'

        # Generate PDF using xhtml2pdf
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return HttpResponse("Error al generar el PDF", status=500)
        
        return response

    @action(detail=False, methods=['post'], url_path='descargar_tarjetas')
    def descargar_tarjetas(self, request):
        listado_socios = request.data.get('listado_socios', [])
        socios = Socio.objects.filter(n_socio__in=listado_socios)

        html_string = render_to_string('socio_card.html', {'socios': socios}, request=request)
        pdf_file = HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()

        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="socio_card.pdf"'
        return response