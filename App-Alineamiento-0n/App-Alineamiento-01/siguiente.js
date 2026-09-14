function siguiente(algoritmo, p) {
    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();
    const gap = parseInt($('#gapScore').val(), 10);
    const matchScore = parseInt($('#matchScore').val(), 10);
    const mismatchScore = parseInt($('#mismatchScore').val(), 10);

    let coordenadas = obtenerCoordenadas(paso);
    let s1 = obtenerSecuencia(nodes, coordenadas[0], "seq1");
    let s2 = obtenerSecuencia(nodes, coordenadas[1], "seq2");
    let score = (s1 === s2) ? matchScore : mismatchScore;

    let tooltip = [obtenerPuntaje(coordenadas[0] - 1, coordenadas[1] - 1), obtenerPuntaje(coordenadas[0] - 1, coordenadas[1]), obtenerPuntaje(coordenadas[0], coordenadas[1] - 1)];

    let diagonal = obtenerPuntaje(coordenadas[0] - 1, coordenadas[1] - 1) + score;
    let superior = obtenerPuntaje(coordenadas[0] - 1, coordenadas[1]) + gap;
    let lateral = obtenerPuntaje(coordenadas[0], coordenadas[1] - 1) + gap;
    let zero = 0;

    let puntajes = (algoritmo === "nw") ? [diagonal, superior, lateral] : [diagonal, superior, lateral, zero];
    let maximoPuntaje = Math.max(...puntajes);

    let puntajesMaximos = [];
    if (diagonal === maximoPuntaje) puntajesMaximos.push('diagonal');
    if (superior === maximoPuntaje) puntajesMaximos.push('superior');
    if (lateral === maximoPuntaje) puntajesMaximos.push('lateral');
    if (algoritmo === "sw" && maximoPuntaje === 0) puntajesMaximos.push('zero');

    edges = inicializacion2(coordenadas[0], coordenadas[1], maximoPuntaje, puntajesMaximos, tooltip, (s1 === s2) ? "coincidencia" : "discrepancia");

    // Se llama a la función de renderizado con la configuración actualizada.
    const config = {
        algoritmo: algoritmo,
        titulo: algoritmo === "nw" ? "Alineamiento Global: Needleman-Wunsch" : "Alineamiento Local: Smith-Waterman",
        subtitulo: "Llenado de matriz paso " + p,
        edges: edges,
        nodes: nodes,
        seq1: seq1,
        seq2: seq2,
        gap: gap,
        matchScore: matchScore,
        mismatchScore: mismatchScore,
        paso: paso,
        highlightCoords: { i: coordenadas[0], j: coordenadas[1] },
        equation: createEquation(puntajesMaximos, algoritmo)
    };

    renderizarMatriz(config);
}

function inicializacion2(x, y, max, puntajes, tooltip, match) {
    const edge = edges.find(e => e.i === x && e.j === y)
    if (edge) {
        edge.puntaje = max
        if (puntajes.includes('diagonal')) edge.diagonal = 1
        if (puntajes.includes('superior')) edge.superior = 1
        if (puntajes.includes('lateral')) edge.lateral = 1
        if (puntajes.includes('zero')) edge.zero = 1
        edge.d = tooltip[0]
        edge.s = tooltip[1]
        edge.l = tooltip[2]
        edge.z = tooltip[3]
        edge.max = max
        edge.match = match
    }
    return edges
}

function obtenerCoordenadas(paso) {
    const x = n - 1
    const y = m - 1
    if (paso < 1 || paso > x * y) {
        return null; 
    }
    const fila = Math.ceil(paso / y); 
    const columna = paso % y === 0 ? y : paso % y; 
    return [fila, columna]; 
}

function obtenerPuntaje(i, j) {
    const diagonal = edges.find(cell => cell.i === i && cell.j === j);
    if (diagonal) {
        return diagonal.puntaje;
    } else {
        return null;
    }
}

function obtenerSecuencia(data, i, secuencia) {
    for (let elemento of data) {
        if (elemento.node === i) {
            return elemento[secuencia];
        }
    }
    return null;
}

function obtenerPaso(i, j, m) {
    return i * m + j;
}

function createEquation(highlights = [], algorithm = 'sw') {
    let diagonal = "M_{i-1,j-1} + S(a_i,b_j)";
    let superior = "M_{i,j-1} + S(a_i,-)";
    let lateral = "M_{i-1,j} + S(-,b_j)";
    let zero = "0";

    if (highlights.includes('diagonal')) {
        diagonal = "\\bbox[2px,border:2px solid #9999FF]{" + diagonal + "}";
    }
    if (highlights.includes('superior')) {
        superior = "\\bbox[2px,border:2px solid #9999FF]{" + superior + "}";
    }
    if (highlights.includes('lateral')) {
        lateral = "\\bbox[2px,border:2px solid #9999FF]{" + lateral + "}";
    }
    if (highlights.includes('zero')) {
        zero = "\\bbox[2px,border:2px solid #9999FF]{" + zero + "}";
    }

    if (algorithm === 'nw') {
        return ` M_{ij} = \\max \\left\\{ \\begin{array}{l} ${diagonal} \\\\ ${superior} \\\\ ${lateral} \\end{array} \\right. `;
    } else {
        return ` M_{ij} = \\max \\left\\{ \\begin{array}{l} ${diagonal} \\\\ ${superior} \\\\ ${lateral} \\\\ ${zero} \\end{array} \\right. `;
    }
}