var edges = []
var nodes = []
var paso = 0
var traceback = []
var limite = 0
var algoritmo = "nw"
var caminos = []
var posicionActualCamino = 0
var final = 0
// Gestión de camino final/óptimo (un solo camino)
let optimalPath = null
const PATH_COLORS = ['#e41a1c'] // color placeholder si no hay color de pasos
let currentSelectedPathCoords = null

$(document).ready(function () {
	const seq1Input = document.getElementById('seq_1')	//referencia a input seq1
	const seq2Input = document.getElementById('seq_2')	//referencia a input seq1
	seq1Input.addEventListener('input', convertirMayusculas)	// Agregar eventos de escucha seq1
	seq2Input.addEventListener('input', convertirMayusculas)	// Agregar eventos de escucha seq1
	d3.select("#root").remove() //reiniciar
	inicializar(algoritmo) //Inicialización algoritmo por defecto NW
	$('.seq').keyup(function () { inicializar(algoritmo) })
	$('.params').change(function () { inicializar(algoritmo) })
	// Nota: No vincular a .btn-compute (también lo usa el botón desplegable),
	// usamos el listener específico de #calculateButton más abajo.

	// Botón para mostrar Camino Final (único camino óptimo)
	$('#btn-final-path').on('click', function (e) {
		e.preventDefault()
		mostrarCaminoFinal()
	})

	// Cerrar menú al hacer click fuera
	$(document).on('click', function (e) {
		const $btn = $('#btn-best-paths')
		const $menu = $('#best-paths-menu')
		if (!$btn.is(e.target) && $btn.has(e.target).length === 0 && !$menu.is(e.target) && $menu.has(e.target).length === 0) {
			$menu.hide()
		}
	})
})

document.getElementById("calculateButton").addEventListener("click", function (event) { //boton calcular
	event.preventDefault()
	inicializar(algoritmo)
})

document.getElementById("siguiente").addEventListener("click", function (event) { //boton siguiente
	event.preventDefault()
	if(final===1 && paso === limite){
		avanzar("nw",0,0)
		paso ++
	}
	if (paso <= (n - 1) * (m - 1)) {
		siguiente(algoritmo,paso)
		paso++
	}
	else {
		if (paso == (n - 1) * (m - 1) + 1) {
			let matriz = edges;
			if(algoritmo==="sw") {
				caminos = tracebackSW(matriz)
				limite = paso + caminos[0].pasos.length
			}
			if(algoritmo==="nw") {
				caminos = tracebackNW(matriz)
				limite = paso + caminos.pasos.length
			}
		}
		if (paso < limite) {
			if(algoritmo==="sw") {
				avanzar(algoritmo,caminos[0].coordenadas[posicionActualCamino][0],caminos[0].coordenadas[posicionActualCamino][1],caminos[0].pasos[posicionActualCamino])
				posicionActualCamino++
				paso++
			}
			if(algoritmo==="nw") {
				avanzar(algoritmo,caminos.coordenadas[posicionActualCamino][0],caminos.coordenadas[posicionActualCamino][1],caminos.pasos[posicionActualCamino])
				posicionActualCamino++
				paso++
				if(paso === limite && algoritmo==="nw") final = 1
			}
		}
	}
})

document.getElementById("anterior").addEventListener("click", function (event) {
	event.preventDefault()
	if(paso == 1) {
		inicializar(algoritmo)
	}
	else if (paso == 1) {
		inicializar(algoritmo)
	}
	else if(paso == 2) {
		inicializar(algoritmo)
	}
	else if(paso > 2 && paso <= (n-1)*(m-1)+1) { 
		anterior(algoritmo,paso-2)
		paso --
	}
	else if(paso === (n-1)*(m-1)+2) {

		if (algoritmo === "nw") {
			edges = borrarCamino(caminos.coordenadas[0][0], caminos.coordenadas[0][1]);
		} else if (algoritmo === "sw") {
			edges = borrarCamino(caminos[0].coordenadas[0][0], caminos[0].coordenadas[0][1]);
		}

		paso = paso-2
		siguiente(algoritmo,paso)
		paso ++
		posicionActualCamino = 0
	}
	else if(paso>2 && paso > (n-1)*(m-1)+2 && paso <= limite) {
		if(paso===limite && algoritmo === "nw") final = 0

		if (algoritmo === "nw") {
			retroceder(algoritmo, caminos.coordenadas[posicionActualCamino-1][0], caminos.coordenadas[posicionActualCamino-1][1], paso-2);
		} else if (algoritmo === "sw") {
			retroceder(algoritmo, caminos[0].coordenadas[posicionActualCamino-1][0], caminos[0].coordenadas[posicionActualCamino-1][1], paso-2);
		}
		posicionActualCamino --
		paso --
	}
	else if(paso === (limite+1) && algoritmo === "nw") {
		retroceder(algoritmo,0,0,paso-2)
		paso--
	}


})

