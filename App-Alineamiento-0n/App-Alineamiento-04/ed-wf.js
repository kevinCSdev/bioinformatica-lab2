// ed-wf.js
// Implementación mínima de Edit Distance (Wagner–Fischer)
// Depende de las utilidades existentes: encontrarCelda(matriz,i,j), obtenerCoordenadas(paso) y globales edges, n, m

function inicializacionED(edgesArray, seq1, seq2, gap = 1) {
    // Versi simplificada usada por algunos flujos; solo inicializa primera fila/col
    const nLocal = (seq1 || '').length + 1;
    const mLocal = (seq2 || '').length + 1;
    edgesArray.forEach(c => {
        if (c.i === 0 && c.j === 0) c.puntaje = 0;
        else if (c.i === 0) c.puntaje = c.j * gap; // j inserciones (costo acumulado)
        else if (c.j === 0) c.puntaje = c.i * gap; // i eliminaciones (costo acumulado)
        else c.puntaje = undefined;
        c.diagonal = 0; c.superior = 0; c.lateral = 0; c.camino = 0;
        c.diagonalF = 0; c.superiorF = 0; c.lateralF = 0;
    });
    return edgesArray;
}

function siguienteED(paso) {
    const coords = obtenerCoordenadas(paso);
    if (!coords) return;
    const i = coords[0], j = coords[1];
    // No tocar bordes (i==0 || j==0) porque ya están inicializados
    if (i === 0 || j === 0) return;

    const cel = encontrarCelda(edges, i, j);
    const diag = encontrarCelda(edges, i - 1, j - 1);
    const up = encontrarCelda(edges, i - 1, j);
    const left = encontrarCelda(edges, i, j - 1);
    const seq1 = (document.getElementById('seq_1') ? document.getElementById('seq_1').value : '') || '';
    const seq2 = (document.getElementById('seq_2') ? document.getElementById('seq_2').value : '') || '';

    const costSub = (seq1[i - 1] === seq2[j - 1]) ? 0 : 1;
    const cDiag = (diag && typeof diag.puntaje === 'number') ? diag.puntaje + costSub : Infinity;
    const cUp = (up && typeof up.puntaje === 'number') ? up.puntaje + 1 : Infinity;
    const cLeft = (left && typeof left.puntaje === 'number') ? left.puntaje + 1 : Infinity;

    const best = Math.min(cDiag, cUp, cLeft);
    cel.puntaje = best;
    cel.diagonal = (best === cDiag) ? 1 : 0;
    cel.superior = (best === cUp) ? 1 : 0;
    cel.lateral = (best === cLeft) ? 1 : 0;
}

// function tracebackED(matriz) {
//     // Dimensiones globales: n (filas = |seq1|+1), m (cols = |seq2|+1)
//     let i = n - 1;
//     let j = m - 1;

//     const seq1 = $('#seq_1').val();
//     const seq2 = $('#seq_2').val();

//     // Costos (positivos) para ED
//     const mismatchCost = Math.abs(parseInt($('#mismatchScore').val(), 10));
//     const gapCost = Math.abs(parseInt($('#gapScore').val(), 10));
//     // match cost = 0

//     let camino = [];
//     let coordenadas = [];
//     let pasos = [];

//     while (i > 0 || j > 0) {
//         let c = encontrarCelda(matriz, i, j);
//         camino.push(c);
//         coordenadas.push([i, j]);

//         // Valores vecinos (si existen)
//         const up = (i > 0) ? encontrarCelda(matriz, i - 1, j).puntaje : Number.POSITIVE_INFINITY;
//         const left = (j > 0) ? encontrarCelda(matriz, i, j - 1).puntaje : Number.POSITIVE_INFINITY;
//         const diag = (i > 0 && j > 0) ? encontrarCelda(matriz, i - 1, j - 1).puntaje : Number.POSITIVE_INFINITY;

//         const diagCost = (i > 0 && j > 0) ? (diag + (seq1[i - 1] === seq2[j - 1] ? 0 : mismatchCost)) : Number.POSITIVE_INFINITY;
//         const upCost = (i > 0) ? (up + gapCost) : Number.POSITIVE_INFINITY;
//         const leftCost = (j > 0) ? (left + gapCost) : Number.POSITIVE_INFINITY;

//         const best = Math.min(diagCost, upCost, leftCost);

