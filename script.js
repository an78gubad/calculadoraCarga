const TEMPLATES = {
    simple: `
        <div class="mb-2">
            <label class="form-label">Tipo de Rodado</label>
            <select class="form-select subtype-select">
                <option value="ruedas_individuales">S1 - EJE CON RUEDAS INDIVIDUALES (6.000 kg)</option>
                <option value="rodado_doble">D1 - EJE CON RODADOS DOBLES (10.500 kg)</option>
                <option value="superanchas">Cubiertas Superanchas (8.000 kg)</option>
            </select>
        </div>
    `,
    tandem: `
        <div class="mb-2">
            <label class="form-label">Tipo de Rodado</label>
            <select class="form-select subtype-select">
                <option value="ruedas_individuales">S2 - DOS EJES CON RUEDAS INDIVIDUALES (10.000 kg)</option>
                <option value="mixto">Mixto (14.000 kg)</option>
                <option value="rodado_doble">D2 - DOS EJES CON RODADOS DOBLES (18.000 kg)</option>
                <option value="superanchas">Cubiertas Superanchas (16.000 kg)</option>
                <option value="rodado_doble_superanchas">Rodado Doble + Superanchas (17.000 kg)</option>
            </select>
        </div>
        <div class="mb-2">
            <label class="form-label">Distancia entre ejes (metros)</label>
            <input type="number" step="0.01" class="form-control distancia-input" required>
        </div>
    `,
    tridem: `
        <div class="mb-2">
            <label class="form-label">Tipo de Rodado</label>
            <select class="form-select subtype-select">
                <option value="rodado_doble">D3 - TRES EJES CON RODADOS DOBLES (25.500 kg)</option>
            </select>
        </div>
        <div class="mb-2">
            <label class="form-label">Distancia entre 1º y 2º eje (metros)</label>
            <input type="number" step="0.01" class="form-control distancia1-input" required>
        </div>
        <div class="mb-2">
            <label class="form-label">Distancia entre 2º y 3º eje (metros)</label>
            <input type="number" step="0.01" class="form-control distancia2-input" required>
        </div>
    `,
    mixto: `
        <div class="tandem-section mb-3">
            <h6>Configuración del Tándem</h6>
            <div class="mb-2">
                <label class="form-label">Tipo de Rodado</label>
                <select class="form-select tandem-subtype-select">
                    <option value="ruedas_individuales">S2 - DOS EJES CON RUEDAS INDIVIDUALES</option>
                    <option value="mixto">Mixto</option>
                    <option value="rodado_doble">D2 - DOS EJES CON RODADOS DOBLES</option>
                </select>
            </div>
            <div class="mb-2">
                <label class="form-label">Distancia entre ejes del tándem (metros)</label>
                <input type="number" step="0.01" class="form-control tandem-distancia-input" required>
            </div>
        </div>
        <div class="simple-section mb-3">
            <h6>Configuración del Eje Simple</h6>
            <div class="mb-2">
                <label class="form-label">Tipo de Rodado</label>
                <select class="form-select simple-subtype-select">
                    <option value="ruedas_individuales">S1 - EJE CON RUEDAS INDIVIDUALES</option>
                    <option value="rodado_doble">D1 - EJE CON RODADOS DOBLES</option>
                </select>
            </div>
        </div>
        <div class="mb-2">
            <label class="form-label">Distancia entre tándem y eje simple (metros)</label>
            <input type="number" step="0.01" class="form-control distancia-entre-input" required>
        </div>
    `
};

const limitesPeso = {
    'eje_simple_ruedas_individuales': 6000,
    'eje_simple_rodado_doble': 10500,
    'eje_simple_superanchas': 8000,
    'tandem_ruedas_individuales': 10000,
    'tandem_mixto': 14000,
    'tandem_rodado_doble': 18000,
    'tandem_superanchas': 16000,
    'tridem_rodado_doble': 25500,
    'tandem_rodado_doble_superanchas': 17000
};

const PESO_MAXIMO_ABSOLUTO = 75; // toneladas

const VALIDACIONES = {
    tandem: {
        minDistancia: 1.20,
        maxDistancia: 2.40,
        mensaje: "La distancia debe estar entre 1.20m y 2.40m"
    },
    tridem: {
        minDistancia: 1.20,
        maxDistancia: 2.40,
        minDistanciaTotal: 2.40,
        maxDistanciaTotal: 4.80,
        mensaje: "Las distancias entre ejes deben estar entre 1.20m y 2.40m",
        mensajeTotal: "La suma de las distancias debe estar entre 2.40m y 4.80m"
    }
};

