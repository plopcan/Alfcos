
from datetime import datetime
from ..models import Cuota
from django.utils.timezone import now, make_aware
from .utils import tomarFecha
from ..serializer.clase import ClaseSerializer
from ..models.clase import Clase
from ..models.socio import Socio
from ..models import Taller
from ..serializers import TallerSerializer
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa

class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='filtrar')
    def buscarTaller(self, request):
        nombre = request.query_params.get('nombre')
        n_taller = request.data.get('id_taller')
        monitor = request.query_params.get('monitor')
        dia = request.query_params.get('dia')
        plazas = request.query_params.get('plazas')

        # Construir la consulta dinámica
        query = Q()
        if nombre:
            query &= Q(nombre__icontains=nombre)
        if n_taller:
            query &= Q(n_taller=n_taller)
        if monitor:
            query &= Q(monitor__icontains=monitor)
        if dia:
            query &= Q(dia__icontains=dia)
        if plazas:
            query &= Q(plazas=plazas)

        Tallers = Taller.objects.filter(query)
        serializer = TallerSerializer(Tallers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='inscribir')
    def inscribirSocio(self, request):
        id_taller = request.data.get('id_taller')
        n_socio = request.data.get('n_socio')
        try:
            socio = Socio.objects.get(n_socio=n_socio)
            taller = Taller.objects.get(n_taller=id_taller)
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=404)

        if Clase.objects.filter(taller=taller).count() >= taller.plazas:
            return Response({'error': 'No hay plazas disponibles'}, status=400)

        clase, created = Clase.objects.get_or_create(socio=socio, taller=taller)
        if not created:
            return Response({'error': 'El socio ya está inscrito en este taller'}, status=400)

        serializer = ClaseSerializer(clase)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='quitar')
    def quitarSocio(self, request):
        id_taller = request.data.get('id_taller')
        nombre = request.data.get('nombre')
        apellido = request.data.get('apellidos')
        try:
            socio = Socio.objects.get(nombre=nombre, apellido=apellido)
            taller = Taller.objects.get(n_taller=id_taller)
            clase = Clase.objects.get(socio=socio, taller=taller)
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=404)
        except Taller.DoesNotExist:
            return Response({'error': 'Taller no encontrado'}, status=404)
        except Clase.DoesNotExist:
            return Response({'error': 'El socio no está inscrito en este taller'}, status=400)

        clase.delete()
        return Response({'message': 'Socio eliminado del taller correctamente'})

    @action(detail=False, methods=['post'], url_path='listar-socios')
    def listarSocios(self, request):
        id_taller = request.data.get('id_taller')
        try:
            taller = Taller.objects.get(n_taller=id_taller)
        except Taller.DoesNotExist:
            return Response({'error': 'Taller no encontrado'}, status=404)

        clases = Clase.objects.filter(taller=taller)
        socios = [{'nombre': clase.socio.nombre, 'apellidos': clase.socio.apellido, 'fecha': f"{clase.fecha_inscripcion}"} for clase in clases]
        return Response(socios)

    def list(self, request, *args, **kwargs):
        talleres = Taller.objects.all()
        data = []
        for taller in talleres:
            plazas_ocupadas = Clase.objects.filter(taller=taller).count()
            plazas_libres = taller.plazas - plazas_ocupadas
            data.append({
                'n_taller': taller.n_taller,
                'nombre': taller.nombre,
                'hora_inicio': f"{taller.hora_inicio}",
                'hora_fin': taller.hora_fin,
                'dia': ', '.join([dia.dia for dia in taller.dia.all()]),
                'plazas_libres': plazas_libres
            })
        return Response(data)

    @action(detail=False, methods=['get'], url_path='paginar')
    def paginar_talleres(self, request):
        page_size = int(request.query_params.get('page_size', 10))
        page_number = int(request.query_params.get('page', 1))
        
        queryset = self.get_queryset()
        total = queryset.count()
        
        # Aplica paginación manual
        start = (page_number - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        
        serializer = TallerSerializer(items, many=True)
        
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='paginar-clases')
    def paginar_clases(self, request):
        id_taller = request.query_params.get('id_taller')
        if not id_taller:
            return Response({'status': 'id_taller es requerido'}, status=400)

        try:
            taller = Taller.objects.get(n_taller=id_taller)
        except Taller.DoesNotExist:
            return Response({'status': 'Taller no encontrado'}, status=404)

        page_size = int(request.query_params.get('page_size', 10))
        page_number = int(request.query_params.get('page', 1))

        queryset = Clase.objects.filter(taller=taller)
        total = queryset.count()

        # Aplica paginación manual
        start = (page_number - 1) * page_size
        end = start + page_size
        items = queryset[start:end]

        socios = [{'nombre': clase.socio.nombre, 'apellidos': clase.socio.apellido, 'fecha': f"{clase.fecha_inscripcion}", 'n_socio': clase.socio.n_socio} for clase in items]

        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': socios
        })
    
    @action(detail=False, methods=['post'], url_path='descargar_clase')
    def descargar_clase(self, request):
        id_taller = request.data.get('id_taller')
        taller = Taller.objects.get(n_taller=id_taller)
        clases = Clase.objects.filter(taller=taller)
        print(clases)
        year = datetime.now().year
        fecha_inicio = make_aware(tomarFecha(30, 'Diciembre', year - 1))
        fecha_fin = make_aware(tomarFecha(1, 'enero', year + 1))
        dias = []
        for dia in taller.dia.all():
            dias.append(dia.dia)
        datas = []

        for clase in clases:
            data = {
                'n_socio': clase.socio.n_socio,
                'nombre': clase.socio.nombre + ' ' + clase.socio.apellido,
                'apellidos': clase.socio.apellido,
                'dni': clase.socio.dni,
            }
            
            cuotas = Cuota.objects.filter(socio=clase.socio, fecha__range=[fecha_inicio, fecha_fin])
            if cuotas.count() > 0:
                periodos = ['1s' if c.periodo == '1semestre' else '2s' if c.periodo == '2semestre' else 'año' for c in cuotas]
                data['periodos'] = periodos
            else:
                data['periodos'] = 'No pagado'

            datas.append(data)

        html_string = render_to_string('clase.html', {'datas': datas, 'taller': taller, 'dias': dias})  # Render template with accounts
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=' + taller.nombre + '".pdf"'

        # Generate PDF using xhtml2pdf
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return HttpResponse("Error al generar el PDF", status=500)
        
        return response
