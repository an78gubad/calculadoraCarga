const TEMPLATES = {
    simple: `
        <div class="mb-2">
            <label class="form-label">Tipo de Rodado</label>
            <select class="form-select subtype-select">
                <option value="ruedas_individuales">Ruedas Individuales (6.000 kg)</option>
                <option value="rodado_doble">Rodado Doble (10.500 kg)</option>
            </select>
        </div>
    `,
    tandem: `
        <div class="mb-2">
            <label class="form-label">Tipo de Rodado</label>
            <select class="form-select subtype-select">
                <option value="ruedas_individuales">Ruedas Individuales (10.000 kg)</option>
                <option value="mixto">Mixto (14.000 kg)</option>
                <option value="rodado_doble">Rodado Doble (18.000 kg)</option>
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
                <option value="rodado_doble">Rodado Doble (25.500 kg)</option>
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
                    <option value="ruedas_individuales">Ruedas Individuales</option>
                    <option value="mixto">Mixto</option>
                    <option value="rodado_doble">Rodado Doble</option>
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
                    <option value="ruedas_individuales">Ruedas Individuales</option>
                    <option value="rodado_doble">Rodado Doble</option>
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
    'tandem_ruedas_individuales': 10000,
    'tandem_mixto': 14000,
    'tandem_rodado_doble': 18000,
    'tridem_rodado_doble': 25500
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
        mensaje: "Las distancias entre ejes deben estar entre 1.20m y 2.40m"
    }
};

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

    // Función para verificar si un grupo está completo
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

    // Función para actualizar cálculos
    function actualizarCalculos() {
        const potenciaCV = parseFloat($('#potenciaCV').val());
        if (!potenciaCV) return;

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

        const resultado = calcularPesoMaximo(potenciaCV, configuracionGrupos);
        
        $('#pesoEjes').text((resultado.pesoMaximoEjes / 1000).toFixed(2));
        $('#pesoPotencia').text(resultado.pesoMaximoPotencia.toFixed(2));
        $('#pesoMaximo').text(resultado.pesoMaximoPermitido.toFixed(2));

        // Generar explicaciones
        let explicacionEjes = 'Suma de los pesos máximos permitidos por eje:<br>';
        configuracionGrupos.forEach((grupo, index) => {
            const pesoGrupo = calcularPesoGrupo(grupo);
            const nombreGrupo = $(".grupo-tipo option[value='" + grupo.groupType + "']").text().split('(')[0];
            explicacionEjes += `→ Grupo ${index + 1} (${nombreGrupo}): ${pesoGrupo} toneladas<br>`;
        });
        explicacionEjes += `<strong>Total por ejes: ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas</strong>`;
        
        const explicacionPotencia = `Según la normativa, se requiere una relación peso-potencia mínima de 4.25 CV/t.<br>
            Con una potencia de ${potenciaCV} CV:<br>
            ${potenciaCV} CV ÷ 4.25 CV/t = ${resultado.pesoMaximoPotencia.toFixed(2)} toneladas máximas por potencia`;

        const explicacionFinal = `Se toma el menor valor entre:<br>
            → Peso máximo por ejes: ${(resultado.pesoMaximoEjes / 1000).toFixed(2)} toneladas<br>
            → Peso máximo por potencia: ${resultado.pesoMaximoPotencia.toFixed(2)} toneladas<br>
            → Peso máximo absoluto: ${(resultado.pesoMaximoAbsoluto / 1000).toFixed(2)} toneladas<br>
            <strong>Por lo tanto, el peso máximo permitido es ${resultado.pesoMaximoPermitido.toFixed(2)} toneladas</strong>`;

        $('#explicacionEjes').html(explicacionEjes);
        $('#explicacionPotencia').html(explicacionPotencia);
        $('#explicacionFinal').html(explicacionFinal);
        
        $('#resultados').removeClass('d-none');
    }

    // Eventos para actualización automática
    $(document).on('change input', '#potenciaCV, .subtype-select, .grupo-tipo, .tandem-subtype-select, .simple-subtype-select', actualizarCalculos);
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
                // Caso especial: dos ejes independientes con rodado doble > 2.4m
                pesoGrupo = 21000; // 21 TN
            } else if (grupo.distancia > 2.40) {
                // Si la distancia es mayor a 2.40, se tratan como ejes independientes
                if (grupo.subtype === 'rodado_doble') {
                    pesoGrupo = 2 * limitesPeso['eje_simple_rodado_doble'];
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

function calcularPesoMaximo(potenciaCV, configuracionGrupos) {
    let pesoMaximoEjes = 0;

    configuracionGrupos.forEach(grupo => {
        pesoMaximoEjes += calcularPesoGrupo(grupo);
    });

    const pesoMaximoPotencia = potenciaCV / 4.25;
    const pesoMaximoPermitido = Math.min(
        pesoMaximoEjes, 
        pesoMaximoPotencia,
        PESO_MAXIMO_ABSOLUTO
    );

    return {
        pesoMaximoEjes: pesoMaximoEjes * 1000,
        pesoMaximoPotencia: pesoMaximoPotencia,
        pesoMaximoPermitido: pesoMaximoPermitido,
        pesoMaximoAbsoluto: PESO_MAXIMO_ABSOLUTO * 1000
    };
}

// Agregar validaciones visuales
function mostrarValidacion($input, mensaje, esValido) {
    const $feedbackDiv = $input.siblings('.invalid-feedback');
    if (!$feedbackDiv.length) {
        $input.after(`<div class="invalid-feedback">${mensaje}</div>`);
    }
    
    $input.toggleClass('is-invalid', !esValido);
    $input.toggleClass('is-valid', esValido);
}

// Modificar el evento de cambio para inputs de distancia
$(document).on('input', '.distancia-input, .distancia1-input, .distancia2-input, .tandem-distancia-input, .distancia-entre-input', function() {
    const valor = parseFloat($(this).val());
    const $grupo = $(this).closest('.grupo-ejes');
    const tipo = $grupo.find('.grupo-tipo').val();
    
    if (tipo === 'tandem' || tipo === 'tridem') {
        const esValido = valor >= VALIDACIONES[tipo].minDistancia && valor <= VALIDACIONES[tipo].maxDistancia;
        mostrarValidacion($(this), VALIDACIONES[tipo].mensaje, esValido);
    }
    
    actualizarCalculos();
});