// Cargar configuraciones desde el archivo CSV
function cargarConfiguraciones() {
    $.get('configuraciones.csv', function(data) {
        const configuraciones = [];
        const lineas = data.split('\n');
        
        lineas.forEach(linea => {
            const [numero, configuracion, pesoMaximo, largo, ancho, alto, imagen] = linea.split(';');
            configuraciones.push({
                numero,
                configuracion,
                pesoMaximo,
                largo,
                ancho,
                alto,
                imagen
            });
        });

        // Guardar configuraciones en una variable global
        window.configuracionesPredeterminadas = configuraciones;
    });
}

// Llamar a la función para cargar configuraciones al inicio
cargarConfiguraciones();

// Mover la función fuera del document.ready
function actualizarCalculos() {
    // Limpiar el contenedor de imágenes y configuraciones antes de agregar nuevas
    $('#contenedor-imagenes').empty();
    $('#pesoMaximo-config').find('div').remove(); // Limpiar configuraciones anteriores
    $('#aclaraciones').empty(); // Limpiar aclaraciones anteriores
    $("#toleranciasAclaracion").removeClass("d-none");

    if ($('.grupo-ejes').length <= 1) {
        $('#pesoMaximo-config').text('Configure los grupos de ejes');
        $('#pesoMaximo-peso').text('--');
        $('#pesoMaximo-potencia').text('--');
        $('#explicacionEjes, #explicacionPotencia, #explicacionFinal').empty();
        
        // Limpiar la imagen si la configuración es inválida
        $('#configuracion-imagen').attr('src', '').hide();
        return;
    }

    // Verificar si hay distancias inválidas
    let distanciasValidas = true;
    $('.grupo-ejes').each(function() {
        const tipo = $(this).find('.grupo-tipo').val();
        
        if (tipo === 'tandem') {
            const distancia = parseFloat($(this).find('.distancia-input').val());
            if (distancia && (distancia < VALIDACIONES.tandem.minDistancia || distancia > VALIDACIONES.tandem.maxDistancia)) {
                distanciasValidas = false;
                return false; // break the loop
            }
        } else if (tipo === 'tridem') {
            const distancia1 = parseFloat($(this).find('.distancia1-input').val());
            const distancia2 = parseFloat($(this).find('.distancia2-input').val());
            const distanciaTotal = distancia1 + distancia2;
            
            if ((distancia1 && (distancia1 < VALIDACIONES.tridem.minDistancia || distancia1 > VALIDACIONES.tridem.maxDistancia)) ||
                (distancia2 && (distancia2 < VALIDACIONES.tridem.minDistancia || distancia2 > VALIDACIONES.tridem.maxDistancia)) ||
                (distancia1 && distancia2 && (distanciaTotal < VALIDACIONES.tridem.minDistanciaTotal || distanciaTotal > VALIDACIONES.tridem.maxDistanciaTotal))) {
                distanciasValidas = false;
                return false; // break the loop
            }
        }
    });

    if (!distanciasValidas) {
        $('#pesoMaximo-config').text('Configure los grupos de ejes');
        $('#pesoMaximo-peso').text('--');
        $('#pesoMaximo-potencia').text('--');
        $('#explicacionEjes, #explicacionPotencia, #explicacionFinal').empty();
        
        // Limpiar la imagen si la configuración es inválida
        $('#configuracion-imagen').attr('src', '').hide();
        return;
    }

    const configuracionGrupos = [];
    let todosGruposCompletos = true;

    $('.grupo-ejes').each(function() {
        if (!grupoEstaCompleto($(this))) {
            todosGruposCompletos = false;
            return false; // break the loop
        }

        const tipo = $(this).find('.grupo-tipo').val();
        let grupo = {
            groupType: tipo
        };

        switch(tipo) {
            case 'simple':
                grupo.subtype = $(this).find('.subtype-select').val();
                break;
            case 'tandem':
                grupo.subtype = $(this).find('.subtype-select').val();
                grupo.distancia = parseFloat($(this).find('.distancia-input').val());
                break;
            case 'tridem':
                grupo.subtype = $(this).find('.subtype-select').val();
                grupo.distancias = [
                    parseFloat($(this).find('.distancia1-input').val()),
                    parseFloat($(this).find('.distancia2-input').val())
                ];
                break;
            case 'mixto':
                grupo.tandem = {
                    subtype: $(this).find('.tandem-subtype-select').val(),
                    distancia: parseFloat($(this).find('.tandem-distancia-input').val())
                };
                grupo.independiente = {
                    subtype: $(this).find('.simple-subtype-select').val()
                };
                grupo.distanciaEntre = parseFloat($(this).find('.distancia-entre-input').val());
                break;
        }
        
        configuracionGrupos.push(grupo);
    });

    if (!todosGruposCompletos || configuracionGrupos.length === 0) {
        $('#pesoMaximo-config').text('Configure los grupos de ejes');
        $('#pesoMaximo-peso').text('--');
        $('#pesoMaximo-potencia').text('--');
        $('#explicacionEjes, #explicacionPotencia, #explicacionFinal').empty();
        return;
    }

    const resultado = calcularPesoMaximo(configuracionGrupos);
    
    // Actualizar los elementos separadamente
    $('#pesoMaximo-config').text(resultado.configuracion);
    $('#pesoMaximo-peso').text(`${resultado.pesoMaximoPermitido.toFixed(2)} toneladas`);
    $('#pesoMaximo-potencia').text(`${Math.ceil(resultado.potenciaMinima)} CV`);

    // Generar explicaciones
    let explicacionEjes = 'Suma de los pesos máximos permitidos por eje:<br>';
    let sumaTotal = 0; // Variable para acumular el total antes de la excepción

    configuracionGrupos.forEach((grupo, index) => {
        const pesoGrupo = calcularPesoGrupo(grupo);
        sumaTotal += pesoGrupo; // Acumular el peso del grupo
        let nombreGrupo;
        
        // Obtener el nombre del grupo con el subtipo correcto
        if (grupo.groupType === 'simple') {
            nombreGrupo = grupo.subtype === 'rodado_doble' ? 'Eje Doble' : 'Eje Individual';
        } else if (grupo.groupType === 'tandem') {
            nombreGrupo = grupo.subtype === 'rodado_doble' ? 'Eje Doble' : 'Eje Simple';
        } else {
            nombreGrupo = obtenerNombreConfiguracion(grupo);
        }

        // Agregar logs para depuración
/*         console.log(`Grupo ${index + 1}:`, grupo);
        console.log(`Peso del grupo ${index + 1}: ${pesoGrupo} toneladas`);
        console.log(`Nombre del grupo ${index + 1}: ${nombreGrupo}`); */

        // Generar la explicación con el nombre correcto
        explicacionEjes += `→ Grupo ${index + 1} (${nombreGrupo}): ${pesoGrupo} toneladas<br>`;
    });

    // Ajustar el total por ejes
    const totalEjes = sumaTotal; // Usar la suma total acumulada
    explicacionEjes += `<strong>Total por ejes: ${totalEjes.toFixed(2)} toneladas</strong>`;

    // Si es una excepción, mostrar el peso máximo permitido
    if (resultado.esExcepcion) {
        explicacionEjes += `<br><strong>Nota:</strong> Aunque la suma total es ${totalEjes.toFixed(2)} toneladas, el peso máximo permitido es 45 toneladas debido a la excepción.`;
    }
    
    const relacionPesoPotencia = (resultado.pesoMaximoEjes / 1000) > 45 ? 6 : 4.25;
    const explicacionPotencia = `Según la normativa, se requiere una relación peso-potencia mínima de ${relacionPesoPotencia} CV/t ${(resultado.pesoMaximoEjes / 1000) > 45 ? '(por superar las 45 toneladas)' : ''}.<br>
        Para un peso máximo de ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas:<br>
        ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} t × ${relacionPesoPotencia} CV/t = ${Math.ceil(resultado.potenciaMinima)} CV mínimos requeridos`;

    let explicacionFinal = `Se considera:<br>
        → Peso máximo por ejes: ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas<br>
        → Peso máximo absoluto: ${(resultado.pesoMaximoAbsoluto / 1000).toFixed(2)} toneladas<br>
        <strong>Por lo tanto, el peso máximo permitido es ${resultado.pesoMaximoPermitido.toFixed(2)} toneladas</strong><br>
        <strong>La potencia mínima requerida es ${Math.ceil(resultado.potenciaMinima)} CV</strong>`;

    if (resultado.esExcepcion) {
        explicacionFinal += '<br><strong>Nota:</strong> Esta configuración "S1-D1-D1-D1-D1" es una excepción y tiene un peso máximo de 45 TN.';
    }

    $('#explicacionEjes').html(explicacionEjes);
    $('#explicacionPotencia').html(explicacionPotencia);
    $('#explicacionFinal').html(explicacionFinal);

    // Verificar configuraciones predeterminadas
    const configuracionCodigo = configuracionGrupos.map(grupo => obtenerCodigoConfiguracion(grupo)).join('-');
    
    // Buscar todas las configuraciones que coincidan exactamente con el código generado
    const configuracionesCoincidentes = window.configuracionesPredeterminadas.filter(config => config.configuracion === configuracionCodigo);

    if (configuracionesCoincidentes.length > 0) {
        configuracionesCoincidentes.forEach(config => {
            let configuracionTexto = `Configuración Nº${config.numero}, Largo: ${config.largo}m, Ancho: ${config.ancho}m, Alto: ${config.alto}m`;
            $('#pesoMaximo-config').append(`<div>${configuracionTexto}</div>`);
            $('#contenedor-imagenes').append(`<img src="img/${config.imagen}" alt="Configuración" class="img-fluid">`);
        });
    } else {
        $('#contenedor-imagenes').empty(); // Limpiar si no hay coincidencias
    }

    // Aclaraciones según configuraciones específicas
    let aclaracion = '';

    if (configuracionCodigo === 'S1-D2-D1-D1') {
        aclaracion = "La configuración identificada en el orden N° 23 puede adoptar la disposición de ejes descripta en la configuración N° 13.";
    } else if (configuracionCodigo === 'S1-D2-D2-D2') {
        aclaracion = `La configuración de Bitrén identifica en el orden 27, sólo podrá circular sin Permiso de Tránsito y con libre circulación en rutas nacionales, siempre que transporte carga indivisible. El tipo de carga considerada como indivisible será establecida por normas complementarias.<br><br>
        Configuración 27: VEHÍCULOS DE TRANSPORTE DE CARGAS QUE NO REQUIEREN PERMISO DE TRÁNSITO, PERO SOLO PUEDEN CIRCULAR POR CORREDORES EN RUTAS NACIONALES DEFINIDOS POR LA DIRECCIÓN NACIONAL DE VIALIDAD.<br>
        - La configuración de vehículo Bitrén, identificada en el orden Nº 27, que transporte carga de tipo divisible deberá circular en forma restringida por corredores, en idénticas condiciones que la configuración de vehículo Bitrén, identificada en el orden Nº 28. El tipo de carga considerada como divisible será establecida por normas complementarias.<br>
    `;
    } else if (configuracionCodigo === 'S1-D2-D3') {
        aclaracion = "Los equipos con configuración S1-D2-D3 dotados con suspensión neumática en el tándem del tractor y en el tridem del semirremolque estarán autorizados a un Peso Bruto Total Combinado de CINCUENTA Y DOS TONELADAS (52 t).";
    } else if (configuracionCodigo === 'S1-D2-D3-D3') {
        aclaracion = `
            Configuración 27: VEHÍCULOS DE TRANSPORTE DE CARGAS QUE NO REQUIEREN PERMISO DE TRÁNSITO, PERO SOLO PUEDEN CIRCULAR POR CORREDORES EN RUTAS NACIONALES DEFINIDOS POR LA DIRECCIÓN NACIONAL DE VIALIDAD.<br>
            - La configuración de vehículo Bitrén, identificada en el orden Nº 27, que transporte carga de tipo divisible deberá circular en forma restringida por corredores, en idénticas condiciones que la configuración de vehículo Bitrén, identificada en el orden Nº 28. El tipo de carga considerada como divisible será establecida por normas complementarias.<br>
            Configuración 28: VEHÍCULOS DE TRANSPORTE DE CARGAS QUE REQUIEREN PERMISO DE TRÁNSITO DE LA DIRECCIÓN NACIONAL DE VIALIDAD PARA LA CIRCULACIÓN EN RUTAS NACIONALES.
        `;
    } else if (configuracionCodigo.endsWith('D1-D1-D1')) {
        aclaracion = "Los semirremolques con configuración D1-D1-D1 deberán contar con suspensión neumática en todos los ejes y no se admitirá la reconversión o modificación de equipos usados.";
    }

    // Mostrar aclaraciones específicas
    if (aclaracion) {
        $('#aclaraciones').html(`<div class="alert alert-info">${aclaracion}</div>`);
    }


    $("#toleranciasAclaracion").removeClass("d-none");
}

