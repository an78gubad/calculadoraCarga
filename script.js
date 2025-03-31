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

// Mover la función fuera del document.ready
function actualizarCalculos() {
    // Verificar que haya más de un grupo de ejes
    if ($('.grupo-ejes').length <= 1) {
        $('#resultados').addClass('d-none');
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
        $('#resultados').addClass('d-none');
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
        $('#resultados').addClass('d-none');
        return;
    }

    const resultado = calcularPesoMaximo(configuracionGrupos);
    
    $('#pesoMaximo').html(`<strong>${resultado.configuracion}</strong><br><strong>Peso máximo permitido:</strong> ${resultado.pesoMaximoPermitido.toFixed(2)} toneladas - <strong>Potencia mínima requerida:</strong> ${Math.ceil(resultado.potenciaMinima)} CV`);

    // Generar explicaciones
    let explicacionEjes = 'Suma de los pesos máximos permitidos por eje:<br>';
    configuracionGrupos.forEach((grupo, index) => {
        const pesoGrupo = calcularPesoGrupo(grupo);
        let nombreGrupo;
        let codigo = obtenerCodigoConfiguracion(grupo);
        
        switch(grupo.groupType) {
            case 'simple':
                nombreGrupo = 'Eje Simple';
                break;
            case 'tandem':
                nombreGrupo = 'Tándem';
                break;
            case 'tridem':
                nombreGrupo = 'Trídem';
                break;
            case 'mixto':
                nombreGrupo = 'Mixto';
                break;
        }
        explicacionEjes += `→ Grupo ${index + 1} (${codigo} - ${nombreGrupo}): ${pesoGrupo} toneladas<br>`;
    });
    explicacionEjes += `<strong>Total por ejes: ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas</strong>`;
    
    const relacionPesoPotencia = (resultado.pesoMaximoEjes / 1000) > 45 ? 6 : 4.25;
    const explicacionPotencia = `Según la normativa, se requiere una relación peso-potencia mínima de ${relacionPesoPotencia} CV/t ${(resultado.pesoMaximoEjes / 1000) > 45 ? '(por superar las 45 toneladas)' : ''}.<br>
        Para un peso máximo de ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas:<br>
        ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} t × ${relacionPesoPotencia} CV/t = ${Math.ceil(resultado.potenciaMinima)} CV mínimos requeridos`;

    const explicacionFinal = `Se considera:<br>
        → Peso máximo por ejes: ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas<br>
        → Peso máximo absoluto: ${(resultado.pesoMaximoAbsoluto / 1000).toFixed(2)} toneladas<br>
        <strong>Por lo tanto, el peso máximo permitido es ${resultado.pesoMaximoPermitido.toFixed(2)} toneladas</strong><br>
        <strong>La potencia mínima requerida es ${Math.ceil(resultado.potenciaMinima)} CV</strong>`;

    $('#explicacionEjes').html(explicacionEjes);
    $('#explicacionPotencia').html(explicacionPotencia);
    $('#explicacionFinal').html(explicacionFinal);
    
    $('#resultados').removeClass('d-none');
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
    });

    // Eventos para actualización automática
    $(document).on('change input', '.subtype-select, .grupo-tipo, .tandem-subtype-select, .simple-subtype-select', actualizarCalculos);
    $(document).on('input', '.distancia-input, .distancia1-input, .distancia2-input, .tandem-distancia-input, .distancia-entre-input', actualizarCalculos);

    // Remover el evento submit del formulario ya que no lo necesitamos más
    $('#calculadoraForm').submit(function(e) {
        e.preventDefault();
    });

    // Opcional: Remover el botón de calcular ya que no es necesario
    $('#calculadoraForm button[type="submit"]').remove();
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

function calcularPesoMaximo(configuracionGrupos) {
    let pesoMaximoEjes = 0;
    
    // Generar código de configuración
    const codigoConfiguracion = configuracionGrupos
        .map(grupo => obtenerCodigoConfiguracion(grupo))
        .join('-');

    configuracionGrupos.forEach(grupo => {
        pesoMaximoEjes += calcularPesoGrupo(grupo);
    });

    pesoMaximoEjes = Math.min(pesoMaximoEjes * 1000, PESO_MAXIMO_ABSOLUTO * 1000);
    const relacionPesoPotencia = (pesoMaximoEjes / 1000) > 45 ? 6 : 4.25;
    const potenciaMinima = Math.ceil((pesoMaximoEjes / 1000) * relacionPesoPotencia);

    return {
        pesoMaximoEjes: pesoMaximoEjes,
        potenciaMinima: potenciaMinima,
        pesoMaximoPermitido: pesoMaximoEjes / 1000,
        pesoMaximoAbsoluto: PESO_MAXIMO_ABSOLUTO * 1000,
        configuracion: `CONFIGURACIÓN ${codigoConfiguracion}`
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
        $('#resultados').addClass('d-none');
    }
}

// Modificar el evento de cambio para inputs de distancia
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
    }
    
    actualizarCalculos();
});