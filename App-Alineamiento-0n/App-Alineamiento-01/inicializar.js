function inicializar(algoritmo) {
    d3.select("#root").remove();
    edges = [];
    nodes = [];
    paso = 0;
    limite = 0;
    caminos = [];
    posicionActualCamino = 0;
    final = 0;

    const seq1 = $('#seq_1').val();
    const seq2 = $('#seq_2').val();
    const gap = $('#gapScore').val();

    let numNodes = Math.max(seq1.length, seq2.length) + 1;
    nodes = Array.from({ length: numNodes }, (_, i) => ({
        node: i === 0 ? 0 : i,
        seq1: i === 0 ? '' : seq1[i - 1] || '',
        seq2: i === 0 ? '' : seq2[i - 1] || '',
    }));

    n = seq1.length + 1;
    m = seq2.length + 1;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            edges.push({ i: i, j: j });
        }
    }

    if (algoritmo == "nw") {
        edges = inicializacionNW(edges, seq1, seq2, gap);
    } else if (algoritmo == "sw") {
        edges = inicializacionSW(edges, seq1, seq2, gap);
    }
    paso++;

    const config = {
        algoritmo: algoritmo,
        titulo: algoritmo === "nw" ? "Alineamiento Global: Needleman-Wunsch" : "Alineamiento Local: Smith-Waterman",
        subtitulo: "Inicialización",
        edges: edges,
        nodes: nodes,
        seq1: seq1,
        seq2: seq2,
        highlightCoords: { i: 0, j: 0 } // Resaltar la primera celda
    };

    renderizarMatriz(config);
}