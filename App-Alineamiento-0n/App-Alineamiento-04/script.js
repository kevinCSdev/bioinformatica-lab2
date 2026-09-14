var edges = []
var nodes = []
var paso = 0
var traceback = []
var limite = 0
var algoritmo = "nw"
var caminos = []
var posicionActualCamino = 0
var final = 0

$(document).ready(function () {
	const seq1Input = document.getElementById('seq_1')	//referencia a input seq1
	const seq2Input = document.getElementById('seq_2')	//referencia a input seq1
	seq1Input.addEventListener('input', convertirMayusculas)	// Agregar eventos de escucha seq1
	seq2Input.addEventListener('input', convertirMayusculas)	// Agregar eventos de escucha seq1
	d3.select("#root").remove() //reiniciar

	// Si existe el select de algoritmo, sincronizarlo con la variable global y añadir listener
	const algoSelect = document.getElementById('algoSelect');
	if (algoSelect) {
		algoritmo = algoSelect.value || algoritmo;
		// actualizar texto de modo si existe
		const modeText = document.querySelector('.mode-text');
		if (modeText) {
			if (algoritmo === 'nw') modeText.innerText = 'Global';
			else if (algoritmo === 'sw') modeText.innerText = 'Local';
			else if (algoritmo === 'ed') modeText.innerText = 'Mínimo';
		}
		algoSelect.addEventListener('change', function (e) {
			algoritmo = e.target.value;
			if (modeText) {
				if (algoritmo === 'nw') modeText.innerText = 'Global';
				else if (algoritmo === 'sw') modeText.innerText = 'Local';
				else if (algoritmo === 'ed') modeText.innerText = 'Mínimo';
			}
			inicializar(algoritmo);
		});
	}

	inicializar(algoritmo) //Inicialización algoritmo por defecto
	$('.seq').keyup(function () { inicializar(algoritmo) })
	$('.params').change(function () { inicializar(algoritmo) })
	$('.btn-compute').click(function () { inicializar(algoritmo) })
})

document.getElementById("calculateButton").addEventListener("click", function (event) { //boton calcular
	event.preventDefault()
	inicializar(algoritmo)
})

document.addEventListener('change', (e) => {
	if (e.target && e.target.id === 'algoritmo') {
		window.MODO = e.target.value || 'nw';
		// limpiar estado si hace falta:
		// d3.select("#root").remove();
		// reset de contadores/pasos:
		if (window.resetEstado) window.resetEstado();
	}
});

function getAlgoritmo() {
	const sel = document.getElementById('algoritmo');
	return sel ? sel.value : (window.MODO || 'nw');
}

document.getElementById("siguiente").addEventListener("click", function (event) { //boton siguiente
	event.preventDefault()
	if (final === 1 && paso === limite) {
		avanzar("nw", 0, 0)
		paso++
	}
	if (paso <= (n - 1) * (m - 1)) {
		if (algoritmo === 'ed') {
			if (typeof window.siguienteED === 'function') {
				siguienteED(paso);
			} else {
				console.warn('siguienteED no definido');
			}
		} else {
			siguiente(algoritmo,paso)
		}
		paso++
	}
	else {
		if (paso == (n - 1) * (m - 1) + 1) {
			let matriz = edges;
			if (algoritmo === "sw") {
				caminos = tracebackSW(matriz)
				limite = paso + caminos[0].pasos.length
			}
			if (algoritmo === "nw") {
				caminos = tracebackNW(matriz)
				limite = paso + caminos.pasos.length
			}
			if (algoritmo === "ed") {
				caminos = tracebackED(matriz)
				limite = paso + caminos.pasos.length
				// Marcar camino en edges para visualización
				if (caminos && Array.isArray(caminos.coordenadas)) {
					// activar 'camino' y las flags de flecha solo en las celdas del traceback
					caminos.coordenadas.forEach(([ii, jj], idx) => {
						const e = encontrarCelda(edges, ii, jj);
						if (e) {
							e.camino = 2;
							const pasoDir = caminos.pasos[idx];
							// limpiar flags de flecha previas por si acaso
							e.diagonalF = 0; e.superiorF = 0; e.lateralF = 0;
							if (pasoDir === 'diagonal') e.diagonalF = 1;
							if (pasoDir === 'superior') e.superiorF = 1;
							if (pasoDir === 'lateral') e.lateralF = 1;
						}
					});
				}
			}
		}
		if (paso < limite) {
			if (algoritmo === "sw") {
				avanzar(algoritmo, caminos[0].coordenadas[posicionActualCamino][0], caminos[0].coordenadas[posicionActualCamino][1], caminos[0].pasos[posicionActualCamino])
				posicionActualCamino++
				paso++
			}
			if (algoritmo === "nw" || algoritmo === "ed") {
				avanzar(algoritmo, caminos.coordenadas[posicionActualCamino][0], caminos.coordenadas[posicionActualCamino][1], caminos.pasos[posicionActualCamino])
				posicionActualCamino++
				paso++
				if (paso === limite && (algoritmo === "nw" || algoritmo === "ed")) final = 1
			}
		}
	}
})