// También mover la función grupoEstaCompleto fuera del document.ready
function grupoEstaCompleto($grupo) {
    const tipo = $grupo.find('.grupo-tipo').val();
    if (!tipo) return false;

    switch(tipo) {
        case 'simple':
            return $grupo.find('.subtype-select').val() !== null;
        case 'tandem':
            return $grupo.find('.subtype-select').val() !== null && 
                   $grupo.find('.distancia-input').val() !== '';
        case 'tridem':
            return $grupo.find('.subtype-select').val() !== null && 
                   $grupo.find('.distancia1-input').val() !== '' &&
                   $grupo.find('.distancia2-input').val() !== '';
        case 'mixto':
            return $grupo.find('.tandem-subtype-select').val() !== null &&
                   $grupo.find('.tandem-distancia-input').val() !== '' &&
                   $grupo.find('.simple-subtype-select').val() !== null &&
                   $grupo.find('.distancia-entre-input').val() !== '';
        default:
            return false;
    }
}

$(document).ready(function() {
    // Modificar el handler de agregar-rapido
    $('.agregar-rapido').click(function() {
        const tipo = $(this).data('tipo');
        const subtipo = $(this).data('subtipo');
        
        // Si es el primer grupo, modificar el existente en lugar de crear uno nuevo
        if ($('.grupo-ejes').length === 1 && $('.grupo-ejes').first().find('.grupo-tipo').val() === '') {
            const $primerGrupo = $('.grupo-ejes').first();
            $primerGrupo.find('.grupo-tipo').val(tipo).trigger('change');
            
            // Esperar a que se cargue el template
            setTimeout(() => {
                $primerGrupo.find('.subtype-select').val(subtipo);
                
                // Configurar distancias por defecto si es necesario
                if (tipo === 'tandem') {
                    $primerGrupo.find('.distancia-input').val('1.20');
                } else if (tipo === 'tridem') {
                    $primerGrupo.find('.distancia1-input').val('1.20');
                    $primerGrupo.find('.distancia2-input').val('1.20');
                }
                
                actualizarCalculos();
            }, 100);
            
            return;
        }
        
        // Si no es el primer grupo, crear uno nuevo
        const nuevoGrupo = $(`
            <div class="grupo-ejes card p-3 mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <select class="form-select grupo-tipo" style="width: auto;">
                        <option value="">Seleccione tipo de grupo</option>
                        <option value="simple">Eje Simple</option>
                        <option value="tandem">Tándem (2 ejes)</option>
                        <option value="tridem">Trídem (3 ejes)</option>
                        <option value="mixto">Mixto (Tándem + Simple)</option>
                    </select>
                    <button class="btn btn-outline-danger btn-sm eliminar-grupo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="configuracion-grupo"></div>
            </div>
        `);

        // Agregar el nuevo grupo antes de configurarlo
        $('.grupos-container').append(nuevoGrupo);

        // Establecer el tipo y esperar a que se cargue el template
        nuevoGrupo.find('.grupo-tipo').val(tipo).trigger('change');

        // Esperar a que se cargue el template y configurar el subtipo y distancias
        setTimeout(() => {
            const $subtype = nuevoGrupo.find('.subtype-select');
            if ($subtype.length) {
                $subtype.val(subtipo);
            }
            
            if (tipo === 'tandem') {
                nuevoGrupo.find('.distancia-input').val('1.20');
            } else if (tipo === 'tridem') {
                nuevoGrupo.find('.distancia1-input').val('1.20');
                nuevoGrupo.find('.distancia2-input').val('1.20');
            }
            
            actualizarCalculos();
        }, 200); // Aumentado el tiempo de espera para asegurar que el template se cargue
    });

    $(document).on('change', '.grupo-tipo', function() {
        const tipo = $(this).val();
        const configContainer = $(this).closest('.grupo-ejes').find('.configuracion-grupo');
        if (tipo && TEMPLATES[tipo]) {
            configContainer.html(TEMPLATES[tipo]);
        } else {
            configContainer.empty();
        }
    });

    $(document).on('click', '.eliminar-grupo', function() {
        $(this).closest('.grupo-ejes').remove();
        actualizarCalculos();
    });

    // Eventos para actualización automática
    $(document).on('change input', '.subtype-select, .grupo-tipo, .tandem-subtype-select, .simple-subtype-select', actualizarCalculos);
    $(document).on('input', '.distancia-input, .distancia1-input, .distancia2-input, .tandem-distancia-input, .distancia-entre-input', function() {
        const valor = parseFloat($(this).val());
        const $grupo = $(this).closest('.grupo-ejes');
        const tipo = $grupo.find('.grupo-tipo').val();
        
        if (tipo === 'tandem') {
            const esValido = !valor || (valor >= VALIDACIONES[tipo].minDistancia && valor <= VALIDACIONES[tipo].maxDistancia);
            mostrarValidacion($(this), VALIDACIONES[tipo].mensaje, esValido);
        } else if (tipo === 'tridem') {
            const distancia1 = parseFloat($grupo.find('.distancia1-input').val()) || 0;
            const distancia2 = parseFloat($grupo.find('.distancia2-input').val()) || 0;
            const distanciaTotal = distancia1 + distancia2;
            
            // Validar distancia individual
            const esValidoIndividual = !valor || (valor >= VALIDACIONES[tipo].minDistancia && valor <= VALIDACIONES[tipo].maxDistancia);
            mostrarValidacion($(this), VALIDACIONES[tipo].mensaje, esValidoIndividual);
            
            // Validar suma total solo si ambos campos tienen valor
            if (distancia1 && distancia2) {
                const esValidoTotal = distanciaTotal >= VALIDACIONES[tipo].minDistanciaTotal && 
                                    distanciaTotal <= VALIDACIONES[tipo].maxDistanciaTotal;
                
                // Mostrar validación en ambos campos
                mostrarValidacion($grupo.find('.distancia1-input'), VALIDACIONES[tipo].mensajeTotal, esValidoTotal);
                mostrarValidacion($grupo.find('.distancia2-input'), VALIDACIONES[tipo].mensajeTotal, esValidoTotal);
            }
        } else if (tipo === 'simple' || tipo === 'mixto') {
            // No hay validaciones para 'simple' y 'mixto', así que no hacemos nada
        } else {
            // Manejar el caso donde no hay validaciones definidas
            mostrarValidacion($(this), 'No hay validaciones para este tipo de grupo.', true);
        }
        
        actualizarCalculos();
    });

    // Remover el evento submit del formulario ya que no lo necesitamos más
    $('#calculadoraForm').submit(function(e) {
        e.preventDefault();
    });

    // Opcional: Remover el botón de calcular ya que no es necesario
    $('#calculadoraForm button[type="submit"]').remove();

    // Agregar el handler para el botón agregarGrupo
    $('#agregarGrupo').click(function() {
        const nuevoGrupo = $(`
            <div class="grupo-ejes card p-3 mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <select class="form-select grupo-tipo" style="width: auto;">
                        <option value="">Seleccione tipo de grupo</option>
                        <option value="simple">Eje Simple</option>
                        <option value="tandem">Tándem (2 ejes)</option>
                        <option value="tridem">Trídem (3 ejes)</option>
                        <option value="mixto">Mixto (Tándem + Simple)</option>
                    </select>
                    <button class="btn btn-outline-danger btn-sm eliminar-grupo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="configuracion-grupo"></div>
            </div>
        `);
        
        $('.grupos-container').append(nuevoGrupo);
    });

    // Agregar handler para el botón de reiniciar
    $('#reiniciarCalculadora').click(function() {
        $('.grupo-ejes:not(:first)').remove();
            
        // Resetear el primer grupo
        const $primerGrupo = $('.grupo-ejes').first();
        $primerGrupo.find('.grupo-tipo').val('').trigger('change');
        
        // Limpiar resultados
        $('#pesoMaximo-config').text('Configure los grupos de ejes');
        $('#pesoMaximo-peso').text('--');
        $('#pesoMaximo-potencia').text('--');
        $('#explicacionEjes, #explicacionPotencia, #explicacionFinal').empty();
    });
});

