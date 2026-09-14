// Función para calcular y mostrar el resultado final sin pasos intermedios
function calcularFinal() {
    d3.select("#root").remove()
    
    const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
    const gap = parseInt($('#gapScore').val(), 10)
    const matchScore = parseInt($('#matchScore').val(), 10)
    const mismatchScore = parseInt($('#mismatchScore').val(), 10)

    // Validar entradas
    if (!seq1 || !seq2) {
        alert("Por favor ingrese ambas secuencias")
        return
    }

    let numNodes = Math.max(seq1.length, seq2.length) + 1
    let nodesData = Array.from({ length: numNodes }, (_, i) => ({
        id: i,
        node: i === 0 ? 0 : i,
        seq1: i === 0 ? '' : seq1[i - 1] || '',
        seq2: i === 0 ? '' : seq2[i - 1] || '',
    }))

    // Reinicializar variables globales
    nodes = nodesData
    edges = []

    const n = seq1.length + 1
    const m = seq2.length + 1

    // Crear la matriz completa
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            edges.push({
                i: i,
                j: j,
                puntaje: undefined,
                camino: 0,
                diagonalF: 0,
                superiorF: 0,
                lateralF: 0
            })
        }
    }

    // Inicializar según el algoritmo
    if (algoritmo === "nw") {
        edges = inicializacionNW(edges, seq1, seq2, gap)
    } else if (algoritmo === "sw") {
        edges = inicializacionSW(edges, seq1, seq2, gap)
    }

    // Llenar toda la matriz
    for (let i = 1; i < n; i++) {
        for (let j = 1; j < m; j++) {
            let s1 = seq1[i - 1]
            let s2 = seq2[j - 1]
            let score = (s1 === s2) ? matchScore : mismatchScore

            let diagonal = obtenerPuntaje(i - 1, j - 1) + score
            let superior = obtenerPuntaje(i - 1, j) + gap
            let lateral = obtenerPuntaje(i, j - 1) + gap

            let puntajes = []
            if (algoritmo === "nw") {
                puntajes = [diagonal, superior, lateral]
            } else if (algoritmo === "sw") {
                puntajes = [diagonal, superior, lateral, 0]
            }

            let maximoPuntaje = Math.max(...puntajes)

            // Marcar direcciones
            const edge = edges.find(e => e.i === i && e.j === j)
            if (edge) {
                edge.puntaje = maximoPuntaje
                if (diagonal === maximoPuntaje) edge.diagonal = true
                if (superior === maximoPuntaje) edge.superior = true
                if (lateral === maximoPuntaje) edge.lateral = true
            }
        }
    }

    // Calcular el traceback
    let caminos
    if (algoritmo === "sw") {
        caminos = tracebackSW(edges)
    } else if (algoritmo === "nw") {
        caminos = tracebackNW(edges)
    }

    // Marcar el camino óptimo en la matriz
    if (algoritmo === "nw") {
        for (let i = 0; i < caminos.coordenadas.length; i++) {
            let coord = caminos.coordenadas[i]
            let paso = caminos.pasos[i]
            edges = marcarCamino(coord[0], coord[1], paso)
        }
    } else if (algoritmo === "sw" && caminos.length > 0) {
        for (let i = 0; i < caminos[0].coordenadas.length; i++) {
            let coord = caminos[0].coordenadas[i]
            let paso = caminos[0].pasos[i]
            edges = marcarCamino(coord[0], coord[1], paso)
        }
    }

    // Renderizar la matriz con el resultado final
    renderMatrizFinal(algoritmo, caminos)
}

