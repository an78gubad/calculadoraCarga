# Calculadora de Carga para Transportes

Herramienta web para calcular la carga máxima permitida en vehículos de transporte de carga en Argentina, según la configuración de ejes y la normativa vigente.

## Características

- Cálculo automático del peso máximo permitido según:
  - Configuración de ejes (simples, tándem, trídem y mixtos)
  - Tipo de rodado (ruedas individuales, dobles, superanchas)
  - Distancias entre ejes
  - Relación peso-potencia requerida

- Validación en tiempo real de:
  - Distancias mínimas y máximas entre ejes
  - Configuraciones permitidas
  - Límites de peso por tipo de eje

- Interfaz intuitiva que permite:
  - Agregar múltiples grupos de ejes
  - Visualizar resultados detallados
  - Ver explicación paso a paso del cálculo

- Carga de configuraciones desde un archivo CSV para personalizar los límites de peso y dimensiones.
- Actualización automática de resultados al modificar las configuraciones de ejes.
- Validación visual de entradas con mensajes de error claros.
- Opción para reiniciar la calculadora y limpiar todas las configuraciones.
- Soporte para configuraciones predefinidas mediante botones rápidos.

## Normativa Aplicada

Los cálculos se basan en la siguiente legislación argentina:
- Ley de Tránsito 24.449
- Decreto 779/95 (Reglamentación)
- Decreto 1035/2002
- Resoluciones complementarias

## Tecnologías Utilizadas

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (jQuery)
- Font Awesome para iconografía

## Uso

1. Seleccione el tipo de grupo de ejes (simple, tándem, trídem o mixto)
2. Configure las características específicas de cada grupo
3. Agregue grupos adicionales según necesidad
4. El resultado se calculará automáticamente mostrando:
   - Peso máximo permitido
   - Potencia mínima requerida
   - Desglose detallado del cálculo

## Licencia

Este proyecto está bajo la Licencia Apache 2.0 - vea el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Autor

Andrés Gurisatti

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abra un issue primero para discutir los cambios que le gustaría realizar.
