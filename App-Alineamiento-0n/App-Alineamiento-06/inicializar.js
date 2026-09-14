function inicializar(algoritmo) {
    d3.select("#root").remove()
    edges = []
    nodes = []
    paso = 0
    limite = 0
    caminos = []
    posicionActualCamino = 0
    final = 0
    const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
    const gap = $('#gapScore').val()
    let numNodes = Math.max(seq1.length, seq2.length) + 1
    let nodesData = Array.from({ length: numNodes }, (_, i) => ({
        node: i === 0 ? 0 : i,
        seq1: i === 0 ? '' : seq1[i - 1] || '',
        seq2: i === 0 ? '' : seq2[i - 1] || '',
    }))
    nodes = nodesData
    secuencia1 = nodes.map(({ seq1 }) => seq1)
    secuencia2 = nodes.map(({ seq2 }) => seq2)
    n = seq1.length + 1
    m = seq2.length + 1

    for (let i = 0; i < n; i++) {
        for (j = 0; j < m; j++) {
            edges.push({
                i: i,
                j: j
            })
        }
    }

    if (algoritmo == "nw") {
        edges = inicializacionNW(edges, seq1, seq2, gap)
    }

    if (algoritmo == "sw") {
        edges = inicializacionSW(edges, seq1, seq2, gap)
    }
    paso++

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
        bottom: 30,
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
    } else {
        console.log("Valor de algoritmo no reconocido.");
    }
    root.append("p").html("Inicialización")

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


    groupNodes //Secuencia 1
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

    groupNodes //Secuencia 2
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

    groupsEdges //Color de celda
        .filter((d) => d.camino)
        .append("rect")
        .attr("x", rectPadding)
        .attr("y", rectPadding)
        .attr("width", rectCell)
        .attr("height", rectCell)
        .attr("fill", (d) => scaleColor(d.camino))
        .attr("rx", "10")

    groupsEdges //Puntaje de celda
        .filter((d) => d.puntaje !== undefined && d.puntaje !== "")
        .append("text")
        .style("font-size", () => `${fontSize}px`)
        .attr("x", rectPadding + rectCell / 2) // centro en X
        .attr("y", rectPadding + rectCell / 2) // centro en Y
        .attr("text-anchor", "middle") // centrar horizontalmente
        .attr("dominant-baseline", "middle") // centrar verticalmente
        .text((d) => d.puntaje)

    groupsEdges //Diagonal
        .filter((d) => d.diagonal !== undefined && d.diagonal !== "" && d.diagonal !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${(rectCell / 2) * -1} ${(rectCell / 2) * -1}`)
        .style("stroke", "black") // color de la línea
        .style("fill", "none") // sin relleno
        .style("stroke-width", 1) // ancho de la línea
        .attr("marker-end", "url(#marker)")  // Asigna el marcador al final de la línea-

    groupsEdges //Superior
        .filter((d) => d.superior !== undefined && d.superior !== "" && d.superior !== 0)
        .append('svg:path')
        .attr('d', d => `M ${d.nodeSize / 2} ${d.nodeSize / 2} l ${0} ${(rectCell / 2) * -1}`)
        .style("stroke", "black") // color de la línea
        .style("fill", "none") // sin relleno
        .style("stroke-width", 1) // ancho de la línea
        .attr("marker-end", "url(#marker)") // Asigna el marcador al final de la línea

    groupsEdges //Lateral
        .filter((d) => d.lateral !== undefined && d.lateral !== "" && d.lateral !== 0)
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
        .attr("text-anchor", "end")
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
            const { i, j, x, y, nodeSize: size } = d
            const value = isNaN(d.puntaje) ? '' : format(d.puntaje) // Si d.puntaje es NaN, value será ''
            const h = x + size / 2
            const v = y + size / 2
            const a = size / 2
            const cord = { h, v, a }

            groupHighlight
                .select("path")
                .transition()
                .attr(
                    "d",
                    `M 0 ${v} h ${h - a} a ${a} ${a} 0 0 0 ${a} ${-a} v ${-(v - a)}`
                )

            groupHighlight.select("rect").attr("transform", `translate(${x} ${y})`)

            if (i == 0 || j == 0) groupHighlight.select("text").html(`Puntaje inicicialización <tspan font-weight="700">${value}</tspan>`)
            else groupHighlight.select("text").html(``)
            groupHighlight.attr("opacity", "1")
        })
        .on("mouseleave", () => { groupHighlight.attr("opacity", "0") })
    groupEdges
        .select(`g:nth-of-type(${Math.floor(paso)})`)
        .dispatch("mouseenter")

}