// Función para calcular reducción por distancia insuficiente (< 1.20m)
// Por cada 0.08m (8 cm) por debajo de 1.20, se reduce 1000 kg (1 TN)
function calcularReduccion(distancia) {
    if (distancia >= 1.20) return 0;
    const diferencia = 1.20 - distancia;
    const reduccionTonKg = Math.floor((diferencia * 100) / 8) * 1000;
    return reduccionTonKg;
}

function calcularPesoGrupo(grupo) {
    let pesoGrupo = 0;

    switch(grupo.groupType) {
        case 'simple':
            pesoGrupo = limitesPeso['eje_' + grupo.groupType + '_' + grupo.subtype];
            break;
        case 'tandem':
            if (grupo.distancia >= 1.20 && grupo.distancia <= 2.40) {
                pesoGrupo = limitesPeso[grupo.groupType + '_' + grupo.subtype];
            } else if (grupo.distancia > 2.40 && grupo.subtype === 'rodado_doble') {
                pesoGrupo = 21000; // 21 TN
            } else if (grupo.distancia > 2.40) {
                if (grupo.subtype === 'rodado_doble') {
                    pesoGrupo = 2 * limitesPeso['eje_simple_rodado_doble'];
                } else if (grupo.subtype === 'superanchas') {
                    pesoGrupo = 2 * limitesPeso['eje_simple_superanchas'];
                } else if (grupo.subtype === 'rodado_doble_superanchas') {
                    pesoGrupo = limitesPeso['tandem_rodado_doble_superanchas'];
                } else {
                    pesoGrupo = 2 * limitesPeso['eje_simple_ruedas_individuales'];
                }
            } else if (grupo.distancia < 1.20) {
                const reduccion = calcularReduccion(grupo.distancia);
                const base = limitesPeso[grupo.groupType + '_' + grupo.subtype];
                pesoGrupo = Math.max(base - reduccion, 0);
            }
            break;
        case 'tridem':
            if (grupo.distancias) {
                const d1 = grupo.distancias[0];
                const d2 = grupo.distancias[1];
                let reduccion = 0;
                if (d1 < 1.20) reduccion += calcularReduccion(d1);
                if (d2 < 1.20) reduccion += calcularReduccion(d2);
                
                if (d1 >= 1.20 && d1 <= 2.40 && d2 >= 1.20 && d2 <= 2.40) {
                    pesoGrupo = limitesPeso[grupo.groupType + '_' + grupo.subtype];
                } else {
                    const base = limitesPeso[grupo.groupType + '_' + grupo.subtype];
                    pesoGrupo = Math.max(base - reduccion, 0);
                }
            }
            break;
        case 'mixto':
            // Caso especial: tándem rodado doble + eje rodado doble
            if (grupo.tandem.subtype === 'rodado_doble' && 
                grupo.independiente.subtype === 'rodado_doble' && 
                grupo.tandem.distancia >= 1.20 && 
                grupo.tandem.distancia <= 2.40 && 
                grupo.distanciaEntre > 2.40) {
                pesoGrupo = 28500; // 18 TN + 10.5 TN
            } else {
                // Cálculo normal para otros casos
                let pesoTandem = 0;
                if (grupo.tandem.distancia >= 1.20 && grupo.tandem.distancia <= 2.40) {
                    pesoTandem = limitesPeso['tandem_' + grupo.tandem.subtype];
                } else if (grupo.tandem.distancia < 1.20) {
                    const reduccion = calcularReduccion(grupo.tandem.distancia);
                    const base = limitesPeso['tandem_' + grupo.tandem.subtype];
                    pesoTandem = Math.max(base - reduccion, 0);
                } else if (grupo.tandem.distancia > 2.40) {
                    if (grupo.tandem.subtype === 'rodado_doble') {
                        pesoTandem = 2 * limitesPeso['eje_simple_rodado_doble'];
                    } else {
                        pesoTandem = 2 * limitesPeso['eje_simple_ruedas_individuales'];
                    }
                }
                
                const pesoIndependiente = limitesPeso['eje_simple_' + grupo.independiente.subtype];
                pesoGrupo = pesoTandem + pesoIndependiente;
            }
            break;
    }

    return pesoGrupo / 1000; // Convertir a toneladas
}

