from ..models import Evento, Asiento, ListaEspera, Socio  # Import ListaDeEspera and Asiento models
from ..serializers import EventoSerializer
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from datetime import date, datetime  # Import date for current date usage
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
from . import utils  # Import the utils module for utility functions

class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        cantidad_grupos = request.data.get('num_grupos')
        asientos_por_grupo = request.data.get('n_asientos')

        if not cantidad_grupos or not asientos_por_grupo:
            return Response({'status': 'cantidad de grupos y asientos por grupo son requeridos'}, status=400)

        response = super().create(request, *args, **kwargs)
        evento = Evento.objects.get(id_evento=response.data.get('id_evento'))

        try:
            Asiento.crear_asientos_para_evento(evento, int(cantidad_grupos), int(asientos_por_grupo))
            return response
        except Exception as e:
            evento.delete()  # Rollback event creation if seat creation fails
            return Response({'status': 'error al crear asientos', 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='filtrar')
    def buscarEvento(self, request):
        nombre = request.data.get('nombre')
        id_evento = request.data.get('id_evento')
        fecha = request.data.get('fecha')
        lugar = request.data.get('lugar')
        hora_ini = request.data.get('hora_ini')
        descripcion = request.data.get('descripcion')
        tipo = request.data.get('tipo')

        # Construir la consulta dinámica
        query = Q()
        if nombre:
            query &= Q(nombre__icontains=nombre)
        if id_evento:
            query &= Q(id_evento=id_evento)
        if fecha:
            query &= Q(fecha_ini=fecha)
        if lugar:
            query &= Q(lugar__icontains=lugar)
        if hora_ini:
            query &= Q(hora_ini=hora_ini)
        if descripcion:
            query &= Q(descripcion__icontains=descripcion)
        if tipo:
            try:
                tipo_int = int(tipo)
                query &= Q(tipo_id=tipo_int)
            except (ValueError, TypeError):
                print(f"Tipo recibido no convertible a int: {tipo}")
                pass

        eventos = Evento.objects.filter(query)
        serializer = EventoSerializer(eventos, many=True)
        # Devuelve siempre un objeto con 'results' para que el frontend lo procese igual que la paginación
        return Response({'results': serializer.data})

    @action(detail=False, methods=['post'], url_path='asignar-asiento')
    def asignarAsiento(self, request):
        n_socio = request.data.get('n_socio')
        n_grupo = request.data.get('n_grupo')
        numero_asiento = request.data.get('n_asiento')
        mesa = request.data.get('mesa')
        id_evento = request.data.get('id_evento')

        try:
            asiento = Asiento.objects.get(n_grupo=n_grupo, n_asiento=numero_asiento, id_evento=id_evento)
            asiento.n_socio = Socio.objects.get(n_socio=n_socio)
            asiento.fecha = datetime.now()
            if mesa:
                asiento.mesa = mesa
            asiento.save()

            # Eliminar de la lista de espera si existe
            try:
                lista_espera = ListaEspera.objects.get(socio=n_socio ,evento=id_evento)
                lista_espera.delete()
            except ListaEspera.DoesNotExist:
                pass

            return Response({'status': 'asiento asignado'})
        except Asiento.DoesNotExist:
            return Response({'status': 'asiento no encontrado'}, status=404)

    @action(detail=False, methods=['post'], url_path='vaciar-asiento')
    def vaciarAsiento(self, request):
        n_grupo = request.data.get('n_grupo')
        numero_asiento = request.data.get('n_asiento')
        id_evento = request.data.get('id_evento')

        try:
            asiento = Asiento.objects.get(n_grupo=n_grupo, n_asiento=numero_asiento, id_evento=id_evento)
            evento = Evento.objects.get(id_evento=id_evento)
            utils.anularAsiento("E" + str(id_evento) + " Reserva de asiento " + str(asiento.n_grupo) + "-" + str(asiento.n_asiento))
            asiento.n_socio = None
            asiento.mesa = 0
            asiento.save()
            return Response({'status': 'asiento vaciado'})
        except Asiento.DoesNotExist:
            return Response({'status': 'asiento no encontrado'}, status=404)

    @action(detail=False, methods=['post'], url_path='agregar-lista-espera')
    def agregarAListaDeEspera(self, request):
        n_socio = request.data.get('n_socio')
        id_evento = request.data.get('id_evento')

        # Verifica que los parámetros necesarios estén presentes
        if not n_socio or not id_evento:
            return Response({'status': 'n_socio e id_evento son requeridos'}, status=400)

        try:
            # Obtén las instancias de Socio y Evento
            socio = Socio.objects.get(n_socio=n_socio)
            evento = Evento.objects.get(id_evento=id_evento)

            # Crea la entrada en la lista de espera
            lista_espera = ListaEspera.objects.create(
                socio=socio,
                fecha_inscripcion=date.today(),
                evento=evento
            )
            lista_espera.save()

            return Response({'status': 'socio agregado a la lista de espera'})
        except Socio.DoesNotExist:
            return Response({'status': 'socio no encontrado'}, status=404)
        except Evento.DoesNotExist:
            return Response({'status': 'evento no encontrado'}, status=404)
        except Exception as e:
            return Response({'status': 'error al agregar a la lista de espera', 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='eliminar-lista-espera')
    def eliminarDeListaDeEspera(self, request):
        n_socio = request.data.get('n_socio')  # Asegúrate de que el frontend envíe 'n_socio'
        id_evento = request.data.get('id_evento')  # Asegúrate de que el frontend envíe 'id_evento'

        if not n_socio or not id_evento:
            return Response({'status': 'n_socio e id_evento son requeridos'}, status=400)

        try:
            lista_espera = ListaEspera.objects.get(socio=n_socio, evento_id=id_evento)
            lista_espera.delete()
            return Response({'status': 'socio eliminado de la lista de espera'})
        except ListaEspera.DoesNotExist:
            return Response({'status': 'socio no encontrado en la lista de espera'}, status=404)

    @action(detail=False, methods=['post'], url_path='obtener-asientos')
    def obtenerAsientos(self, request):
        id_evento = request.data.get('id_evento')

        if not id_evento:
            return Response({'status': 'id_evento es requerido'}, status=400)

        try:
            asientos = Asiento.objects.filter(id_evento=id_evento)
            asientos_data = [{'n_grupo': asiento.n_grupo,
                               'n_asiento': asiento.n_asiento, 
                               'socio':asiento.n_socio.nombre + ' ' + asiento.n_socio.apellido if asiento.n_socio else None,
                               'n_socio': asiento.n_socio.n_socio if asiento.n_socio else None,
                               'mesa': asiento.mesa
                               } for asiento in asientos]

            return Response({'asientos': asientos_data})
        except Exception as e:
            return Response({'status': 'error al obtener asientos', 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='obtener-lista-espera')
    def obtenerListaDeEspera(self, request):
        id_evento = request.data.get('id_evento')

        if not id_evento:
            return Response({'status': 'id_evento es requerido'}, status=400)

        try:
            lista_espera = ListaEspera.objects.filter(evento=id_evento)
            lista_espera_data = [{'socio': item.socio.nombre + ' ' + item.socio.apellido, 'fecha_inscripcion': item.fecha_inscripcion, 'n_socio': item.socio.n_socio} for item in lista_espera]

            return Response({'lista_espera': lista_espera_data})
        except Exception as e:
            return Response({'status': 'error al obtener lista de espera', 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='paginar')
    def paginar_eventos(self, request):
        page_size = int(request.query_params.get('page_size', 10))
        page_number = int(request.query_params.get('page', 1))
        
        queryset = self.get_queryset()
        total = queryset.count()
        
        # Aplica paginación manual
        start = (page_number - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        
        serializer = EventoSerializer(items, many=True)
        
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='descargar_listado')
    def descargar_listado(self, request):
        id_evento = request.data.get('id_evento')
        evento = Evento.objects.get(id_evento=id_evento)
        dato = {}
        datos = []
        datos_grupos = []
        for grupo in range(0, evento.num_grupos):
            print(f"Procesando grupo {grupo + 1} para el evento {evento.nombre}")
            asientos = Asiento.objects.filter(id_evento_id= id_evento, n_grupo=grupo + 1).order_by('n_asiento')
            for asiento in asientos:
                dato = {
                    'nombre' :asiento.n_socio.nombre + ' ' + asiento.n_socio.apellido if asiento.n_socio else 'Libre',
                    'tlf': asiento.n_socio.telefono if asiento.n_socio and asiento.n_socio.telefono else 'N/A',
                    'asiento': asiento.n_asiento,
                    'grupo': asiento.n_grupo,
                    'mesa': asiento.mesa
                }
                datos.append(dato)
            datos_grupos.append(datos)
            datos = []
            
        print(f"Agregando dato: {datos_grupos}")
        html_string = render_to_string('evento.html', {'datos_grupos': datos_grupos, 'nombre': evento.nombre})  # Render template with accounts
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=' + evento.nombre + '".pdf"'

        # Generate PDF using xhtml2pdf
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return HttpResponse("Error al generar el PDF", status=500)
        
        return response

    @action(detail=False, methods=['post'], url_path='descargar_mesas')
    def descargar_mesas(self, request):
        id_evento = request.data.get('id_evento')
        evento = Evento.objects.get(id_evento=id_evento)
        dato = {}
        datos = []
        datos_grupos = []
        for grupo in range(0, evento.mesas):
            asientos = Asiento.objects.filter(id_evento_id= id_evento, mesa=grupo + 1).order_by('n_grupo', 'n_asiento')
            for asiento in asientos:
                dato = {
                    'nombre' :asiento.n_socio.nombre + ' ' + asiento.n_socio.apellido if asiento.n_socio else 'Libre',
                    'tlf': asiento.n_socio.telefono if asiento.n_socio and asiento.n_socio.telefono else 'N/A',
                    'n_socio': asiento.n_socio.n_socio if asiento.n_socio else 'N/A',
                    'asiento': asiento.n_asiento,
                    'grupo': asiento.n_grupo,
                    'mesa': asiento.mesa
                }
                datos.append(dato)
            datos_grupos.append(datos)
            datos = []
            
        print(f"Agregando dato: {datos_grupos}")
        html_string = render_to_string('mesas.html', {'datos_grupos': datos_grupos, 'nombre': evento.nombre})  # Render template with accounts
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=' + evento.nombre + '".pdf"'

        # Generate PDF using xhtml2pdf
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return HttpResponse("Error al generar el PDF", status=500)
        
        return response
