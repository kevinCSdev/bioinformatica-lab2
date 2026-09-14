function anterior(algoritmo, p) {
    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();
    const gap = parseInt($('#gapScore').val(), 10);
    const matchScore = parseInt($('#matchScore').val(), 10);
    const mismatchScore = parseInt($('#mismatchScore').val(), 10);

    let coordenadas = obtenerCoordenadas(paso - 1);
    let coordenadas2 = obtenerCoordenadas(paso - 2);

    let s1 = obtenerSecuencia(nodes, coordenadas[0], "seq1");
    let s2 = obtenerSecuencia(nodes, coordenadas[1], "seq2");
    
    edges = eliminarPuntaje(seq1, seq2, coordenadas[0], coordenadas[1]);

    const config = {
        algoritmo: algoritmo,
        titulo: algoritmo === "nw" ? "Alineamiento Global: Needleman-Wunsch" : "Alineamiento Local: Smith-Waterman",
        subtitulo: "LLenado de matriz paso: " + p,
        edges: edges,
        nodes: nodes,
        seq1: seq1,
        seq2: seq2,
        gap: gap,
        matchScore: matchScore,
        mismatchScore: mismatchScore,
        paso: paso,
        highlightCoords: { i: coordenadas2[0], j: coordenadas2[1] }
    };
    
    renderizarMatriz(config);
}

function obtenerCoordenadas(paso) {
    const x = n - 1;
    const y = m - 1;
    if (paso < 1 || paso > x * y) {
        return null;
    }
    const fila = Math.ceil(paso / y);
    const columna = paso % y === 0 ? y : paso % y;
    return [fila, columna];
}

function obtenerPuntaje(i, j) {
    const cell = edges.find(c => c.i === i && c.j === j);
    return cell ? cell.puntaje : null;
}

function obtenerSecuencia(data, i, secuencia) {
    const elemento = data.find(el => el.node === i);
    return elemento ? elemento[secuencia] : null;
}

function obtenerPaso(i, j, m) {
    return i * m + j;
}

function eliminarPuntaje(seq1, seq2, x, y) {
    const edge = edges.find(e => e.i === x && e.j === y);
    if (edge) {
        edge.puntaje = null;
        edge.diagonal = 0;
        edge.superior = 0;
        edge.lateral = 0;
    }
    return edges;
}