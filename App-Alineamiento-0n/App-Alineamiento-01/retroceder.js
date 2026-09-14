function retroceder(algoritmo, i, j, p) {
    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();

    edges = borrarCamino(i, j);

    let alineamientos = (algoritmo === "nw") ? alineamientoNW() : alineamientoSW();
    let alineamientoSeq1 = alineamientos.seq1.replace(/_/g, '\\_');
    let alineamientoSeq2 = alineamientos.seq2.replace(/_/g, '\\_');
    let puntajeAlineamiento = alineamientos.puntaje;

    // Se prepara la ecuación para MathJax.
    let equation = `\\begin{align*}
        \\text{Secuencia 1:} &\\quad ${alineamientoSeq1}\\\\
        \\text{Secuencia 2:} &\\quad ${alineamientoSeq2}\\\\
        \\text{Puntaje:} &\\quad ${puntajeAlineamiento}
    \\end{align*}`;

    const config = {
        algoritmo: algoritmo,
        titulo: algoritmo === "nw" ? "Alineamiento Global: Needleman-Wunsch" : "Alineamiento Local: Smith-Waterman",
        subtitulo: "Trazado hacia atrás paso " + p,
        edges: edges,
        nodes: nodes,
        seq1: seq1,
        seq2: seq2,
        paso: paso,
        caminos: caminos,
        highlightCoords: { i: i, j: j },
        equation: equation
    };

    renderizarMatriz(config);
}

function borrarCamino(x, y) {
    const edge = edges.find(e => e.i === x && e.j === y);
    if (edge) {
        edge.camino = 0;
        edge.diagonalF = 0;
        edge.superiorF = 0;
        edge.lateralF = 0;
    }
    return edges;
}

function alineamientoSW() {
    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();
    let camino = caminos[0];
    let coordenadas = camino.coordenadas;
    let pasos = camino.pasos;
    let alineamientoSeq1 = "";
    let alineamientoSeq2 = "";
    let puntaje = 0;

    for (let i = 0; i < pasos.length; i++) {
        let paso = pasos[i];
        let coordenada = coordenadas[i];
        switch (paso) {
            case "diagonal":
                alineamientoSeq1 += seq1[coordenada[0] - 1];
                alineamientoSeq2 += seq2[coordenada[1] - 1];
                if (seq1[coordenada[0] - 1] == seq2[coordenada[1] - 1]) {
                    puntaje += parseInt($('#matchScore').val(), 10);
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10);
                }
                break;
            case "superior":
                alineamientoSeq1 += "-";
                alineamientoSeq2 += seq2[coordenada[1] - 1];
                puntaje += parseInt($('#gapScore').val(), 10);
                break;
            case "lateral":
                alineamientoSeq1 += seq1[coordenada[0] - 1];
                alineamientoSeq2 += "-";
                puntaje += parseInt($('#gapScore').val(), 10);
                break;
        }
    }
    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('');
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('');
    return { seq1: alineamientoSeq1, seq2: alineamientoSeq2, puntaje: puntaje };
}

function alineamientoNW() {
    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();
    let camino = caminos.camino;
    let pasos = caminos.pasos;
    let alineamientoSeq1 = "";
    let alineamientoSeq2 = "";
    let puntaje = 0;

    for (let i = 0; i < pasos.length; i++) {
        let pasoActual = pasos[i];
        let nodoActual = camino[i];
        switch (pasoActual) {
            case "diagonal":
                alineamientoSeq1 += seq1[nodoActual.i - 1];
                alineamientoSeq2 += seq2[nodoActual.j - 1];
                if (nodoActual.match === "coincidencia") {
                    puntaje += parseInt($('#matchScore').val(), 10);
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10);
                }
                break;
            case "lateral":
                alineamientoSeq1 += "-";
                alineamientoSeq2 += seq2[nodoActual.j - 1];
                puntaje += parseInt($('#gapScore').val(), 10);
                break;
            case "superior":
                alineamientoSeq1 += seq1[nodoActual.i - 1];
                alineamientoSeq2 += "-";
                puntaje += parseInt($('#gapScore').val(), 10);
                break;
        }
    }
    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('');
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('');
    return { seq1: alineamientoSeq2, seq2: alineamientoSeq1, puntaje: puntaje };
}