function renderMatrizFinal(algoritmo, caminos) {
    const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
    const gap = parseInt($('#gapScore').val(), 10)
    const matchScore = parseInt($('#matchScore').val(), 10)
    const mismatchScore = parseInt($('#mismatchScore').val(), 10)

    let numNodes = Math.max(seq1.length, seq2.length) + 1

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
        const o = scaleNodes(d.node)
        d.x = o
        d.y = o
        d.size = scaleNodes.bandwidth()
    })

    edges.forEach((d) => {
        const { node: i, x, size } = nodes.find(({ node }) => node === d.i)
        const { node: j, y } = nodes.find(({ node }) => node === d.j)
        d.i = i
        d.j = j
        d.nodeSize = size
        d.x = y
        d.y = x
    })

    const root = d3.select("body").append("div").attr("id", "root")
    
    if (algoritmo === "nw") {
        root.append("h1").text("Alineamiento Global: Needleman-Wunsch - RESULTADO FINAL")
    } else if (algoritmo === "sw") {
        root.append("h1").text("Alineamiento Local: Smith-Waterman - RESULTADO FINAL")
    }

    const svg = root
        .append("svg")
        .style("max-width", "rem")
        .attr(
            "viewBox",
            `0 0 ${size + margin.left + margin.right} ${size + margin.top + margin.bottom}`
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
        .attr("stroke", "hsl(205, 89%, 15%)")

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
        .attr("fill", "hsl(205, 89%, 15%)")
        .attr("stroke", "hsl(205, 89%, 15%)")
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

    const fontSize = (size / numNodes) * 0.50

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
        .text((d) => d.seq1)

    groupNodes
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x + d.size / 2} ${-(10)})`)
        .style("font-size", () => `${fontSize}px`)
        .text((d) => d.seq2)

    const groupsEdges = groupEdges
        .selectAll("g")
        .data(edges)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x} ${d.y})`)

    // Colorear celdas del camino
    groupsEdges
        .filter((d) => d.camino)
        .append("rect")
        .attr("x", rectPadding)
        .attr("y", rectPadding)
        .attr("width", rectCell)
        .attr("height", rectCell)
        .attr("fill", (d) => scaleColor(d.camino))
        .attr("rx", "10")

    // Mostrar puntajes
    groupsEdges
        .filter((d) => d.puntaje !== undefined && d.puntaje !== "")
        .append("text")
        .style("font-size", () => `${fontSize}px`)
        .attr("x", rectPadding + rectCell / 2)
        .attr("y", rectPadding + rectCell / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text((d) => d.puntaje)

    // Dibujar flechas del camino
    groupsEdges
        .filter((d) => d.diagonalF !== undefined && d.diagonalF !== "" && d.diagonalF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${(rectCell / 2) * -1} ${(rectCell / 2) * -1}`)
        .style("stroke", "hsl(205, 89%, 15%)")
        .style("fill", "none")
        .style("stroke-width", 2)
        .attr("marker-end", "url(#marker)")

    groupsEdges
        .filter((d) => d.superiorF !== undefined && d.superiorF !== "" && d.superiorF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${0} ${(rectCell / 2) * -1}`)
        .style("stroke", "hsl(205, 89%, 15%)")
        .style("fill", "none")
        .style("stroke-width", 2)
        .attr("marker-end", "url(#marker)")

    groupsEdges
        .filter((d) => d.lateralF !== undefined && d.lateralF !== "" && d.lateralF !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${(rectCell / 2) * -1} ${0}`)
        .style("stroke", "hsl(205, 89%, 15%)")
        .style("fill", "none")
        .style("stroke-width", 2)
        .attr("marker-end", "url(#marker)")

    groupFrame
        .append("rect")
        .attr("width", (size / numNodes * m))
        .attr("height", (size / numNodes) * n)
        .attr("fill", "url(#matrix-grid)")
        .attr("stroke", "hsl(205, 89%, 15%)")
        .attr("stroke-width", "2")
        .attr("rx", "10")

    // Mostrar alineamiento final
    let alineamientos
    if (algoritmo === "nw") {
        alineamientos = alineamientoNWFinal(caminos)
    } else if (algoritmo === "sw") {
        alineamientos = alineamientoSWFinal(caminos)
    }

    let alineamientoSeq1 = alineamientos.seq1.replace(/_/g, '\\_')
    let alineamientoSeq2 = alineamientos.seq2.replace(/_/g, '\\_')
    let puntajeAlineamiento = alineamientos.puntaje

    let equation = `\\begin{align*}
    \\text{Secuencia 1:} &\\quad ${alineamientoSeq1}\\\\
    \\text{Secuencia 2:} &\\quad ${alineamientoSeq2}\\\\
    \\text{Puntaje:} &\\quad ${puntajeAlineamiento}
    \\end{align*}`

    root.append("p").html(`\\(${equation}\\)`)
    MathJax.typesetPromise()
}

function alineamientoNWFinal(caminos) {
    const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
    let camino = caminos.camino
    let pasos = caminos.pasos
    let alineamientoSeq1 = ""
    let alineamientoSeq2 = ""
    let puntaje = 0

    for (let i = 0; i < pasos.length; i++) {
        let pasoActual = pasos[i]
        let nodoActual = camino[i]

        switch(pasoActual) {
            case "diagonal":
                alineamientoSeq1 += seq1[nodoActual.i - 1]
                alineamientoSeq2 += seq2[nodoActual.j - 1]
                if(seq1[nodoActual.i - 1] === seq2[nodoActual.j - 1]) {
                    puntaje += parseInt($('#matchScore').val(), 10)
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10)
                }
                break
            case "lateral":
                alineamientoSeq1 += "-"
                alineamientoSeq2 += seq2[nodoActual.j - 1]
                puntaje += parseInt($('#gapScore').val(), 10)
                break
            case "superior":
                alineamientoSeq1 += seq1[nodoActual.i - 1]
                alineamientoSeq2 += "-"
                puntaje += parseInt($('#gapScore').val(), 10)
                break
        }
    }

    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('')
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('')

    return {
        seq1: alineamientoSeq2,
        seq2: alineamientoSeq1,
        puntaje: puntaje
    }
}

function alineamientoSWFinal(caminos) {
    const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
    let camino = caminos[0]
    let coordenadas = camino.coordenadas
    let pasos = camino.pasos

    let alineamientoSeq1 = ""
    let alineamientoSeq2 = ""
    let puntaje = 0

    for (let i = 0; i < pasos.length; i++) {
        let paso = pasos[i]
        let coordenada = coordenadas[i]

        switch(paso) {
            case "diagonal":
                alineamientoSeq1 += seq1[coordenada[0] - 1]
                alineamientoSeq2 += seq2[coordenada[1] - 1]
                if (seq1[coordenada[0] - 1] == seq2[coordenada[1] - 1]) {
                    puntaje += parseInt($('#matchScore').val(), 10)
                } else {
                    puntaje += parseInt($('#mismatchScore').val(), 10)
                }
                break
            case "superior":
                alineamientoSeq1 += "-"
                alineamientoSeq2 += seq2[coordenada[1] - 1]
                puntaje += parseInt($('#gapScore').val(), 10)
                break
            case "lateral":
                alineamientoSeq1 += seq1[coordenada[0] - 1]
                alineamientoSeq2 += "-"
                puntaje += parseInt($('#gapScore').val(), 10)
                break
        }
    }
    
    alineamientoSeq1 = alineamientoSeq1.split('').reverse().join('')
    alineamientoSeq2 = alineamientoSeq2.split('').reverse().join('')

    return {
        seq1: alineamientoSeq1,
        seq2: alineamientoSeq2,
        puntaje: puntaje
    }
}