function obtenerPaso(i, j, m) {
	return i * m + j;
}

function obtenerCoordenadas(paso) {
	const x = n - 1
	const y = m - 1
	if (paso < 1 || paso > x * y) return null; // Paso fuera de rango, devuelve null
	const fila = Math.ceil(paso / y); // Calcular la fila
	const columna = paso % y === 0 ? y : paso % y; // Calcular la columna
	return [fila, columna]; // Devolver las coordenadas como un array [fila, columna]
}

const body = document.querySelector('body')
const sidebar = body.querySelector('nav')
const toggle = body.querySelector('.toggle')
const searchBtn = body.querySelector('.search-box')
const modeSwitch = body.querySelector('.toggle-switch')
const modeText = body.querySelector('.mode-text')

toggle.addEventListener('click', () => {
	sidebar.classList.toggle('close');
})

searchBtn.addEventListener('click', () => {
	sidebar.classList.remove('close');
})


modeSwitch.addEventListener("click" , () =>{ //ALTERNAR ALGORITMO
    body.classList.toggle("dark");
    
    if(body.classList.contains("dark")){
        modeText.innerText = "Local";
		algoritmo="sw"
		inicializar(algoritmo)
    }else{
        modeText.innerText = "Global";
		algoritmo="nw"
		inicializar(algoritmo)
    }
})


const seq1Input = document.getElementById('seq_1');
const seq2Input = document.getElementById('seq_2');
seq1Input.addEventListener('input', convertirMayusculas);
seq2Input.addEventListener('input', convertirMayusculas);


function convertirMayusculas(event) {
	const input = event.target;
	const valor = input.value.toUpperCase();
	input.value = valor;
}

function inicializacionNW(edges, seq1, seq2, gap = -2) {
	const n = seq1.length
	const m = seq2.length
	const edge = edges.find(e => e.i === 0 && e.j === 0)
	if (edge) {
		edge.puntaje = 0
	}

	for (let i = 1; i <= n; i++) {
		const edge = edges.find(e => e.i === i && e.j === 0)
		if (edge) {
			edge.puntaje = gap * (i)
		}
	}

	for (let j = 1; j <= m; j++) {
		const edge = edges.find(e => e.i === 0 && e.j === j)
		if (edge) {
			edge.puntaje = gap * (j)
		}
	}
	return edges
}

function inicializacionSW(edges, seq1, seq2, gap = -2) {
	const n = seq1.length
	const m = seq2.length
	const edge = edges.find(e => e.i === 0 && e.j === 0)
	if (edge) {
		edge.puntaje = 0
	}

	for (let i = 1; i <= n; i++) {
		const edge = edges.find(e => e.i === i && e.j === 0)
		if (edge) {
			edge.puntaje = 0
		}
	}

	for (let j = 1; j <= m; j++) {
		const edge = edges.find(e => e.i === 0 && e.j === j)
		if (edge) {
			edge.puntaje = 0
		}
	}
	return edges
}

function generateRandomString2(length) {
	let result = ''
	let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	let charactersLength = characters.length
	for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength))
	return result
}

function convertirMayusculas(event) {	// Función para convertir el valor a mayúsculas
	const input = event.target;
	const valor = input.value.toUpperCase();
	input.value = valor;
}

function encontrarCelda(matriz, i, j) {
    for (let celda of matriz) {
        if (celda.i === i && celda.j === j) {
            return celda;
        }
    }
    return null;
}

