function avanzar(algoritmo,i,j,flecha) {
    d3.select("#root").remove()
    const seq1 = $('#seq_1').val()
	const seq2 = $('#seq_2').val()
    const gap = parseInt($('#gapScore').val(), 10)
    const matchScore = parseInt($('#matchScore').val(), 10)
    const mismatchScore = parseInt($('#mismatchScore').val(), 10)
    let numNodes = Math.max(seq1.length, seq2.length) + 1;
    let nodesData = Array.from({ length: numNodes }, (_, i) => ({
        id: i,
        node: i === 0 ? 0 : i,
        seq1: i === 0 ? '' : seq1[i - 1] || '',
        seq2: i === 0 ? '' : seq2[i - 1] || '',
    }))
    // Obtener los caracteres correctos de las secuencias basándose en las coordenadas
    let s1 = (i > 0) ? seq1[i - 1] : '';
    let s2 = (j > 0) ? seq2[j - 1] : '';
    let score = (s1 === s2) ? matchScore : mismatchScore

    edges = marcarCamino(i,j,flecha)

    const format = d3.format(",")
    const scaleColor = d3.scaleOrdinal()
        .domain([1, 2])
        .range(["#FFCCCC", "#CCE6CC"])

    const size = 300 
    const sizeCell = size / nodes.length 
    const rectPadding = 0.1 * sizeCell 
    const rectCell = sizeCell - rectPadding * 2 

    const margin = {
        top: 50,
        bottom: 70,
        left: 70,
        right: 20
    }

    const scaleNodes = d3
        .scaleBand()
        .domain(nodes.map((d) => d.node))
        .range([0, size])

    nodes.forEach((d) => {
        const o = scaleNodes(d.node);
        d.x = o;
        d.y = o;
        d.size = scaleNodes.bandwidth();
    })

    edges.forEach((d) => {
        const { node: i, x, size } = nodes.find(({ node }) => node === d.i);
        const { node: j, y } = nodes.find(({ node }) => node === d.j);
        d.i = i
        d.j = j
        d.nodeSize = size
        d.x = y
        d.y = x
    })

    const root = d3.select("body").append("div").attr("id", "root")
    if (algoritmo === "nw") {
        root.append("h1").text("Alineamiento Global: Needleman-Wunsch");
    } else if (algoritmo === "sw") {
        root.append("h1").text("Alineamiento Local: Smith-Waterman");
    }
    root.append("p").html("Trazado hacia atrás paso " + paso)

    const svg = root
        .append("svg")
        .style("max-width", "rem")
        .attr(
            "viewBox",
            `0 0 ${size + margin.left + margin.right} ${size + margin.top + margin.bottom
            }`
        )

    const defs = svg.append("defs")

    const pattern = defs
        .append("pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", sizeCell)
        .attr("height", sizeCell)
        .attr("id", "matrix-grid")
        .attr("viewBox", "0 0 100 100")

    pattern
        .append("rect")
        .attr("width", "100")
        .attr("height", "100")
        .attr("fill", "none")
        .attr("stroke", "hsl(205, 89%, 15%)"); //cuadriculas

    const marker = defs
        .append("marker")
        .attr("id", "marker")
        .attr("viewBox", "-0.5 -2 3 4")
        .attr("markerWidth", "5")
        .attr("markerHeight", "5")
        .attr("orient", "auto")

    marker
        .append("path")
        .attr("d", "M 0 -1.5 2 0 0 1.5z")
        .attr("fill", "hsl(0, 0%, 0%)")// nose
        .attr("stroke", "hsl(0, 0%, 0%)")//nose
        .attr("stroke-width", "1")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")

    const group = svg
        .append("g")
        .attr("transform", `translate(${margin.left} ${margin.top})`)

    const groupNodes = group
        .append("g")
        .attr("font-size", "12")
        .attr("fill", "currentColor")
        .attr("font-weight", "700")

    const groupEdges = group.append("g")
    const groupFrame = group.append("g").style("pointer-events", "none")

    const groupHighlight = group
        .append("g")
        .style("pointer-events", "none")
        .attr("opacity", "0")

    const containerWidth = size / numNodes // Calcula el tamaño de fuente proporcional al tamaño del contenedor
    const fontSizeRatio = 0.50 // Ajusta este valor según tus necesidades
    const fontSize = (size / numNodes) * 0.50 // Calcula el tamaño de fuente proporcional

    groupNodes
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "end")
        .attr("transform", (d) => `translate(-10 ${d.y + d.size / 2})`)
        .style("font-size", () => `${fontSize}px`)
        .text((d) => d.seq1); //SECUENCIA 1

    groupNodes
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x + d.size / 2} ${-(10)})`)
        .style("font-size", () => `${fontSize}px`)
        .text((d) => d.seq2); //SECUENCIA 2

    const groupsEdges = groupEdges
        .selectAll("g")
        .data(edges)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x} ${d.y})`)

    groupsEdges //COLOR DE CELDA
        .filter((d) => d.camino)
        .append("rect")
        .attr("x", rectPadding)
        .attr("y", rectPadding)
        .attr("width", rectCell)
        .attr("height", rectCell)
        .attr("fill", (d) => scaleColor(d.camino))
        .attr("rx", "10")

    groupsEdges //PUNTAJE DE CELDA
        .filter((d) => d.puntaje !== undefined && d.puntaje !== "")
        .append("text")
        .style("font-size", () => `${fontSize}px`)
        .attr("x", rectPadding + rectCell / 2) // centro en X
        .attr("y", rectPadding + rectCell / 2) // centro en Y
        .attr("text-anchor", "middle") // centrar horizontalmente
        .attr("dominant-baseline", "middle") // centrar verticalmente
        .text((d) => d.puntaje)
    
        groupsEdges //DIAGONAL
        .filter((d) => d.diagonalF !== undefined && d.diagonalF !== "" && d.diagonalF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${(rectCell / 2) * -1} ${(rectCell / 2) * -1}`)
        .style("stroke", "black") // color de la línea
        .style("fill", "none") // sin relleno
        .style("stroke-width", 1) // ancho de la línea
        .attr("marker-end", "url(#marker)")  // Asigna el marcador al final de la línea-

    groupsEdges //SUPERIOR
        .filter((d) => d.superiorF !== undefined && d.superiorF !== "" && d.superiorF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${0} ${(rectCell / 2) * -1}`)
        .style("stroke", "black") // color de la línea
        .style("fill", "none") // sin relleno
        .style("stroke-width", 1) // ancho de la línea
        .attr("marker-end", "url(#marker)") // Asigna el marcador al final de la línea

    groupsEdges //LATERAL
        .filter((d) => d.lateralF !== undefined && d.lateralF !== "" && d.lateralF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${(rectCell / 2) * -1} ${0}`)
        .style("stroke", "black") // color de la línea
        .style("fill", "none") // sin relleno
        .style("stroke-width", 1) // ancho de la línea
        .attr("marker-end", "url(#marker)")  // Asigna el marcador al final de la línea

    groupsEdges
        .append("rect")
        .attr("width", sizeCell)
        .attr("height", sizeCell)
        .attr("fill", "transparent")
        .attr("opacity", "0")

    groupHighlight
        .append("rect")
        .attr("width", sizeCell)
        .attr("height", sizeCell)
        .attr("fill", "hsl(205, 65%, 55%)")
        .attr("stroke", "none")
        .attr("fill-opacity", "0.1")

    groupHighlight
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "hsl(245, 99%, 68%)") //linea
        .attr("stroke-width", "2")

    groupHighlight
        .append("text")
        .attr("x", size)
        .attr("y", size + 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging")
        .attr("font-size", "12")

    groupFrame //Marco de la matriz responsive
        .append("rect")
        .attr("width", (size / numNodes * m))
        .attr("height", (size / numNodes) * n)
        .attr("fill", "url(#matrix-grid)")
        .attr("stroke", "hsl(205, 89%, 15%)")
        .attr("stroke-width", "2")
        .attr("rx", "10")

    groupsEdges
        .on("mouseenter", function (e, d) {
            const value = format(d.puntaje)
            const { i, j, x, y, nodeSize: size } = d
            const diagonal = d.d
            const superior = d.s
            const lateral = d.l
            const zero = d.z
            const max = d.max
            const match = d.match
            const h = x + size / 2
            const v = y + size / 2
            const a = size / 2
            const cord = {
                h,
                v,
                a
            }

            // Obtener los caracteres correctos de las secuencias para el hover
            const hoverS1 = (i > 0) ? seq1[i - 1] : '';
            const hoverS2 = (j > 0) ? seq2[j - 1] : '';
            const hoverScore = (hoverS1 === hoverS2) ? matchScore : mismatchScore;

            groupHighlight
                .select("path")
                .transition()
                .attr(
                    "d",
                    `M 0 ${v} h ${h - a} a ${a} ${a} 0 0 0 ${a} ${-a} v ${-(v - a)}`
                )

            groupHighlight.select("rect").attr("transform", `translate(${x} ${y})`)

            if (i == 0 || j == 0) {
                const headerText = `<tspan x="-65" dy="1.2em">Puntaje inicicialización <tspan font-weight="700">${value}</tspan>.</tspan>`;
                groupHighlight
                    .select("text")
                    .html(headerText);
                
                const existingMatrix = document.querySelector('.calculation-matrix-container');
                if (existingMatrix) {
                    existingMatrix.style.display = 'none';
                }
            }
            else if (!isNaN(parseInt(value.replace('−', '-'), 10))) {
                const diagonalText = `<tspan x="-65" dy="0em">Puntaje celda diagonal <tspan font-weight="700">${diagonal}</tspan> + <tspan font-weight="700">${hoverScore}</tspan> (Debido a ${match} entre <tspan font-weight="700">${hoverS1}</tspan> y <tspan font-weight="700">${hoverS2}</tspan>).</tspan>`;
                const superiorText = `<tspan x="-65" dy="1.2em">Puntaje celda superior <tspan font-weight="700">${superior}</tspan> + <tspan font-weight="700">${gap}</tspan> (Puntaje Gap).</tspan>`;
                const lateralText = `<tspan x="-65" dy="1.2em">Puntaje celda lateral <tspan font-weight="700">${lateral}</tspan> + <tspan font-weight="700">${gap}</tspan> (Puntaje Gap).</tspan>`;
                const winerText = `<tspan x="-65" dy="1.2em">Puntaje máximo <tspan font-weight="700">${max}</tspan>`;

                groupHighlight
                    .select("text")
                    .html(diagonalText + superiorText + lateralText + winerText);
                
                updateCalculationMatrix({
                    diagonal: diagonal,
                    superior: superior,
                    lateral: lateral,
                    diagonalScore: hoverScore,
                    gapScore: gap,
                    diagonalResult: diagonal + hoverScore,
                    superiorResult: superior + gap,
                    lateralResult: lateral + gap,
                    maxResult: max,
                    char1: hoverS1 || '?',
                    char2: hoverS2 || '?',
                    isMatch: hoverS1 === hoverS2,
                    algoritmo: algoritmo
                });
            }
            else {
                groupHighlight
                    .select("text")
                    .html(``)
                
                const existingMatrix = document.querySelector('.calculation-matrix-container');
                if (existingMatrix) {
                    existingMatrix.style.display = 'none';
                }
            }
            groupHighlight.attr("opacity", "1")
        })
        .on("mouseleave", () => { 
            groupHighlight.attr("opacity", "0")
            const existingMatrix = document.querySelector('.calculation-matrix-container');
            if (existingMatrix) {
                existingMatrix.style.display = 'block';
            }
        })

    groupEdges
        .select(`g:nth-of-type(${Math.floor(obtenerPaso(i, j, m) + 1)})`)
        .dispatch("mouseenter")
        let alineamientos = (algoritmo === "nw") ? alineamientoNW() : alineamientoSW();

        let alineamientoSeq1 = alineamientos.seq1;
        let alineamientoSeq2 = alineamientos.seq2;
        let puntajeAlineamiento = alineamientos.puntaje;

        alineamientoSeq1 = alineamientoSeq1.replace(/_/g, '\\_');
        alineamientoSeq2 = alineamientoSeq2.replace(/_/g, '\\_');

        let equation = `\\begin{align*}
        \\text{Secuencia 1:} &\\quad ${alineamientoSeq1}\\\\
        \\text{Secuencia 2:} &\\quad ${alineamientoSeq2}\\\\
        \\text{Puntaje:} &\\quad ${puntajeAlineamiento}
        \\end{align*}`;

        const rootElement = d3.select("#root");
        const infoContainer = rootElement.append("div").attr("class", "info-column")
        
        infoContainer.append("p").html(`\\(${equation}\\)`);
        MathJax.typesetPromise();

    const d = edges.find(e => e.i === i && e.j === j);
    if (d) {
        const matrizHTML = crearMatrizCalculo({
            diagonal: d.d !== undefined ? d.d : 0,
            superior: d.s !== undefined ? d.s : 0,
            lateral: d.l !== undefined ? d.l : 0,
            diagonalScore: score,
            gapScore: gap,
            diagonalResult: (d.d !== undefined ? d.d : 0) + score,
            superiorResult: (d.s !== undefined ? d.s : 0) + gap,
            lateralResult: (d.l !== undefined ? d.l : 0) + gap,
            maxResult: d.max !== undefined ? d.max : d.puntaje,
            char1: s1 || '?',
            char2: s2 || '?',
            isMatch: s1 === s2,
            algoritmo: algoritmo
        });

        const matrixWrapper = document.createElement('div');
        matrixWrapper.style.display = 'flex';
        matrixWrapper.style.flexDirection = 'column';
        matrixWrapper.style.alignItems = 'center';
        matrixWrapper.style.marginTop = '20px';
        
        const title = document.createElement('h3');
        title.textContent = 'Calculo paso a paso';
        title.style.margin = '0 0 15px 0';
        title.style.color = 'hsl(205, 89%, 15%)';
        title.style.fontSize = '1.2rem';
        title.style.fontWeight = '600';
        
        matrixWrapper.appendChild(title);
        matrixWrapper.appendChild(matrizHTML);

        infoContainer.node().appendChild(matrixWrapper);
    }
        
        MathJax.typesetPromise();

}

function obtenerCoordenadas(paso) {
    const x = n - 1
    const y = m - 1
    if (paso < 1 || paso > x * y) {
        return null
    }

    const fila = Math.ceil(paso / y)
    const columna = paso % y === 0 ? y : paso % y

    return [fila, columna]
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

function marcarCamino(x, y, flecha) {
    const edge = edges.find(e => e.i === x && e.j === y)
    if (edge) {
        if (flecha === 'diagonal') edge.diagonalF = 1
        if (flecha === 'superior') edge.superiorF = 1
        if (flecha === 'lateral') edge.lateralF = 1
        edge.camino = 2
    }
    return edges
}

function alineamientoSW() {
    const seq1 = $('#seq_1').val()
	const seq2 = $('#seq_2').val()
    let camino = caminos[0]
    let coordenadas = camino.coordenadas;
    let pasos = camino.pasos;

    let alineamientoSeq1 = ""
    let alineamientoSeq2 = ""
    let puntaje = 0; // Para calcular el puntaje del alineamiento

    for (let i = 0; i < pasos.length; i++) {
        let paso = pasos[i];
        let coordenada = coordenadas[i];

        switch(paso) {
            case "diagonal":
                alineamientoSeq1 += seq1[coordenada[0] - 1]
                alineamientoSeq2 += seq2[coordenada[1] - 1]

                // Ajusta el puntaje para coincidencia o desajuste
                if (seq1[coordenada[0] - 1] == seq2[coordenada[1] - 1]) {
                    puntaje += parseInt($('#matchScore').val(), 10)
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10)
                }
                break;

            case "superior":
                alineamientoSeq1 += "-";
                alineamientoSeq2 += seq2[coordenada[1] - 1]
                puntaje += parseInt($('#gapScore').val(), 10)
                break;

            case "lateral":
                alineamientoSeq1 += seq1[coordenada[0] - 1]
                alineamientoSeq2 += "-"
                puntaje += parseInt($('#gapScore').val(), 10)
                break;
        }
    }
    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('')
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('')

    return {
        seq1: alineamientoSeq1,
        seq2: alineamientoSeq2,
        puntaje: puntaje
    };
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

        switch(pasoActual) {
            case "diagonal":
                alineamientoSeq1 += seq1[nodoActual.i - 1];
                alineamientoSeq2 += seq2[nodoActual.j - 1];

                if(nodoActual.match === "coincidencia") {
                    puntaje += parseInt($('#matchScore').val(), 10) 
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10)
                }
                break;
                
            case "lateral":
                alineamientoSeq1 += "-";
                alineamientoSeq2 += seq2[nodoActual.j - 1];
                puntaje += parseInt($('#gapScore').val(), 10)
                break;

            case "superior":
                alineamientoSeq1 += seq1[nodoActual.i - 1];
                alineamientoSeq2 += "-";
                puntaje += parseInt($('#gapScore').val(), 10)
                break;
        }
    }

    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('');
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('');

    return {
        seq1: alineamientoSeq2,
        seq2: alineamientoSeq1,
        puntaje: puntaje
    };
}

