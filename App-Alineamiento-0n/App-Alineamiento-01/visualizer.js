function renderizarMatriz(config) {
    d3.select("#root").remove();

    const {
        algoritmo,
        titulo,
        subtitulo,
        edges,
        nodes,
        seq1,
        seq2,
        gap,
        matchScore,
        mismatchScore,
        paso,
        caminos,
        highlightCoords,
        equation
    } = config;

    const n = seq1.length + 1;
    const m = seq2.length + 1;

    const format = d3.format(",");

    const scaleColor = d3.scaleOrdinal()
        .domain([1, 2])
        .range(["#FFCCCC", "#CCE6CC"]);

    const size = 300;
    const sizeCell = size / nodes.length;
    const rectPadding = 0.1 * sizeCell;
    const rectCell = sizeCell - rectPadding * 2;

    const margin = {
        top: 50,
        bottom: 70,
        left: 70,
        right: 20
    };

    const scaleNodes = d3
        .scaleBand()
        .domain(nodes.map((d) => d.node))
        .range([0, size]);

    nodes.forEach((d) => {
        const o = scaleNodes(d.node);
        d.x = o;
        d.y = o;
        d.size = scaleNodes.bandwidth();
    });

    edges.forEach((d) => {
        const { node: i, x, size } = nodes.find(({ node }) => node === d.i);
        const { node: j, y } = nodes.find(({ node }) => node === d.j);
        d.i = i;
        d.j = j;
        d.nodeSize = size;
        d.x = y;
        d.y = x;
    });

    const root = d3.select("body").append("div").attr("id", "root");
    root.append("h1").text(titulo);
    root.append("p").html(subtitulo);

    const svg = root
        .append("svg")
        .style("max-width", "rem")
        .attr(
            "viewBox",
            `0 0 ${size + margin.left + margin.right} ${size + margin.top + margin.bottom}`
        );

    const defs = svg.append("defs");

    defs
        .append("pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", sizeCell)
        .attr("height", sizeCell)
        .attr("id", "matrix-grid")
        .attr("viewBox", "0 0 100 100")
        .append("rect")
        .attr("width", "100")
        .attr("height", "100")
        .attr("fill", "none")
        .attr("stroke", "hsl(205, 89%, 15%)");

    const marker = defs
        .append("marker")
        .attr("id", "marker")
        .attr("viewBox", "-0.5 -2 3 4")
        .attr("markerWidth", "5")
        .attr("markerHeight", "5")
        .attr("orient", "auto");

    marker
        .append("path")
        .attr("d", "M 0 -1.5 2 0 0 1.5z")
        .attr("fill", "hsl(0, 0%, 0%)")
        .attr("stroke", "hsl(0, 0%, 0%)")
        .attr("stroke-width", "1")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round");

    const group = svg
        .append("g")
        .attr("transform", `translate(${margin.left} ${margin.top})`);

    const groupNodes = group
        .append("g")
        .attr("font-size", "12")
        .attr("fill", "currentColor")
        .attr("font-weight", "700");

    const groupEdges = group.append("g");
    const groupFrame = group.append("g").style("pointer-events", "none");

    const groupHighlight = group
        .append("g")
        .style("pointer-events", "none")
        .attr("opacity", "0");

    const fontSize = (size / nodes.length) * 0.50;

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
        .text((d) => d.seq1);

    groupNodes
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x + d.size / 2} ${-(10)})`)
        .style("font-size", () => `${fontSize}px`)
        .text((d) => d.seq2);

    const groupsEdges = groupEdges
        .selectAll("g")
        .data(edges)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x} ${d.y})`);

    groupsEdges
        .filter((d) => d.camino)
        .append("rect")
        .attr("x", rectPadding)
        .attr("y", rectPadding)
        .attr("width", rectCell)
        .attr("height", rectCell)
        .attr("fill", (d) => scaleColor(d.camino))
        .attr("rx", "10");

    groupsEdges
        .filter((d) => d.puntaje !== undefined && d.puntaje !== "")
        .append("text")
        .style("font-size", () => `${fontSize}px`)
        .attr("x", rectPadding + rectCell / 2)
        .attr("y", rectPadding + rectCell / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text((d) => d.puntaje);

    const arrowPath = (d, type) => {
        const startX = d.nodeSize / 2;
        const startY = d.nodeSize / 2;
        const endX = (rectCell / 2) * (type === 'diagonal' || type === 'lateral' ? -1 : 0);
        const endY = (rectCell / 2) * (type === 'diagonal' || type === 'superior' ? -1 : 0);
        return `M ${startX} ${startY} l ${endX} ${endY}`;
    };

    groupsEdges.filter((d) => d.diagonalF).append('path').attr('d', d => arrowPath(d, 'diagonal')).style("stroke", "black").style("fill", "none").style("stroke-width", 1).attr("marker-end", "url(#marker)");
    groupsEdges.filter((d) => d.superiorF).append('path').attr('d', d => arrowPath(d, 'superior')).style("stroke", "black").style("fill", "none").style("stroke-width", 1).attr("marker-end", "url(#marker)");
    groupsEdges.filter((d) => d.lateralF).append('path').attr('d', d => arrowPath(d, 'lateral')).style("stroke", "black").style("fill", "none").style("stroke-width", 1).attr("marker-end", "url(#marker)");

    groupsEdges
        .append("rect")
        .attr("width", sizeCell)
        .attr("height", sizeCell)
        .attr("fill", "transparent")
        .attr("opacity", "0");

    groupHighlight.append("rect").attr("width", sizeCell).attr("height", sizeCell).attr("fill", "hsl(205, 65%, 55%)").attr("stroke", "none").attr("fill-opacity", "0.1");
    groupHighlight.append("path").attr("fill", "none").attr("stroke", "hsl(245, 99%, 68%)").attr("stroke-width", "2");
    groupHighlight.append("text").attr("x", size).attr("y", size + 10).attr("fill", "currentColor").attr("text-anchor", "start").attr("dominant-baseline", "hanging").attr("font-size", "12");

    groupFrame
        .append("rect")
        .attr("width", (size / (nodes.length || 1) * m))
        .attr("height", (size / (nodes.length || 1) * n))
        .attr("fill", "url(#matrix-grid)")
        .attr("stroke", "hsl(205, 89%, 15%)")
        .attr("stroke-width", "2")
        .attr("rx", "10");

    groupsEdges
        .on("mouseenter", function (e, d) {
            const value = format(d.puntaje);
            const { i, j, x, y, nodeSize: size, d: diag, s: sup, l: lat, max, match } = d;
            
            groupHighlight.select("path").transition().attr("d", `M 0 ${y + size / 2} h ${x} v ${-y}`);
            groupHighlight.select("rect").attr("transform", `translate(${x} ${y})`);
            
            let tooltipText = "";
            if (i === 0 || j === 0) {
                tooltipText = `<tspan x="-65" dy="1.2em">Puntaje inicialización <tspan font-weight="700">${value}</tspan>.</tspan>`;
            } else if (!isNaN(parseInt(value.replace('−', '-'), 10))) {
                const s1 = seq1[i-1] || '';
                const s2 = seq2[j-1] || '';
                tooltipText = `
                    <tspan x="-65" dy="0em">Puntaje celda diagonal <tspan font-weight="700">${diag}</tspan> + <tspan font-weight="700">${(s1===s2)?matchScore:mismatchScore}</tspan> (Debido a ${match} entre <tspan font-weight="700">${s1}</tspan> y <tspan font-weight="700">${s2}</tspan>).</tspan>
                    <tspan x="-65" dy="1.2em">Puntaje celda superior <tspan font-weight="700">${sup}</tspan> + <tspan font-weight="700">${gap}</tspan> (Puntaje Gap).</tspan>
                    <tspan x="-65" dy="1.2em">Puntaje celda lateral <tspan font-weight="700">${lat}</tspan> + <tspan font-weight="700">${gap}</tspan> (Puntaje Gap).</tspan>
                    <tspan x="-65" dy="1.2em">Puntaje máximo <tspan font-weight="700">${max}</tspan>`;
            }
            groupHighlight.select("text").html(tooltipText);
            groupHighlight.attr("opacity", "1");
        })
        .on("mouseleave", () => {
            groupHighlight.attr("opacity", "0");
        });

    if (highlightCoords) {
        groupEdges
            .select(`g:nth-of-type(${Math.floor(obtenerPaso(highlightCoords.i, highlightCoords.j, m) + 1)})`)
            .dispatch("mouseenter");
    }

    if (equation) {
        root.append("p").html(`\\(${equation}\\)`);
        MathJax.typesetPromise();
    }
}