function tracebackSW(matriz) {
    // 1. Identificar el punto de inicio (la celda con el puntaje máximo)
    let celdaInicial = matriz.reduce((max, celda) => celda.puntaje > max.puntaje ? celda : max);

    // 2. Realizar el traceback
    let caminos = [[celdaInicial]];

    caminos.forEach((camino) => {
        while (camino[camino.length - 1].puntaje > 0) {
            let celdaActual = camino[camino.length - 1];
            let posiblesPasos = [];

            // Comprobar movimiento diagonal
            if (celdaActual.diagonal) {
                let celdaDiagonal = encontrarCelda(matriz, celdaActual.i - 1, celdaActual.j - 1);
                posiblesPasos.push(celdaDiagonal);
            }

            // Comprobar movimiento superior
            if (celdaActual.superior) {
                let celdaSuperior = encontrarCelda(matriz, celdaActual.i - 1, celdaActual.j);
                posiblesPasos.push(celdaSuperior);
            }

            // Comprobar movimiento lateral
            if (celdaActual.lateral) {
                let celdaLateral = encontrarCelda(matriz, celdaActual.i, celdaActual.j - 1);
                posiblesPasos.push(celdaLateral);
            }

            // Si hay más de un paso posible, duplicar el camino y agregar cada opción a un camino diferente
            if (posiblesPasos.length > 1) {
                for (let paso of posiblesPasos.slice(0, -1)) {
                    let nuevoCamino = camino.slice();
                    nuevoCamino.push(paso);
                    caminos.push(nuevoCamino);
                }
            }

            // Agregar el siguiente paso al camino actual
            camino.push(posiblesPasos[posiblesPasos.length - 1]);
        }
    });

    // 3. Devolver los caminos y sus coordenadas
    let caminosCoordenadas = [];

    for (let camino of caminos) {
        let coordenadas = camino.map(c => [c.i, c.j]);
        let pasos = camino.map(c => {
            if (c.diagonal) return "diagonal";
            if (c.superior) return "superior";
            if (c.lateral) return "lateral";
        });
        caminosCoordenadas.push({coordenadas, pasos});
    }

    return caminosCoordenadas;
}

function tracebackNW(matriz) {
    let i = n-1; // Asume que n es la longitud de seq1
    let j = m-1 // Asume que m es la longitud de seq2
	const seq1 = $('#seq_1').val()
    const seq2 = $('#seq_2').val()
	matchScore = parseInt($('#matchScore').val(), 10)
	mismatchScore = parseInt($('#mismatchScore').val(), 10)
	gapPenalty = parseInt($('#gapScore').val(), 10)

    let camino = [];
    let coordenadas = [];
    let pasos = [];

    while (i > 0 || j > 0) {
        let celdaActual = encontrarCelda(matriz, i, j);

        
        if (i > 0 && j > 0 && (celdaActual.puntaje == encontrarCelda(matriz, i-1, j-1).puntaje + (seq1[i-1] === seq2[j-1] ? matchScore : mismatchScore))) {
            camino.push(celdaActual);
            coordenadas.push([i, j]);
            pasos.push("diagonal");
            i--;
            j--;
        }
        
        else if (i > 0 && (celdaActual.puntaje == encontrarCelda(matriz, i-1, j).puntaje + gapPenalty)) {
            camino.push(celdaActual);
            coordenadas.push([i, j]);
            pasos.push("superior");
            i--;
        }

        else {
            camino.push(celdaActual);
            coordenadas.push([i, j]);
            pasos.push("lateral");
            j--;
        }
    }

    return {
        camino: camino,
        coordenadas: coordenadas,
        pasos: pasos
    };
}

function borrarCamino(x, y,) {
    const edge = edges.find(e => e.i === x && e.j === y)
    if (edge) {
        edge.camino = 0
    }
    return edges
}


// Camino Final Por Joaquín Pérez y Benjamín Ortiz


function getScoring() {
	return {
		match: parseInt($('#matchScore').val(), 10),
		mismatch: parseInt($('#mismatchScore').val(), 10),
		gap: parseInt($('#gapScore').val(), 10)
	}
}