document.getElementById("anterior").addEventListener("click", function (event) {
	event.preventDefault()
	if (paso == 1) {
		inicializar(algoritmo)
	}
	else if (paso == 1) {
		inicializar(algoritmo)
	}
	else if (paso == 2) {
		inicializar(algoritmo)
	}
	else if (paso > 2 && paso <= (n - 1) * (m - 1) + 1) {
		anterior(algoritmo, paso - 2)
		paso--
	}
	else if (paso === (n - 1) * (m - 1) + 2) {

		if (algoritmo === "nw" || algoritmo === "ed") {
			edges = borrarCamino(caminos.coordenadas[0][0], caminos.coordenadas[0][1]);
		} else if (algoritmo === "sw") {
			edges = borrarCamino(caminos[0].coordenadas[0][0], caminos[0].coordenadas[0][1]);
		}

		paso = paso - 2
		siguiente(algoritmo, paso)
		paso++
		posicionActualCamino = 0
	}
	else if (paso > 2 && paso > (n - 1) * (m - 1) + 2 && paso <= limite) {
		if (paso === limite && algoritmo === "nw") final = 0

		if (algoritmo === "nw" || algoritmo === "ed") {
			retroceder(algoritmo, caminos.coordenadas[posicionActualCamino - 1][0], caminos.coordenadas[posicionActualCamino - 1][1], paso - 2);
		} else if (algoritmo === "sw") {
			retroceder(algoritmo, caminos[0].coordenadas[posicionActualCamino - 1][0], caminos[0].coordenadas[posicionActualCamino - 1][1], paso - 2);
		}
		posicionActualCamino--
		paso--
	}
	else if (paso === (limite + 1) && algoritmo === "nw") {
		retroceder(algoritmo, 0, 0, paso - 2)
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


modeSwitch.addEventListener("click", () => { //ALTERNAR ALGORITMO
	body.classList.toggle("dark");

	if (body.classList.contains("dark")) {
		modeText.innerText = "Local";
		algoritmo = "sw"
		inicializar(algoritmo)
	} else {
		modeText.innerText = "Global";
		algoritmo = "nw"
		inicializar(algoritmo)
	}
})


const seq1Input = document.getElementById('seq_1');
const seq2Input = document.getElementById('seq_2');
seq1Input.addEventListener('input', convertirMayusculas);
seq2Input.addEventListener('input', convertirMayusculas);


function convertirMayusculas(event) {
	const input = event.target;
	// Normalizar a mayúsculas y permitir solo caracteres A C G T N (y B, D, H, etc si quieres ampliar)
	let valor = input.value.toUpperCase();
	// Filtrar: permitir letras mayúsculas y dígitos '-' y '_', pero típicamente ACGTN
	valor = valor.replace(/[^A-Z\-\_]/g, '');
	input.value = valor;

	// Marcado visual si hay caracteres fuera del alfabeto ACGTN
	const invalid = /[^ACGTN\-\_]/i.test(valor);
	if (invalid) {
		input.classList.add('invalid-seq');
	} else {
		input.classList.remove('invalid-seq');
	}

	// Re-inicializar la visualización al cambiar la secuencia
	try { inicializar(algoritmo); } catch (e) { /* noop */ }
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
		caminosCoordenadas.push({ coordenadas, pasos });
	}

	return caminosCoordenadas;
}

function tracebackNW(matriz) {
	let i = n - 1; // Asume que n es la longitud de seq1
	let j = m - 1 // Asume que m es la longitud de seq2
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


		if (i > 0 && j > 0 && (celdaActual.puntaje == encontrarCelda(matriz, i - 1, j - 1).puntaje + (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchScore))) {
			camino.push(celdaActual);
			coordenadas.push([i, j]);
			pasos.push("diagonal");
			i--;
			j--;
		}

		else if (i > 0 && (celdaActual.puntaje == encontrarCelda(matriz, i - 1, j).puntaje + gapPenalty)) {
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

function tracebackED(matriz) {
	let i = n - 1; // Asume que n es la longitud de seq1
	let j = m - 1 // Asume que m es la longitud de seq2
	const seq1 = $('#seq_1').val()
	const seq2 = $('#seq_2').val()
	let camino = [];
	let coordenadas = [];
	let pasos = [];
	
	// Para ED usamos COSTOS (valores positivos), no puntajes
	const matchCost = 0; // match no tiene costo
	const mismatchCost = Math.abs(parseInt($('#mismatchScore').val(), 10)) || 1; // costo positivo
	const gapCost = Math.abs(parseInt($('#gapScore').val(), 10)) || 1; // costo positivo

	// Intentar obtener DP desde el módulo ED si está disponible
	const ED_DP = (typeof window.getEDMatrix === 'function') ? window.getEDMatrix() : null;

	function puntajeFrom(matrizOrDp, ii, jj) {
		if (!Number.isInteger(ii) || !Number.isInteger(jj) || ii < 0 || jj < 0) return null;
		// Preferir buscar en la matriz de celdas si está
		if (Array.isArray(matrizOrDp)) {
			const c = encontrarCelda(matrizOrDp, ii, jj);
			if (c && c.puntaje !== undefined) return c.puntaje;
		}
		// Si no, usar la DP numérica si existe
		if (ED_DP && ED_DP[ii] && typeof ED_DP[ii][jj] !== 'undefined') return ED_DP[ii][jj];
		return null;
	}

	while (i > 0 || j > 0) {
		const celdaActual = encontrarCelda(matriz, i, j);
		const puntActual = puntajeFrom(matriz, i, j);

		// Obtener puntajes vecinos (diag, up, left) preferentemente desde matriz, sino desde DP
		const puntDiag = (i > 0 && j > 0) ? puntajeFrom(matriz, i - 1, j - 1) : null;
		const puntUp = (i > 0) ? puntajeFrom(matriz, i - 1, j) : null;
		const puntLeft = (j > 0) ? puntajeFrom(matriz, i, j - 1) : null;

		// Si no tenemos información suficiente, rompemos para evitar bucle infinito
		if (puntActual === null) {
			// intentar usar un fallback: si ED_DP no existe, salir
			if (!ED_DP) break;
		}

		// EN EDIT DISTANCE: buscamos el MÍNIMO costo que llevó a la celda actual
		let bestDirection = null;
		let validOptions = [];
		
		// Opción diagonal: costo de sustitución/match
		if (i > 0 && j > 0 && puntDiag !== null) {
			const substitutionCost = (seq1[i - 1] === seq2[j - 1]) ? matchCost : mismatchCost;
			if (Math.abs(puntActual - (puntDiag + substitutionCost)) < 0.0001) {
				validOptions.push({ dir: 'diagonal', fromCost: puntDiag, totalCost: puntDiag + substitutionCost });
			}
		}
		
		// Opción superior: costo de gap (eliminación)
		if (i > 0 && puntUp !== null) {
			if (Math.abs(puntActual - (puntUp + gapCost)) < 0.0001) {
				validOptions.push({ dir: 'superior', fromCost: puntUp, totalCost: puntUp + gapCost });
			}
		}
		
		// Opción lateral: costo de gap (inserción)
		if (j > 0 && puntLeft !== null) {
			if (Math.abs(puntActual - (puntLeft + gapCost)) < 0.0001) {
				validOptions.push({ dir: 'lateral', fromCost: puntLeft, totalCost: puntLeft + gapCost });
			}
		}

		// Seleccionar la opción que viene del MENOR costo de origen
		// En caso de empate en costo de origen, priorizar: diagonal > superior > lateral
		if (validOptions.length > 0) {
			console.log(`[tracebackED] At (${i},${j}) cost=${puntActual}, options:`, validOptions);
			
			validOptions.sort((a, b) => {
				// Primero ordenar por costo de origen (menor es mejor)
				if (Math.abs(a.fromCost - b.fromCost) > 0.0001) {
					return a.fromCost - b.fromCost;
				}
				// En caso de empate, usar prioridad de tipo de movimiento
				const priority = {diagonal: 1, superior: 2, lateral: 3};
				return priority[a.dir] - priority[b.dir];
			});
			
			bestDirection = validOptions[0].dir;
			console.log(`[tracebackED] Chosen direction: ${bestDirection} (from cost: ${validOptions[0].fromCost})`);
		}

		// Ejecutar el movimiento según la dirección elegida
		if (bestDirection === 'diagonal') {
			camino.push(celdaActual || { i, j });
			coordenadas.push([i, j]);
			pasos.push('diagonal');
			i--; j--;
		} else if (bestDirection === 'superior') {
			camino.push(celdaActual || { i, j });
			coordenadas.push([i, j]);
			pasos.push('superior');
			i--;
		} else if (bestDirection === 'lateral') {
			camino.push(celdaActual || { i, j });
			coordenadas.push([i, j]);
			pasos.push('lateral');
			j--;
		} else {
			// Si no hay dirección válida, intentar con fallback o salir
			console.warn('[tracebackED] No valid direction found at', i, j, 'puntActual:', puntActual);
			break;
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