function obtenerCodigoConfiguracion(grupo) {
    switch(grupo.groupType) {
        case 'simple':
            return grupo.subtype === 'rodado_doble' ? 'D1' : 'S1';
        case 'tandem':
            return grupo.subtype === 'rodado_doble' ? 'D2' : 'S2';
        case 'tridem':
            return 'D3';
        case 'mixto':
            const tandemCodigo = grupo.tandem.subtype === 'rodado_doble' ? 'D2' : 'S2';
            const simpleCodigo = grupo.independiente.subtype === 'rodado_doble' ? 'D1' : 'S1';
            return `${tandemCodigo}-${simpleCodigo}`;
    }
}

function obtenerNombreConfiguracion(grupo) {
    switch(grupo.groupType) {
        case 'simple':
            return grupo.subtype === 'rodado_doble' ? 'Eje Doble' : 'Eje Simple';
        case 'tandem':
            return grupo.subtype === 'rodado_doble' ? 'Tándem Doble' : 'Tándem Simple';
        case 'tridem':
            return 'Trídem';
        case 'mixto':
            return `Mixto (${obtenerNombreConfiguracion({ groupType: 'tandem', subtype: grupo.tandem.subtype })} + ${obtenerNombreConfiguracion({ groupType: 'simple', subtype: grupo.independiente.subtype })})`;
    }
}