function computeMatrixNW(seq1, seq2, score) {
	const n = seq1.length + 1
	const m = seq2.length + 1
	const M = Array.from({ length: n }, () => Array(m).fill(0))
	for (let i = 1; i < n; i++) M[i][0] = i * score.gap
	for (let j = 1; j < m; j++) M[0][j] = j * score.gap
	for (let i = 1; i < n; i++) {
		for (let j = 1; j < m; j++) {
			const s = seq1[i-1] === seq2[j-1] ? score.match : score.mismatch
			const dg = M[i-1][j-1] + s
			const up = M[i-1][j] + score.gap
			const lf = M[i][j-1] + score.gap
			M[i][j] = Math.max(dg, up, lf)
		}
	}
	return M
}

function computeMatrixSW(seq1, seq2, score) {
	const n = seq1.length + 1
	const m = seq2.length + 1
	const M = Array.from({ length: n }, () => Array(m).fill(0))
	let maxVal = 0;
	for (let i = 1; i < n; i++) {
		for (let j = 1; j < m; j++) {
			const s = seq1[i-1] === seq2[j-1] ? score.match : score.mismatch
			const dg = M[i-1][j-1] + s
			const up = M[i-1][j] + score.gap
			const lf = M[i][j-1] + score.gap
			M[i][j] = Math.max(0, dg, up, lf)
			if (M[i][j] > maxVal) maxVal = M[i][j]
		}
	}
	return { M, maxVal }
}

function collectTopPathsNW(M, seq1, seq2, score, k = 1) {
	const n = M.length
	const m = M[0].length
	const paths = []

	function backtrack(i, j, coordsRev, pasosRev) {
		if (paths.length >= k) return
		if (i === 0 && j === 0) {
			paths.push({
				coordenadas: coordsRev.slice().reverse(),
				pasos: pasosRev.slice().reverse(),
				puntaje: M[n-1][m-1]
			})
			return
		}
		let moves = []
		if (i > 0 && j > 0) {
			const s = seq1[i-1] === seq2[j-1] ? score.match : score.mismatch
			if (M[i][j] === M[i-1][j-1] + s) moves.push({ di: -1, dj: -1, paso: 'diagonal' })
		}
		if (i > 0 && M[i][j] === M[i-1][j] + score.gap) moves.push({ di: -1, dj: 0, paso: 'superior' })
		if (j > 0 && M[i][j] === M[i][j-1] + score.gap) moves.push({ di: 0, dj: -1, paso: 'lateral' })

    		// Mantener orden determinista: diagonal, superior, lateral

		for (const mv of moves) {
			coordsRev.push([i, j])
			pasosRev.push(mv.paso)
			backtrack(i + mv.di, j + mv.dj, coordsRev, pasosRev)
			coordsRev.pop(); pasosRev.pop()
			if (paths.length >= k) break
		}
	}
	backtrack(n-1, m-1, [], [])
	return paths
}

function collectTopPathsSW(obj, seq1, seq2, score, k = 1) {
	const { M, maxVal } = obj
	const n = M.length
	const m = M[0].length
	const starts = []
	for (let i = 1; i < n; i++) {
		for (let j = 1; j < m; j++) {
			if (M[i][j] === maxVal) starts.push([i, j])
		}
	}
	// Orden fijo por preferencia (fila/col)
	starts.sort((a,b)=> (b[0]+b[1]) - (a[0]+a[1]))
	const paths = []

	function backtrack(i, j, coordsRev, pasosRev) {
		if (paths.length >= k) return
		if (M[i][j] === 0) {
			paths.push({
				coordenadas: coordsRev.slice().reverse(),
				pasos: pasosRev.slice().reverse(),
				puntaje: obj.maxVal
			})
			return
		}
		let moves = []
		if (i > 0 && j > 0) {
			const s = seq1[i-1] === seq2[j-1] ? score.match : score.mismatch
			if (M[i][j] === M[i-1][j-1] + s) moves.push({ di: -1, dj: -1, paso: 'diagonal' })
		}
		if (i > 0 && M[i][j] === M[i-1][j] + score.gap) moves.push({ di: -1, dj: 0, paso: 'superior' })
		if (j > 0 && M[i][j] === M[i][j-1] + score.gap) moves.push({ di: 0, dj: -1, paso: 'lateral' })

    	// Orden determinista: diagonal, superior, lateral
		for (const mv of moves) {
			coordsRev.push([i, j])
			pasosRev.push(mv.paso)
			backtrack(i + mv.di, j + mv.dj, coordsRev, pasosRev)
			coordsRev.pop(); pasosRev.pop()
			if (paths.length >= k) break
		}
	}

	for (const [si, sj] of starts) {
		if (paths.length >= k) break
		backtrack(si, sj, [], [])
	}
	return paths
}