//         if (best === diagCost) {
//             pasos.push("diagonal");
//             i--; j--;
//         } else if (best === upCost) {
//             pasos.push("superior");
//             i--;
//         } else {
//             pasos.push("lateral");
//             j--;
//         }
//     }

//     return { camino, coordenadas, pasos };
// }


// Export (global functions available to rest of app)
window.inicializacionED = inicializacionED;
window.siguienteED = siguienteED;
/* ed-wf.js  —  Distancia de edición (Wagner–Fischer)
   - inicializacionED(edges, seq1, seq2): devuelve edges con matriz y flechas
   - tracebackED(): devuelve { seq1, seq2, puntaje } usando la última DP
   - computeED(): función pura que arma DP y backpointers
*/

(function () {
    // Estado interno ED (similar a como manejas NW/SW con globals)
    let DP = null;           // matriz numérica
    let BT = null;           // backpointers: 'd','u','s' (diagonal/up/side)
    let S1 = "";             // secuencia vertical (tu “seq_1”)
    let S2 = "";             // secuencia horizontal (tu “seq_2”)
    let COSTS = { match: 0, mismatch: 1, gap: 1 };
    let lastEdges = [];      // edges generados para D3
    let caminosED = null;    // camino final (para retroceder.js/avanzar.js si lo necesitan)

    function readCostsForED() {
        // ED estándar por defecto: match=0, mismatch=1, gap=1.
        // Lee valores desde los inputs si existen en el DOM.
        try {
            const mEl = document.getElementById('matchScore');
            const mmEl = document.getElementById('mismatchScore');
            const gEl = document.getElementById('gapScore');

            const m = mEl ? parseInt(mEl.value, 10) : NaN;
            const mm = mmEl ? parseInt(mmEl.value, 10) : NaN;
            const g = gEl ? parseInt(gEl.value, 10) : NaN;

            // Para ED interpretamos los parámetros como COSTOS (no puntajes).
            // Match se trata como costo 0 por defecto. Mismatch/gap son valores positivos.
            COSTS = {
                match: 0,
                mismatch: Number.isFinite(mm) ? Math.abs(mm) : 1,
                gap: Number.isFinite(g) ? Math.abs(g) : 1
            };
        } catch (e) {
            // Fallback a valores por defecto si algo sale mal
            COSTS = { match: 0, mismatch: 1, gap: 1 };
        }
    }

    // Calcula DP + backpointers para ED (mínimo)
    function computeED(seq1, seq2) {
        readCostsForED();

        const n = seq1.length;
        const m = seq2.length;
        const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        const bt = Array.from({ length: n + 1 }, () => Array(m + 1).fill([]));

        // Inicializaciones
        for (let i = 1; i <= n; i++) {
            dp[i][0] = i * COSTS.gap;
            bt[i][0] = ['u']; // venir “desde arriba” (baja en tu grid)
        }
        for (let j = 1; j <= m; j++) {
            dp[0][j] = j * COSTS.gap;
            bt[0][j] = ['s']; // venir “desde el lado”
        }

        // Relleno
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                const subCost = (seq1[i - 1] === seq2[j - 1]) ? COSTS.match : COSTS.mismatch;

                const diag = dp[i - 1][j - 1] + subCost;       // diagonal (sustitución o match)
                const up = dp[i - 1][j] + COSTS.gap;           // insertar gap en horizontal (baja)
                const side = dp[i][j - 1] + COSTS.gap;         // insertar gap en vertical (izq)

                const best = Math.min(diag, up, side);
                dp[i][j] = best;

                const dirs = [];
                if (best === diag) dirs.push('d');
                if (best === up) dirs.push('u');
                if (best === side) dirs.push('s');
                bt[i][j] = dirs;
            }
        }

        return { dp, bt };
    }

    // Crea edges con el mismo estilo que usas en inicializar.js:
    // - d.puntaje
    // - d.diagonal / d.superior / d.lateral (valores base para tooltip)
    // - y marcadores diagonales/superior/lateral (para flechas)
    function edgesFromED(dp, bt, seq1, seq2) {
        const n = seq1.length + 1;
        const m = seq2.length + 1;
        const edges = [];

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                const cell = {
                    i, j,
                    puntaje: dp[i][j],
                    // Para tooltips (texto fuente)
                    d: (i > 0 && j > 0) ? dp[i - 1][j - 1] : 0,
                    s: (i > 0) ? dp[i - 1][j] : 0,
                    l: (j > 0) ? dp[i][j - 1] : 0,
                    // Para dibujar flechas durante "retroceder" (las flags de flecha
                    // deben activarse solo durante la fase de traceback). Aquí las
                    // dejamos en 0; script.js se encargará de activar diagonalF/.. cuando
                    // se marque el camino final.
                        diagonalF: 0, superiorF: 0, lateralF: 0,
                        diagonal: 0, superior: 0, lateral: 0,
                    max: dp[i][j], // (en ED sería “best”, pero lo muestras como "Puntaje ganador")
                    match: (i > 0 && j > 0) ? ((seq1[i - 1] === seq2[j - 1]) ? "coincidencia" : "desajuste") : ""
                };

                // Marca flechas según backpointer (bt guarda posibles empates)
                const dirs = bt[i][j] || [];
                // Marcar únicamente las direcciones posibles en 'diagonal/superior/lateral'
                // pero NO activar las flags de flecha (diagonalF/superiorF/lateralF)
                // para evitar que las flechas aparezcan antes del traceback.
                if (dirs.includes('d')) { cell.diagonal = 1; }
                if (dirs.includes('u')) { cell.superior = 1; }
                if (dirs.includes('s')) { cell.lateral = 1; }

                edges.push(cell);
            }
        }

        // Además prepara un traceback determinista usando recálculo directo
        const camino = [];
        const pasos = [];
        let I = seq1.length, J = seq2.length;
        while (I > 0 || J > 0) {
            const currentCost = dp[I][J];
            let validMoves = [];
            
            // Verificar movimiento diagonal
            if (I > 0 && J > 0) {
                const substitutionCost = (seq1[I-1] === seq2[J-1]) ? COSTS.match : COSTS.mismatch;
                const expectedCost = dp[I-1][J-1] + substitutionCost;
                if (Math.abs(expectedCost - currentCost) < 0.0001) {
                    validMoves.push({type: 'd', cost: dp[I-1][J-1]});
                }
            }
            
            // Verificar movimiento superior
            if (I > 0) {
                const expectedCost = dp[I-1][J] + COSTS.gap;
                if (Math.abs(expectedCost - currentCost) < 0.0001) {
                    validMoves.push({type: 'u', cost: dp[I-1][J]});
                }
            }
            
            // Verificar movimiento lateral
            if (J > 0) {
                const expectedCost = dp[I][J-1] + COSTS.gap;
                if (Math.abs(expectedCost - currentCost) < 0.0001) {
                    validMoves.push({type: 's', cost: dp[I][J-1]});
                }
            }
            
            if (validMoves.length === 0) break;
            
            // Elegir el movimiento óptimo
            validMoves.sort((a, b) => {
                if (Math.abs(a.cost - b.cost) < 0.0001) {
                    const priority = {d: 1, u: 2, s: 3};
                    return priority[a.type] - priority[b.type];
                }
                return a.cost - b.cost;
            });
            
            const choice = validMoves[0].type;
            camino.push({ i: I, j: J, choice });

            if (choice === 'd') { pasos.push("diagonal"); I--; J--; }
            else if (choice === 'u') { pasos.push("superior"); I--; }
            else { pasos.push("lateral"); J--; }
        }

        caminosED = { camino: camino, pasos: pasos };

        return edges;
    }

    // Devuelve los strings alineados y el puntaje total
    function tracebackED() {
        if (!DP || !BT) return { seq1: "", seq2: "", puntaje: 0 };

        let i = S1.length, j = S2.length;
        let a1 = "", a2 = "";

        console.log('[tracebackED] S1:', S1, 'S2:', S2, 'starting at:', i, j);

        while (i > 0 || j > 0) {
            // En lugar de usar solo los backpointers, vamos a recalcular
            // qué movimiento nos llevó a la celda actual con el costo mínimo
            const currentCost = DP[i][j];
            
            let validMoves = [];
            
            // Verificar movimiento diagonal (sustitución/match)
            if (i > 0 && j > 0) {
                const substitutionCost = (S1[i-1] === S2[j-1]) ? COSTS.match : COSTS.mismatch;
                const expectedCost = DP[i-1][j-1] + substitutionCost;
                if (Math.abs(expectedCost - currentCost) < 0.0001) { // tolerancia para flotantes
                    validMoves.push({type: 'diagonal', cost: DP[i-1][j-1]});
                }
            }
            
            // Verificar movimiento superior (eliminación)
            if (i > 0) {
                const expectedCost = DP[i-1][j] + COSTS.gap;
                if (Math.abs(expectedCost - currentCost) < 0.0001) {
                    validMoves.push({type: 'superior', cost: DP[i-1][j]});
                }
            }
            
            // Verificar movimiento lateral (inserción)
            if (j > 0) {
                const expectedCost = DP[i][j-1] + COSTS.gap;
                if (Math.abs(expectedCost - currentCost) < 0.0001) {
                    validMoves.push({type: 'lateral', cost: DP[i][j-1]});
                }
            }
            
            // Si no hay movimientos válidos, salir del bucle
            if (validMoves.length === 0) {
                console.warn('[tracebackED] No valid moves found at', i, j);
                break;
            }
            
            // Elegir el movimiento que vino de la celda con menor costo
            // En caso de empate, priorizar: diagonal > superior > lateral
            validMoves.sort((a, b) => {
                if (Math.abs(a.cost - b.cost) < 0.0001) {
                    // Empate en costo, usar prioridad
                    const priority = {diagonal: 1, superior: 2, lateral: 3};
                    return priority[a.type] - priority[b.type];
                }
                return a.cost - b.cost; // menor costo primero
            });
            
            const chosenMove = validMoves[0];
            console.log(`[tracebackED] At (${i},${j}) cost=${currentCost}, chosen:`, chosenMove.type, 'from cost:', chosenMove.cost);
            
            // Ejecutar el movimiento elegido
            if (chosenMove.type === 'diagonal') {
                a1 = S1[i - 1] + a1;
                a2 = S2[j - 1] + a2;
                i--; j--;
            } else if (chosenMove.type === 'superior') {
                a1 = S1[i - 1] + a1;
                a2 = "-" + a2;
                i--;
            } else { // lateral
                a1 = "-" + a1;
                a2 = S2[j - 1] + a2;
                j--;
            }
        }

        console.log('[tracebackED] result a1:', a1, 'a2:', a2);
        return { seq1: a1, seq2: a2, puntaje: DP[S1.length][S2.length] };
    }

    // API que usa tu app:

    // 1) Inicialización ED — llamado desde inicializar.js cuando algoritmo === 'ed'
    window.inicializacionED = function (edges, seq1, seq2 /* gapNoUsado */) {
        S1 = (seq1 || "").toUpperCase();
        S2 = (seq2 || "").toUpperCase();

        const { dp, bt } = computeED(S1, S2);
        DP = dp; BT = bt;

        // Construir un arreglo `edges` para retornarlo al UI, pero NO rellenar
        // toda la matriz: solo la celda (0,0) y la primera fila/col deben tener
        // valores iniciales; el resto queda undefined hasta que el usuario vaya
        // presionando "Siguiente" (o use los resolvers que usan DP internamente).
        lastEdges = [];
        const nLocal = S1.length + 1;
        const mLocal = S2.length + 1;

        for (let i = 0; i < nLocal; i++) {
            for (let j = 0; j < mLocal; j++) {
                const cell = {
                    i, j,
                    puntaje: undefined,
                    d: (i > 0 && j > 0) ? DP[i - 1][j - 1] : undefined,
                    s: (i > 0) ? DP[i - 1][j] : undefined,
                    l: (j > 0) ? DP[i][j - 1] : undefined,
                    diagonalF: 0, superiorF: 0, lateralF: 0,
                    diagonal: 0, superior: 0, lateral: 0,
                    max: undefined,
                    match: (i > 0 && j > 0) ? ((S1[i - 1] === S2[j - 1]) ? "coincidencia" : "desajuste") : "",
                };

                // Inicializar solo primera fila/col con los costos acumulados
                if (i === 0 && j === 0) {
                    cell.puntaje = DP[0][0];
                    cell.max = DP[0][0];
                } else if (i === 0) {
                    cell.puntaje = DP[0][j];
                    cell.max = DP[0][j];
                } else if (j === 0) {
                    cell.puntaje = DP[i][0];
                    cell.max = DP[i][0];
                }

                lastEdges.push(cell);
            }
        }

        return lastEdges;
    };

    // 2) Para mostrar el alineamiento ED en cualquier pantalla:
    window.alineamientoED = function () {
        const res = tracebackED();
        // No escapar caracteres aquí, dejar que retroceder.js lo haga si es necesario
        return res;
    };

    // 3) Si en algún sitio quieres el DP crudo:
    window.getEDMatrix = function () { return DP; };

    // 4) Si necesitas el camino (coordenadas y pasos) igual que NW/SW:
    window.getEDPath = function () { return caminosED; };

    // 5) Traceback público: si DP/BT están disponibles, construir el traceback
    // a partir de recálculo directo (mínimos). Esto devuelve { coordenadas, pasos }.
    window.tracebackED = function (matriz) {
        // Si disponemos de BT/DP, usarlo (preferible); si no, intentar interpretar
        // la matriz pasada como argumento (compatibilidad hacia atrás).
        if (DP && S1 && S2) {
            let i = S1.length;
            let j = S2.length;
            const coordenadas = [];
            const pasos = [];

            while (i > 0 || j > 0) {
                const currentCost = DP[i][j];
                let validMoves = [];
                
                // Verificar movimiento diagonal (sustitución/match)
                if (i > 0 && j > 0) {
                    const substitutionCost = (S1[i-1] === S2[j-1]) ? COSTS.match : COSTS.mismatch;
                    const expectedCost = DP[i-1][j-1] + substitutionCost;
                    if (Math.abs(expectedCost - currentCost) < 0.0001) {
                        validMoves.push({type: 'diagonal', cost: DP[i-1][j-1]});
                    }
                }
                
                // Verificar movimiento superior (eliminación)
                if (i > 0) {
                    const expectedCost = DP[i-1][j] + COSTS.gap;
                    if (Math.abs(expectedCost - currentCost) < 0.0001) {
                        validMoves.push({type: 'superior', cost: DP[i-1][j]});
                    }
                }
                
                // Verificar movimiento lateral (inserción)
                if (j > 0) {
                    const expectedCost = DP[i][j-1] + COSTS.gap;
                    if (Math.abs(expectedCost - currentCost) < 0.0001) {
                        validMoves.push({type: 'lateral', cost: DP[i][j-1]});
                    }
                }
                
                if (validMoves.length === 0) break;
                
                // Elegir el movimiento óptimo
                validMoves.sort((a, b) => {
                    if (Math.abs(a.cost - b.cost) < 0.0001) {
                        const priority = {diagonal: 1, superior: 2, lateral: 3};
                        return priority[a.type] - priority[b.type];
                    }
                    return a.cost - b.cost;
                });
                
                const chosenMove = validMoves[0];
                coordenadas.push([i, j]);
                
                if (chosenMove.type === 'diagonal') {
                    pasos.push('diagonal');
                    i--; j--;
                } else if (chosenMove.type === 'superior') {
                    pasos.push('superior');
                    i--;
                } else {
                    pasos.push('lateral');
                    j--;
                }
            }

            // Devuelve en la forma que espera el resto de la app
            return { coordenadas: coordenadas, pasos: pasos };
        }

        // Fallback: si no hay BT/DP, intentar usar la implementación externa
        try {
            return tracebackED(matriz);
        } catch (e) {
            return { coordenadas: [], pasos: [] };
        }
    };

    // 5) Paso a paso: exponer siguienteED para integrarse con el UI.
    // Recibe 'paso' (numero de paso) y usa obtenerCoordenadas + inicializacion2
    // para desplegar exactamente la misma celda/equación que NW/SW.
    window.siguienteED = function (paso) {
        const coords = (typeof obtenerCoordenadas === 'function') ? obtenerCoordenadas(paso) : null;
        if (!coords) return;
        const i = coords[0], j = coords[1];

        // Valores seguros desde DP
        const safe = (ii, jj) => {
            if (!DP) return Infinity;
            if (ii < 0 || jj < 0 || ii > S1.length || jj > S2.length) return Infinity;
            return DP[ii][jj];
        };

        // Calcula los scores candidatos (diag, superior, lateral)
        const dVal = (i > 0 && j > 0) ? safe(i - 1, j - 1) : 0;
        const sVal = (i > 0) ? safe(i - 1, j) : 0;
        const lVal = (j > 0) ? safe(i, j - 1) : 0;

        const costSub = (i > 0 && j > 0 && S1[i - 1] === S2[j - 1]) ? COSTS.match : COSTS.mismatch;
        const diagScore = (i > 0 && j > 0) ? dVal + costSub : Infinity;
        const upScore = (i > 0) ? sVal + COSTS.gap : Infinity;
        const leftScore = (j > 0) ? lVal + COSTS.gap : Infinity;

        const best = Math.min(diagScore, upScore, leftScore);

        const puntajesMaximos = [];
        if (diagScore === best) puntajesMaximos.push('diagonal');
        if (upScore === best) puntajesMaximos.push('superior');
        if (leftScore === best) puntajesMaximos.push('lateral');

        const tooltip = [(dVal === Infinity) ? undefined : dVal, (sVal === Infinity) ? undefined : sVal, (lVal === Infinity) ? undefined : lVal, undefined];
        const match = (i > 0 && j > 0) ? ((S1[i - 1] === S2[j - 1]) ? 'coincidencia' : 'desajuste') : '';

        // Llamamos al helper global para que la UI haga exactamente la misma actualización
        if (typeof inicializacion2 === 'function') {
            console.debug('[siguienteED] paso', paso, 'coords', coords, 'best', best, 'choices', puntajesMaximos);
            inicializacion2(i, j, best, puntajesMaximos, tooltip, match);
        } else {
            // Fallback: si no existe, actualizamos lastEdges para consistencia
            const e = lastEdges.find(x => x.i === i && x.j === j);
            if (e) {
                e.puntaje = best;
                e.diagonal = puntajesMaximos.includes('diagonal') ? 1 : 0;
                e.superior = puntajesMaximos.includes('superior') ? 1 : 0;
                e.lateral = puntajesMaximos.includes('lateral') ? 1 : 0;
                e.d = tooltip[0]; e.s = tooltip[1]; e.l = tooltip[2]; e.max = best; e.match = match;
            }
        }

        // Sincronizar el estado global `edges` con el arreglo parcial hasta este paso,
        // sin activar las flags de flecha (esas se dibujan sólo en el traceback final).
        try {
            if (typeof window.getEDEdgesAtStep === 'function') {
                const parcial = window.getEDEdgesAtStep(paso);
                if (Array.isArray(parcial)) edges = parcial;
            }
        } catch (err) {
            // noop
        }

        // Renderizar la UI para este paso (misma función que usan NW/SW)
        try {
            if (typeof window.siguiente === 'function') {
                // llamar a la función de renderizado con algoritmo 'ed'
                window.siguiente('ed', paso);
            }
        } catch (err) { /* noop */ }

        return edges;
    };

    // 6) Obtener un arreglo `edges` parcial hasta un cierto paso (para step-by-step / undo)
    // Paso es el mismo índice que usa obtenerCoordenadas/obtenerPaso: i*m + j
    window.getEDEdgesAtStep = function (paso) {
        // Asegurar que DP/BT están calculados
        if (!DP || !BT) {
            const res = computeED(S1, S2);
            DP = res.dp; BT = res.bt;
        }

        const n = S1.length + 1;
        const mLocal = S2.length + 1;
        const resEdges = [];

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < mLocal; j++) {
                // calcular índice de paso consistente con obtenerCoordenadas/obtenerPaso:
                // Paso P corresponde a coordenada (i,j) con P = (i-1)*(mLocal-1) + j
                const colsInner = mLocal - 1; // mLocal = S2.length + 1
                const stepIndex = (i === 0 || j === 0) ? 0 : ((i - 1) * colsInner + j);
                const hasValue = (i === 0 || j === 0) || (stepIndex <= paso);

                const cell = {
                    i, j,
                    puntaje: hasValue ? DP[i][j] : undefined,
                    d: (i > 0 && j > 0) ? DP[i - 1][j - 1] : 0,
                    s: (i > 0) ? DP[i - 1][j] : 0,
                    l: (j > 0) ? DP[i][j - 1] : 0,
                    diagonalF: 0, superiorF: 0, lateralF: 0,
                    diagonal: 0, superior: 0, lateral: 0,
                    max: hasValue ? DP[i][j] : undefined,
                    match: (i > 0 && j > 0) ? ((S1[i - 1] === S2[j - 1]) ? "coincidencia" : "desajuste") : ""
                };

                if (hasValue) {
                    const dirs = BT[i][j] || [];
                    // Marcar sólo direcciones (para tooltip/ecuaciones). No activar
                    // diagonalF/superiorF/lateralF aquí para que las flechas no
                    // aparezcan hasta el traceback final.
                    if (dirs.includes('d')) { cell.diagonal = 1; }
                    if (dirs.includes('u')) { cell.superior = 1; }
                    if (dirs.includes('s')) { cell.lateral = 1; }
                }

                resEdges.push(cell);
            }
        }

        return resEdges;
    };
})();