function calcularPesoMaximo(configuracionGrupos) {
    let pesoMaximoEjes = 0;
    
    // Calcular peso total sumando cada grupo
    configuracionGrupos.forEach(grupo => {
        pesoMaximoEjes += calcularPesoGrupo(grupo);
    });

    // Verificar si la configuración es "S1-D1-D1-D1-D1"
    const esExcepcion = configuracionGrupos.length === 5 &&
                        configuracionGrupos[0].groupType === 'simple' && 
                        configuracionGrupos[0].subtype === 'ruedas_individuales' &&
                        configuracionGrupos[1].groupType === 'simple' && 
                        configuracionGrupos[1].subtype === 'rodado_doble' &&
                        configuracionGrupos[2].groupType === 'simple' && 
                        configuracionGrupos[2].subtype === 'rodado_doble' &&
                        configuracionGrupos[3].groupType === 'simple' && 
                        configuracionGrupos[3].subtype === 'rodado_doble' &&
                        configuracionGrupos[4].groupType === 'simple' && 
                        configuracionGrupos[4].subtype === 'rodado_doble';

    if (esExcepcion) {
        pesoMaximoEjes = 45000; // 45 TN
    } else {
        // Aplicar límite absoluto de 75 toneladas
        pesoMaximoEjes = Math.min(pesoMaximoEjes * 1000, PESO_MAXIMO_ABSOLUTO * 1000);
    }

    const relacionPesoPotencia = (pesoMaximoEjes / 1000) > 45 ? 6 : 4.25;
    const potenciaMinima = Math.ceil((pesoMaximoEjes / 1000) * relacionPesoPotencia);

    // Generar código de configuración
    const codigoConfiguracion = configuracionGrupos
        .map(grupo => {
            if (grupo.groupType === 'simple') {
                return grupo.subtype === 'rodado_doble' ? 'D1' : 'S1';
            } else if (grupo.groupType === 'tandem') {
                if (grupo.subtype === 'rodado_doble') {
                    return 'D2';
                } else if (grupo.subtype === 'mixto') {
                    return 'Mixto';
                } else if (grupo.subtype === 'superanchas') {
                    return 'Superanchas Dobles';
                } else if (grupo.subtype === 'rodado_doble_superanchas') {
                    return 'Doble + Superanchas';
                } else {
                    return 'S2'; // Para el caso de 'rodado_doble'
                }
            } else if (grupo.groupType === 'tridem') {
                return 'D3';
            } else {
                return obtenerNombreConfiguracion(grupo); // Para 'mixto' y otros casos
            }
        })
        .join('-');

    return {
        pesoMaximoEjes: pesoMaximoEjes,
        potenciaMinima: potenciaMinima,
        pesoMaximoPermitido: pesoMaximoEjes / 1000,
        pesoMaximoAbsoluto: PESO_MAXIMO_ABSOLUTO * 1000,
        configuracion: `CONFIGURACIÓN ${codigoConfiguracion}`,
        esExcepcion: esExcepcion // Indicar si es una excepción
    };
}

// Modificar la función de validación visual
function mostrarValidacion($input, mensaje, esValido) {
    const $feedbackDiv = $input.siblings('.invalid-feedback');
    if (!$feedbackDiv.length) {
        $input.after(`<div class="invalid-feedback">${mensaje}</div>`);
    }
    
    $input.toggleClass('is-invalid', !esValido);
    $input.toggleClass('is-valid', esValido);
    
    // Ocultar resultados si hay un valor inválido
    if (!esValido && $input.val() !== '') {
        $('#pesoMaximo-config').text('Configure los grupos de ejes');
        $('#pesoMaximo-peso').text('--');
        $('#pesoMaximo-potencia').text('--');
        $('#explicacionEjes, #explicacionPotencia, #explicacionFinal').empty();
    }
}