function mostrarCaminoFinal() {
	const seq1 = $('#seq_1').val().toUpperCase()
	const seq2 = $('#seq_2').val().toUpperCase()
	const score = getScoring()
	let path
	if (algoritmo === 'nw') {
		const M = computeMatrixNW(seq1, seq2, score)
		const paths = collectTopPathsNW(M, seq1, seq2, score, 1)
		path = paths[0]
	} else {
		const obj = computeMatrixSW(seq1, seq2, score)
		const paths = collectTopPathsSW(obj, seq1, seq2, score, 1)
		path = paths[0]
	}
	if (!path) return
	optimalPath = path
	aplicarResaltadoCaminoFinal()
}

function aplicarResaltadoCaminoFinal() {
	if (!optimalPath) return
	// Limpiar banderas
	edges.forEach(e => { e.camino = 0; e.caminoColor = undefined })
	// Asegurar puntajes en edges
	rellenarPuntajesEnEdges()
	const coords = optimalPath.coordenadas.slice()
	// Incluir siempre la celda final (esquina inferior derecha) para que el camino abarque el final visual
	const endI = n - 1, endJ = m - 1
	const hasEnd = coords.some(([ci, cj]) => ci === endI && cj === endJ)
	if (!hasEnd) coords.push([endI, endJ])
	// Para NW, incluir también la esquina superior izquierda (0,0) como fin visual del recorrido
	if (algoritmo === 'nw') {
		const hasStart = coords.some(([ci, cj]) => ci === 0 && cj === 0)
		if (!hasStart) coords.unshift([0, 0])
	}
	// Mantener el color verde usado en el modo paso a paso: usamos edge.camino = 2 (verde en scaleColor)
	for (const [i,j] of coords) {
		const edge = edges.find(e => e.i === i && e.j === j)
		if (edge) {
			edge.camino = 2
		}
	}
	currentSelectedPathCoords = coords.slice()
	renderHighlightedMatrix('Camino Final')
	mostrarResultadoAlineacion(optimalPath)
}

