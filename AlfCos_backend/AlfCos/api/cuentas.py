from ..models import Cuenta, Cuota, CuentaEvento, Socio, Evento, Asiento
from ..serializers import CuentaSerializer
from rest_framework import viewsets, permissions
from django.db.models import Q
from django.utils.timezone import now, make_aware
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
from datetime import datetime
from .utils import tomarFecha
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration
from weasyprint.logger import LOGGER
import logging

class CuentaViewSet(viewsets.ModelViewSet):
    page_size = 10  # Valor por defecto
    page_size_query_param = 'page_size'
    queryset = Cuenta.objects.all()
    serializer_class = CuentaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def perform_create(self, serializer):
        # Guarda la cuenta
        cuenta = serializer.save()

        # Obtén los datos adicionales del request
        n_socio = self.request.data.get('n_socio')
        id_evento = self.request.data.get('id_evento')
        periodo = self.request.data.get('periodo')  # <-- Asegura que se obtiene el periodo
        subtipo = self.request.data.get('subtipo')

        # Crea una Cuota si el tipo es 'cuota'
        if cuenta.tipo.tipo == 'Cuota':
            if not n_socio:
                raise ValueError("El campo 'n_socio' es requerido para crear una cuota.")
            if not periodo:
                raise ValueError("El campo 'periodo' es requerido para crear una cuota.")
            try:
                socio = Socio.objects.get(n_socio=n_socio)
                # Verifica si el periodo es válido
                if periodo not in ['1semestre', '2semestre', 'anio']:
                    raise ValueError("El periodo debe ser '1semestre', '2semestre' o 'anio'.")
                Cuota.objects.create(cuenta=cuenta, socio=socio, fecha=now(), periodo=periodo)
                socio.pagado = True
                socio.save()
            except Socio.DoesNotExist:
                raise ValueError("El socio con n_socio proporcionado no existe.")

        # Crea una CuentaEvento si el tipo es 'cuenta_evento'
        elif cuenta.tipo.tipo == 'CuentaEvento':
            if not id_evento:
                raise ValueError("El campo 'id_evento' es requerido para crear una cuenta de evento.")
            try:
                evento = Evento.objects.get(id_evento=id_evento)
                CuentaEvento.objects.create(cuenta=cuenta, evento=evento, fecha=now(), subtipo=subtipo)
            except Evento.DoesNotExist:
                raise ValueError("El evento con id_evento proporcionado no existe.")

    @action(detail=False, methods=['post'], url_path='buscar')
    def buscarCuenta(self, request):
        cuenta = request.data.get('id_cuenta')
        # Construir la consulta dinámica
        query = Q()
        if cuenta:
            query &= Q(id_cuenta=cuenta)

        cuentas = Cuenta.objects.filter(query)
        serializer = CuentaSerializer(cuentas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='anular')
    def anular_cuenta(self, request):
        try:
            cuenta = Cuenta.objects.get(id_cuenta= request.data.get('id_cuenta'))
            if cuenta.anulada:
                return Response({"detail": "La cuenta ya está anulada."}, status=400)
            cuenta.anulada = True
            cuenta.save()
            return Response(status = 200)
        except Cuenta.DoesNotExist:
            return Response({"detail": "La cuenta no existe."}, status=404)

    @action(detail=False, methods=['post'], url_path='get_cuota')
    def getCuota(self, request):
        id_cuenta = request.data.get('id_cuenta')
        if not id_cuenta:
            return Response({"detail": "El campo 'id_cuenta' es requerido."}, status=400)
        try:
            cuenta = Cuenta.objects.get(id_cuenta=id_cuenta)
            cuota = Cuota.objects.get(cuenta=cuenta)
            data = {
                "cuenta": CuentaSerializer(cuenta).data,
                "n_socio": cuota.socio.n_socio,
                "periodo": cuota.periodo,
            }
            return Response(data)
        except Cuenta.DoesNotExist:
            return Response({"detail": "La cuenta no existe."}, status=404)
        except Cuota.DoesNotExist:
            return Response({"detail": "No se encontró una cuota asociada a esta cuenta."}, status=404)

    @action(detail=False, methods=['post'], url_path='get_cuenta_evento')
    def getCuentaEvento(self, request):
        id_cuenta = request.data.get('id_cuenta')
        if not id_cuenta:
            return Response({"detail": "El campo 'id_cuenta' es requerido."}, status=400)
        try:
            cuenta = Cuenta.objects.get(id_cuenta=id_cuenta)
            cuenta_evento = CuentaEvento.objects.get(cuenta=cuenta)
            data = {
                "cuenta": CuentaSerializer(cuenta).data,
                "id_evento": cuenta_evento.evento.id_evento,
                "subtipo": cuenta_evento.subtipo,
            }
            return Response(data)
        except Cuenta.DoesNotExist:
            return Response({"detail": "La cuenta no existe."}, status=404)
        except CuentaEvento.DoesNotExist:
            return Response({"detail": "No se encontró una cuenta de evento asociada a esta cuenta."}, status=404)
    @action(detail=False, methods=['get'], url_path='paginar')
    def paginar_cuentas(self, request):
        page_size = int(request.query_params.get('page_size', 10))
        page_number = int(request.query_params.get('page', 1))
        
        queryset = self.get_queryset().order_by('-fecha')
        total = queryset.count()
        
        # Aplica paginación manual
        start = (page_number - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        
        serializer = CuentaSerializer(items, many=True)
        
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='descargar_pdf')
    def descargar_pdf(self, request):
        print("Descargando PDF")
        # Obtener filtros del body
        descripcion = request.data.get('descripcion')
        tipo = request.data.get('tipo')
        anulada = request.data.get('anulada')
        fecha = request.data.get('fecha')
        id_cuenta = request.data.get('id_cuenta')

        query = Q()
        if descripcion:
            query &= Q(descripcion__icontains=descripcion)
        if tipo:
            query &= Q(tipo=tipo)
        if anulada != '' and anulada is not None:
            if anulada in [True, 'true', 'True', 1, '1']:
                query &= Q(anulada=True)
            elif anulada in [False, 'false', 'False', 0, '0']:
                query &= Q(anulada=False)
        if fecha:
            query &= Q(fecha=fecha)
        if id_cuenta:
            try:
                query &= Q(id_cuenta=int(id_cuenta))
            except Exception:
                pass

        cuentas = Cuenta.objects.filter(query)  # Filtrar cuentas según los filtros recibidos
        total = self.calcularTotal(cuentas)  # Calcular el total usando la función definida
        html_string = render_to_string('cuentas.html', {'cuentas': cuentas, 'total': total})  # Render template with accounts
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="cuentas.pdf"'

        # Generate PDF using xhtml2pdf
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return HttpResponse("Error al generar el PDF", status=500)
        
        return response

    @action(detail=False, methods=['post'], url_path='filtrar')
    def filtrar_cuentas(self, request):
        tipo = request.data.get('tipo')
        anulada = request.data.get('anulada')
        id_cuenta = request.data.get('id_cuenta')

        # Nuevos campos para el intervalo de fechas (nombre del mes)
        fecha_inicio_dia = request.data.get('fecha_inicio_dia')
        fecha_inicio_mes = request.data.get('fecha_inicio_mes')
        fecha_inicio_anio = request.data.get('fecha_inicio_anio')
        fecha_fin_dia = request.data.get('fecha_fin_dia')
        fecha_fin_mes = request.data.get('fecha_fin_mes')
        fecha_fin_anio = request.data.get('fecha_fin_anio')

        tipos = ['CuentaEvento', 'Cuota', 'Ingreso', 'Gasto']

        query = Q()
        if tipo:
            query &= Q(tipo_id=int(tipo))
        if anulada != '' and anulada is not None:
            if anulada in [True, 'true', 'True', 1, '1']:
                query &= Q(anulada=True)
            elif anulada in [False, 'false', 'False', 0, '0']:
                query &= Q(anulada=False)
        if id_cuenta:
            try:
                query &= Q(id_cuenta=int(id_cuenta))
            except Exception:
                pass

        # Filtrado por intervalo de fechas flexible (nombre de mes)
        fecha_query = Q()
        if any([fecha_inicio_dia, fecha_inicio_mes, fecha_inicio_anio, fecha_fin_dia, fecha_fin_mes, fecha_fin_anio]):
            
            # Construir fecha de inicio
            fecha_inicio = tomarFecha(fecha_inicio_dia, fecha_inicio_mes, fecha_inicio_anio)

            # Construir fecha de fin
            fecha_fin = tomarFecha(fecha_fin_dia, fecha_fin_mes, fecha_fin_anio)

            if fecha_inicio and fecha_fin:
                fecha_query &= Q(fecha__range=[fecha_inicio, fecha_fin])
            elif fecha_inicio:
                fecha_query &= Q(fecha__gte=fecha_inicio)
            elif fecha_fin:
                fecha_query &= Q(fecha__lte=fecha_fin)

            query &= fecha_query

        cuentas = self.get_queryset().filter(query).order_by('-fecha')
        page_size = int(request.data.get('page_size', 10))
        page_number = int(request.data.get('page', 1))
        total = cuentas.count()
        start = (page_number - 1) * page_size
        end = start + page_size
        items = cuentas[start:end]
        serializer = self.get_serializer(items, many=True)
        return Response({
            'count': total,
            'next': f"?page={page_number + 1}&page_size={page_size}" if end < total else None,
            'previous': f"?page={page_number - 1}&page_size={page_size}" if start > 0 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['post'], url_name='imprimir_ticket')
    def imprimir_ticket(self, request):
        year =datetime.now().strftime('%Y')
        try:
            datos = dict(request.data)  # Asegúrate de tener un diccionario
            print("Datos recibidos para imprimir ticket:", datos)
            if datos['info'].get('fecha') is None:
                datos['fecha'] = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
            else:
                datos['fecha'] = datetime.fromisoformat(datos['info']['fecha'].replace("Z", "+00:00"))
            
            if datos['info']['tipo_id'] == '2' or datos['info']['tipo_id'] == 2:
                print(datos['info']['tipo_id'])
                datos['tipo'] = 'Cuota'
                socio = Socio.objects.get(n_socio=datos['info']['n_socio'])
                datos['socio'] = socio.nombre + ' ' + socio.apellido
                if datos['info']['periodo'] == '1semestre':
                    datos['Inicio'] = 'Enero de ' + year
                    datos['fin'] = 'Junio de ' + year
                elif datos['info']['periodo'] == '2semestre':
                    datos['Inicio'] = 'Julio de ' + year
                    datos['fin'] = 'Diciembre de ' + year+ ' Inclusive'
                else:
                    datos['Inicio'] = 'Enero de ' + year
                    datos['fin'] = 'Diciembre de ' + year + ' Inclusive'
            elif datos['info']['tipo_id'] == 1:
                datos['tipo'] = 'Cuenta de Evento'
                evento = Evento.objects.get(id_evento=datos['info']['id_evento']) 
                asiento = Asiento.objects.get(id_evento=datos['info']['id_evento'], n_asiento=datos['info']['n_asiento'], n_grupo=datos['info']['n_grupo'])
                if datos['info']['subtipo'] == 'entrada':
                    if( datos['info'].get('n_socio') is None):
                        datos['socio'] = asiento.n_socio.nombre + ' ' + asiento.n_socio.apellido
                    else:
                        socio = Socio.objects.get(n_socio=datos['info']['n_socio'])
                        datos['socio'] = socio.nombre + ' ' + socio.apellido
                datos['evento'] = evento.nombre
                datos['fecha_ini'] = evento.fecha_ini.strftime('%d/%m/%Y')
                datos['fecha_fin'] = evento.fecha_fin.strftime('%d/%m/%Y') if evento.fecha_fin else 'Fecha no disponible'
                datos['hora_ini'] = evento.fecha_ini.strftime('%H:%M')
                datos['asiento'] = 'Bus ' + str(asiento.n_grupo) + ' - ' + 'Asiento ' + str(asiento.n_asiento)
                datos['mesa'] = asiento.mesa


            html_string = render_to_string('ticket.html', {'datos': datos}, request=request)
                
            pdf_file = HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()

            response = HttpResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="ticket.pdf"'
            
            return response
        except Cuenta.DoesNotExist:
            return Response({"detail": "La cuenta no existe."}, status=404)

        
    @action(detail=False, methods=['post'], url_name='comprobar_pago')
    def comprobar_pago(self, request):
        n_socio = request.data.get('n_socio')
        year =datetime.now().strftime('%Y')
        periodo_in = ['anio']
        mes = request.data.get('mes')
        fecha_inicio = make_aware(tomarFecha(30, 'diciembre', int(year)-1))
        fecha_fin = make_aware(tomarFecha(1, 'enero', int(year) + 1))
        if 1 <= mes <= 6:
            periodo_in.append('1semestre')
        elif 7 <= mes <= 12:
            periodo_in.append('2semestre')
        if not n_socio:
            return Response({"detail": "El campo 'n_socio' es requerido."}, status=400)
        try:
            socio = Socio.objects.get(n_socio=n_socio)
            cuotas = Cuota.objects.filter(
                socio=socio,
                periodo__in=periodo_in,
                cuenta__anulada=False,
                fecha__range=[fecha_inicio, fecha_fin]
            )
            if cuotas.exists():
                return Response(True)
            else:
                return Response(False)
        except Socio.DoesNotExist:
            return Response(False)
        except Cuota.DoesNotExist:
            return Response(False)
        except Exception as e:
            print(f"Error inesperado: {e}")
            return Response(False)
        
    def calcularTotal(self, cuentas):
        total = 0
        for cuenta in cuentas:
            if cuenta.anulada:
                continue
            if cuenta.tipo.tipo in ['Ingreso', 'Cuota']:
                total += cuenta.cantidad
            elif cuenta.tipo.tipo == 'Gasto':
                total -= cuenta.cantidad
            elif cuenta.tipo.tipo == 'CuentaEvento':
                if CuentaEvento.objects.filter(Q(subtipo='entrada') | Q(subtipo='ingreso'), cuenta=cuenta).exists():
                    total += cuenta.cantidad
                elif CuentaEvento.objects.filter(cuenta=cuenta, subtipo='gasto').exists():
                    total -= cuenta.cantidad
        return total