function renderHighlightedMatrix(titulo = 'Camino') {
	// Render sencillo usando el estado actual de nodes/edges
	d3.select("#root").remove()
	const seq1 = $('#seq_1').val()
	const seq2 = $('#seq_2').val()
	const numNodes = Math.max(seq1.length, seq2.length) + 1

	// Preparar nodes si está vacío
	if (!nodes || nodes.length === 0) {
		nodes = Array.from({ length: numNodes }, (_, i) => ({
			node: i === 0 ? 0 : i,
			seq1: i === 0 ? '' : seq1[i - 1] || '',
			seq2: i === 0 ? '' : seq2[i - 1] || '',
		}))
	}

	const size = 300
	const sizeCell = size / nodes.length
	const rectPadding = 0.1 * sizeCell
	const rectCell = sizeCell - rectPadding * 2
	const margin = { top: 50, bottom: 70, left: 70, right: 20 }

	const scaleNodes = d3.scaleBand().domain(nodes.map(d=>d.node)).range([0, size])
	nodes.forEach((d) => {
		d.x = scaleNodes(d.node)
		d.y = scaleNodes(d.node)
		d.size = size / nodes.length
	})
	edges.forEach((d) => {
		d.x = scaleNodes(d.j)
		d.y = scaleNodes(d.i)
		d.nodeSize = size / nodes.length
	})

	const root = d3.select("body").append("div").attr("id", "root")
	root.append("h1").text(algoritmo === 'nw' ? 'Alineamiento Global (NW)' : 'Alineamiento Local (SW)')
	root.append("p").html(`${titulo}`)

	const svg = root.append("svg").style("max-width", "rem").attr("viewBox",
		`0 0 ${size + margin.left + margin.right} ${size + margin.top + margin.bottom}`)
	const defs = svg.append("defs")
	const pattern = defs.append("pattern").attr("patternUnits", "userSpaceOnUse").attr("width", sizeCell)
		.attr("height", sizeCell).attr("id", "matrix-grid").attr("viewBox", "0 0 100 100")
	pattern.append("rect").attr("width", "100").attr("height", "100").attr("fill", "none").attr("stroke", "hsl(205, 89%, 15%)")

	const group = svg.append("g").attr("transform", `translate(${margin.left} ${margin.top})`)
	const groupNodes = group.append("g").attr("font-size", "12").attr("fill", "currentColor").attr("font-weight", "700")
	const groupFrame = group.append("g").style("pointer-events", "none") // grid frame with pattern
	const groupEdges = group.append("g") // overlays and text
		.style('color', 'inherit')
	const groupPath = group.append("g") // path polyline

	const containerWidth = size / numNodes
	const fontSize = (size / numNodes) * 0.50

	groupNodes.append("g").selectAll("text").data(nodes).enter().append("text")
		.attr("dominant-baseline", "middle").attr("text-anchor", "end").attr("transform", (d) => `translate(-10 ${d.y + d.size / 2})`)
		.style("font-size", () => `${fontSize}px`).text((d) => d.seq1)

	groupNodes.append("g").selectAll("text").data(nodes).enter().append("text")
		.attr("text-anchor", "middle").attr("transform", (d) => `translate(${d.x + d.size / 2} ${-(10)})`)
		.style("font-size", () => `${fontSize}px`).text((d) => d.seq2)

	// Cuadrícula con pattern como en la estética original (alineada al (0,0))
	const cellSize = size / nodes.length
	// Clip redondeado para que las esquinas internas coincidan con el borde redondeado
	const clip = defs.append('clipPath').attr('id', 'grid-clip')
	clip.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', cellSize * m)
		.attr('height', cellSize * n)
		.attr('rx', 10)
		.attr('ry', 10)
	groupFrame.attr('clip-path', 'url(#grid-clip)')
	groupFrame.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', cellSize * m)
		.attr('height', cellSize * n)
		.attr('fill', 'url(#matrix-grid)')

	// Borde exterior grueso de la matriz (alineado a la cuadrícula)
	group.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', cellSize * m)
		.attr('height', cellSize * n)
		.attr('rx', 10)
		.attr('ry', 10)
		.attr('fill', 'none')
		.attr('stroke', 'hsl(205, 89%, 15%)')
		.attr('stroke-width', 2)

	const groupsEdges = groupEdges.selectAll("g").data(edges).enter().append("g").attr("transform", (d) => `translate(${d.x} ${d.y})`)

	const scaleColor = d3.scaleOrdinal().domain([1, 2]).range(["#FFCCCC", "#CCE6CC"])

	
	groupsEdges.filter((d) => d.camino)
		.append("rect")
		.attr("x", rectPadding)
		.attr("y", rectPadding)
		.attr("width", rectCell)
		.attr("height", rectCell)
		.attr("fill", (d) => scaleColor(d.camino))
		.attr("rx", "10")

	groupsEdges.filter((d) => d.puntaje !== undefined && d.puntaje !== "")
		.append("text")
		.style("font-size", () => `${fontSize}px`)
		.style('font-family', 'inherit')
		.style('font-weight', 'normal')
		.attr("x", rectPadding + rectCell / 2)
		.attr("y", rectPadding + rectCell / 2)
		.attr("text-anchor", "middle").attr("dominant-baseline", "middle")
		.attr('fill', 'currentColor')
		.text((d) => d.puntaje)

	// Dibuja una polilínea conectando los centros del camino seleccionado
	if (currentSelectedPathCoords && currentSelectedPathCoords.length > 0) {
		// Generar puntos [x,y] desde coords [i,j]
		const points = currentSelectedPathCoords.map(([i,j]) => {
			const cx = scaleNodes(j) + sizeCell / 2
			const cy = scaleNodes(i) + sizeCell / 2
			return [cx, cy]
		})
		// Invertimos el orden para que la flecha apunte hacia arriba (hacia el origen)
		const pointsUp = points.slice().reverse()

		// Marcador flecha
		const arrow = defs.append('marker')
			.attr('id', 'bestpath-arrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 10)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
		arrow.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#333')

		const line = d3.line().x(d => d[0]).y(d => d[1])
		groupPath.append('path')
			.attr('d', line(pointsUp))
			.attr('fill', 'none')
			.attr('stroke', '#333')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#bestpath-arrow)')
	}
}

// Calcula la matriz DP (NW o SW) y asigna todos los puntajes a edges para que se muestren los números
function rellenarPuntajesEnEdges() {
	const seq1 = $('#seq_1').val().toUpperCase()
	const seq2 = $('#seq_2').val().toUpperCase()
	const score = getScoring()
	if (algoritmo === 'nw') {
		const M = computeMatrixNW(seq1, seq2, score)
		// Asignar cada valor M[i][j] al edge correspondiente
		edges.forEach(e => {
			if (typeof e.i === 'number' && typeof e.j === 'number' && M[e.i] && typeof M[e.i][e.j] !== 'undefined') {
				e.puntaje = M[e.i][e.j]
			}
		})
	} else {
		const obj = computeMatrixSW(seq1, seq2, score)
		const M = obj.M
		edges.forEach(e => {
			if (typeof e.i === 'number' && typeof e.j === 'number' && M[e.i] && typeof M[e.i][e.j] !== 'undefined') {
				e.puntaje = M[e.i][e.j]
			}
		})
	}
}

// Construye las secuencias alineadas y puntaje a partir de un camino seleccionado
function mostrarResultadoAlineacion(path) {
	const seq1 = $('#seq_1').val().toUpperCase()
	const seq2 = $('#seq_2').val().toUpperCase()
	const { match, mismatch, gap } = getScoring()

	// Tomar como punto final:
	// - NW: esquina inferior derecha (n-1,m-1)
	// - SW: última coordenada del camino (pico máximo)
	let i = (algoritmo === 'nw') ? (n - 1) : (path.coordenadas[path.coordenadas.length - 1][0])
	let j = (algoritmo === 'nw') ? (m - 1) : (path.coordenadas[path.coordenadas.length - 1][1])

	let a1 = []
	let a2 = []
	let total = 0

	// Recorremos pasos desde el final hacia el inicio para consumir indices i,j
	for (let p = path.pasos.length - 1; p >= 0; p--) {
		const paso = path.pasos[p]
		if (paso === 'diagonal') {
			a1.push(seq1[i - 1] || '-')
			a2.push(seq2[j - 1] || '-')
			total += (seq1[i - 1] === seq2[j - 1]) ? match : mismatch
			i--; j--;
		} else if (paso === 'superior') {
			a1.push(seq1[i - 1] || '-')
			a2.push('-')
			total += gap
			i--;
		} else { // lateral
			a1.push('-')
			a2.push(seq2[j - 1] || '-')
			total += gap
			j--;
		}
	}

	const aligned1 = a1.reverse().join('')
	const aligned2 = a2.reverse().join('')

	// Eliminar resultados previos si existen
	d3.select('#alignment-result').remove()
	const root = d3.select('#root')
	// Insertar el contenedor DESPUÉS del SVG para que quede debajo de la matriz
	const container = root.append('div').attr('id', 'alignment-result')
	// Heredar tipografía/estilos del sitio (no forzamos font-size)
	container.style('font-family', null)
	container.style('color', null)
	container.style('font-size', null)
	// Texto de resultado (mismo estilo y tamaño que otros <p>)
	container.append('p').text(`Resultado de la matriz — Puntaje total: ${total}`)
	// Alineaciones en líneas separadas
	container.append('p').text(aligned1)
	container.append('p').text(aligned2)
}


