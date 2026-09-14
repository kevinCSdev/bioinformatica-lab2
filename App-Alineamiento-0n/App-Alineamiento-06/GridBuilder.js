var GridBuilder = (function () {
	"use strict";
	//Some instance variables
	var mIsFirstCall = true,
		mSelf = null,
		mCurrentPath = [],
		mPathTable = [],
		mCellMap = {},
		mTopSequence = "",
		mSideSequence = "",
		mDomGridTable = null,
		mDomAlignmentTable = null,
		mDomContainer = null,
		mDomResultContainer = null,
		mGapSymbol = "-",
		mIsCustomPathMode = false,
		mMatchScore = 0,
		mMismatchScore = 0,
		mGapScore = 0

	function onCellClicked(dom, x, y) {
		// Convertir las coordenadas de entrada en números enteros
		x = parseInt(x, 10)
		y = parseInt(y, 10)

		// Declarar una variable para el último elemento en el camino actual
		var lastElement = null

		// Verificar si el camino actual no está vacío
		if (mCurrentPath !== null && mCurrentPath.length !== 0) {

			// Obtener el último elemento en el camino actual
			lastElement = mCurrentPath[mCurrentPath.length - 1]

			// Verificar si el elemento DOM en el que se ha hecho clic ya está en el camino
			if (dom.hasClass('in-path')) {

				// Si el camino actual sólo tiene un elemento, limpiar el camino
				if (mCurrentPath.length === 1) {
					mCurrentPath[0].dom.removeClass('in-path')
					mCurrentPath[0].dom.removeClass('is-last')
					mCurrentPath[0].dom.removeAttr('data-index')
					mCurrentPath = []
					onPathUpdate()
					return true
				}

				// Obtener el índice del elemento DOM en el camino
				var indexInPath = parseInt(dom.attr('data-index'), 10)

				// Eliminar todos los elementos del camino a partir del índice del elemento DOM
				for (var i = indexInPath + 1; i < mCurrentPath.length; i++) {
					mCurrentPath[i].dom.removeClass('in-path')
					mCurrentPath[i].dom.removeClass('is-last')
					mCurrentPath[i].dom.removeAttr('data-index')
				}

				// Cortar el camino a partir del índice del elemento DOM
				mCurrentPath.splice(indexInPath + 1, mCurrentPath.length - indexInPath + 1)

				// Marcar el último elemento en el nuevo camino como el último
				mCurrentPath[mCurrentPath.length - 1].dom.addClass('is-last')

				// Actualizar el camino
				onPathUpdate()
				return true;
			}

			// Verificar si el movimiento no es válido, es decir, en una dirección incorrecta
			if (lastElement.x < x || lastElement.y < y) return false
			if (x - lastElement.x < -1 || y - lastElement.y < -1) return false
		}

		// Añadir el elemento DOM al camino
		dom.attr('data-index', mCurrentPath.length)

		// Agregar el elemento al camino actual
		mCurrentPath.push({
			'idx': mCurrentPath.length,
			'x': x,
			'y': y,
			'dom': dom,
			'previous': lastElement
		})

		// Desmarcar el último elemento si existe
		if (lastElement) lastElement.dom.removeClass('is-last')

		// Marcar el elemento DOM como el último en el camino y como parte del camino
		dom.addClass('is-last')
		dom.addClass('in-path')

		// Actualizar el camino
		onPathUpdate()

		// Retornar verdadero si el elemento DOM se ha añadido con éxito al camino
		return true
	}


	function onPathUpdate() {
		// Declaración de las secuencias alineadas como strings vacías
		var alignedTopSeq = ''
		var alignedSideSeq = ''

		// Eliminar la clase 'included' de todos los elementos 'th'
		$('th').removeClass('included')

		// Recorrer el camino actual en orden inverso
		for (var i = mCurrentPath.length - 1; i >= 0; i--) {
			// Definir la celda actual y la siguiente
			var currentCell = mCurrentPath[i]
			var nextCell = (i > 0) ? mCurrentPath[i - 1] : null
				// Definir los caracteres superior y lateral de la celda actual
			var topChar = mTopSequence[currentCell.x]
			var sideChar = mSideSequence[currentCell.y]

			// Si no hay celda siguiente, continuar con la siguiente iteración
			if (!nextCell) continue

			// Si el caracter superior existe y hay movimiento en el eje x, agregar la clase 'included' al elemento 'th' correspondiente
			if (topChar && currentCell.x != nextCell.x) {
				$('#top_seq_' + (currentCell.x)).addClass('included')
			}

			// Si el caracter lateral existe y hay movimiento en el eje y, agregar la clase 'included' al elemento 'th' correspondiente
			if (sideChar && currentCell.y != nextCell.y) {
				$('#side_seq_' + (currentCell.y)).addClass('included')
			}

			// Si hay movimiento diagonal, agregar los caracteres a las secuencias alineadas y continuar con la siguiente iteración
			if (nextCell.x - currentCell.x > 0 && nextCell.y - currentCell.y > 0) {
				alignedTopSeq += topChar
				alignedSideSeq += sideChar
				continue
			}

			// Si hay movimiento horizontal, ajustar el caracter lateral a ser el símbolo de gap
			if (nextCell.x - currentCell.x > 0) sideChar = mGapSymbol

			// Si hay movimiento vertical, ajustar el caracter superior a ser el símbolo de gap
			if (nextCell.y - currentCell.y > 0) topChar = mGapSymbol

			// Agregar los caracteres a las secuencias alineadas
			alignedTopSeq += topChar
			alignedSideSeq += sideChar
		}

		// Eliminar el elemento con id 'alignment'
		$('#alignment').remove()

		// Crear una nueva tabla y asignarla a mDomAlignmentTable
		var $table = $('<table />').attr('id', 'alignment')
		mDomAlignmentTable = $table

		// Inicializar el score en 0
		var score = 0

		// Crear una fila y añadir los caracteres de la secuencia alineada superior, calculando el score a medida que se va
		var $tr = $('<tr />')
		for (var idxTop in alignedTopSeq) {
			var c1 = alignedTopSeq[idxTop]
			var c2 = alignedSideSeq[idxTop]

			// Ajustar el score de acuerdo a si los caracteres son gaps, coinciden o no
			if (c1 === mGapSymbol || c2 === mGapSymbol) score += mGapScore
			else if (c1 === c2) score += mMatchScore
			else score += mMismatchScore

			// Añadir el caracter a la fila
			$tr.append($('<td />').html(c1))
		}
		// Añadir la fila a la tabla
		$table.append($tr)

		// Crear una fila y añadir los caracteres de la secuencia alineada lateral
		$tr = $('<tr />')
		for (var idxSide in alignedSideSeq) $tr.append($('<td />').html(alignedSideSeq[idxSide]))
		$table.append($tr)

		// Crear una fila y añadir el score total
		$tr = $('<tr />')
		$tr.append($('<td colspan="1500" class="score" />').html("Puntaje = " + score))
		$table.append($tr)

		// Añadir la tabla al contenedor de resultados
		mDomResultContainer.append($table)
	}

	function displayTooltip(text, x, y) {
		// Si no existe el elemento #tooltip, se crea y se agrega al inicio del body
		if ($('#tooltip').length === 0) $('body').prepend($('<div />').attr('id', 'tooltip'))
	
		// Se obtiene el objeto del tooltip y se limpia su contenido
		var tt = $('#tooltip').html("")
		var tooltipHeight = 30
	
		// Comprueba si el tooltip se desbordaría por el borde derecho de la ventana
		var xBorder = x + tt.width() + 30
		if (xBorder > $(window).width()) x -= (xBorder - $(window).width())
	
		// Comprueba si el tooltip se desbordaría por el borde inferior de la ventana
		var yBorder = y + tt.height() + 30
		if (yBorder > $(window).height()) y -= (tooltipHeight * 2)
	
		// Añade el texto al tooltip y establece su posición y lo muestra
		tt.append(text)
		tt.css('left', x)
		tt.css('top', y)
		tt.css('display', 'block')
	}
	
	function hideTooltip() {
		// Oculta el tooltip
		$('#tooltip').css('display', 'none')
	}
	
	function showTooltip(x, y) {
		// Obtiene la celda objetivo y crea una tabla
		var targetCell = mCellMap[x + "_" + y]
		var $table = $("<table />")
	
		// Crea la primera fila con los datos de puntuación de la celda diagonal y superior
		var $tr = $("<tr />")
		$tr.append(
			$("<td />").html("<b><u>Puntuación de la celda Diagonal</u></b> <br> " + targetCell.diagonalScoreText)
		).append(
			$("<td />").html("<b><u>Puntuación de la celda superior</u></b> <br> " + targetCell.upScoreText)
		)
		$table.append($tr)
	
		// Crea la segunda fila con los datos de puntuación de la celda lateral y el puntaje ganador
		$tr = $("<tr />")
		$tr.append(
			$("<td />").html("<b><u>Puntuación de la celda lateral</u></b> <br> " + targetCell.sideScoreText)
		).append(
			$("<td />").html("Puntaje (máximo) ganador es " + targetCell.winningScore)
		);
		$table.append($tr);
	
		// Resalta las celdas relacionadas
		$('#' + (x - 1) + '_' + (y - 1)).addClass('highlight')
		$('#' + (x - 0) + '_' + (y - 1)).addClass('highlight')
		$('#' + (x - 1) + '_' + (y - 0)).addClass('highlight')
	
		// Resalta la celda objetivo y muestra el tooltip en su posición
		var targetDom = $('#' + x + '_' + y)
		var pos = targetDom.offset()
		targetDom.addClass('highlight-main')
		displayTooltip($table, pos.left + targetDom.width() + 10, pos.top - targetDom.height() / 2)
	}
	
	function getCssClassesFromDirection(directions) {
		// Inicializa un string vacío para las clases CSS
		var cssClasses = ""
	
		// Si 'directions' no es un array, retorna el string vacío
		if (!Array.isArray(directions)) return cssClasses
	
		// Une los elementos del array 'directions' en un string, separados por espacios, y lo guarda en 'cssClasses'
		cssClasses = directions.join(' ')
	
		// Retorna las clases CSS
		return cssClasses
	}
	

	function constructNRow(n) {
		// Obtiene el elemento de la tabla
		var $table = $('#grid')
	
		// Convierte el parámetro n a un número entero y le resta 1 para el índice
		var charIndex = parseInt(n, 10) - 1
	
		// Crea una nueva fila
		var $tr = $('<tr />')
		var $th = null
	
		// Si el índice es mayor o igual a 0, crea un encabezado de tabla con la secuencia lateral
		if (charIndex >= 0) {
			$th = $('<th />')
				.addClass("seq-header")
				.addClass("side-header")
				.attr('id', 'side_seq_' + charIndex)
				.html(mSideSequence[charIndex])
			$tr.append($th)
		}
		else {
			// Si el índice es menor que 0, crea un encabezado de tabla vacío
			$th = $('<th />')
			$tr.append($th)
		}
	
		// Crea una celda con la puntuación ganadora para la posición actual
		var $td = $('<td />')
			.html(mCellMap[0 + "_" + n].winningScore)
			.attr('data-x', 0)
			.attr('data-y', n)
			.attr('id', 0 + "_" + n);
		$tr.append($td);
	
		// Itera sobre la secuencia superior y crea una celda para cada carácter
		for (var idx in mTopSequence) {
			idx = parseInt(idx, 10)
			var dataPointIndex = (idx + 1) + '_' + (charIndex + 1)
	
			var cssClasses = ""
			if (n > 0) {
				// Obtiene las clases CSS basadas en la dirección de la celda si n es mayor que 0
				cssClasses = getCssClassesFromDirection(mCellMap[(idx + 1) + "_" + (charIndex + 1)].direction)
			}
	
			// Crea una celda con la puntuación ganadora y atributos relacionados
			$td = $('<td />')
				.addClass(cssClasses)
				.html(mCellMap[dataPointIndex].winningScore)
				.attr('data-x', (idx + 1))
				.attr('data-y', (charIndex + 1))
				.attr('data-dg', mCellMap[dataPointIndex].diagonalScoreText)
				.attr('data-up', mCellMap[dataPointIndex].upScoreText)
				.attr('data-sd', mCellMap[dataPointIndex].sideScoreText)
				.attr('id', dataPointIndex)
			$tr.append($td)
		}
	
		// Añade la fila a la tabla y añade la tabla al contenedor
		$table.append($tr)
		mDomContainer.append($table)
	}
	

	function constructGrid() {

		// Elimina los elementos con id 'alignment' y 'grid' si existen
		$('#alignment').remove()
		$('#grid').remove()

		// Crea una nueva tabla HTML con el id 'grid'
		var $table = $('<table />').attr('id', 'grid')
		mDomGridTable = $table

		// Añade la tabla al contenedor DOM
		mDomContainer.append($table)

		// Crea la primera fila de la tabla para las secuencias de la parte superior
		var $tr = $('<tr />')
		var $th = $('<th />')
		$tr.append($th)
		$th = $('<th />')
		$tr.append($th)

		for (var idx in mTopSequence) {
			$th = $('<th />')
			$th.attr('id', 'top_seq_' + idx)
			$th.addClass("seq-header")
			$th.addClass("top-header")
			$th.html(mTopSequence[idx])
			$tr.append($th)
		}

		$table.append($tr)

		// Construye el resto de las filas para las secuencias laterales
		for (var i = 0; i < mSideSequence.length + 1; i++) {
			constructNRow(i)
		}

		// Agrega un manejador de eventos de clic para cada celda
		$('#grid td').click(function () {
			var self = $(this)
			onCellClicked(
				self,
				self.attr('data-x'),
				self.attr('data-y')
			);
		});

		// Agrega manejadores de eventos hover para cada celda
		$('#grid td').hover(function () {

			// Si estamos en el modo de camino personalizado, no hagas nada
			if (mIsCustomPathMode) {
				return;
			}

			var self = $(this)
			var x = self.attr('data-x')
			var y = self.attr('data-y')

			if (x < 1 || y < 1) return

			// Destaca las celdas correspondientes en la cuadrícula
			$("#side_seq_" + (y - 1)).addClass('highlight')
			$("#top_seq_" + (x - 1)).addClass('highlight')

			// Muestra un tooltip con la información relevante
			showTooltip(x, y)

		}, function () {
			// Cuando el mouse deja de pasar por encima, quita el resaltado y oculta el tooltip
			$(".seq-header").removeClass('highlight')
			$('#grid td').removeClass('highlight')
			$('#grid td').removeClass('highlight-main')
			hideTooltip()
		})

		// Agrega manejadores de eventos hover para cada cabecera de la cuadrícula
		$('#grid th').hover(function () {
			var self = $(this)
			if (!self.hasClass("seq-header")) return
			var pos = self.offset();
			var topMargin = self.hasClass("side-header") ? self.height() / 4 : self.height() + 4;
			var leftMargin = self.hasClass("side-header") ? self.width() + 4 : 0;
			var text = self.hasClass("included") ? "Incluido en la alineación" : "No incluido en la alineación"
				// Muestra un tooltip con la información relevante
			displayTooltip(text, pos.left + leftMargin, pos.top + topMargin)

		}, function () {
			hideTooltip() // Cuando el mouse deja de pasar por encima, oculta el tooltip
		})
	}
	mSelf = {
		// Función para resaltar la ruta óptima en la matriz de alineamiento
		highlightOptimal: function () {
			// Deshabilita el modo de ruta personalizada
			mIsCustomPathMode = false

			// Define el ancho y alto de la matriz
			var width = mTopSequence.length + 1
			var height = mSideSequence.length + 1

			// Inicia en la esquina inferior derecha de la matriz
			var currentX = width - 1
			var currentY = height - 1

			// Mientras no se llegue a la esquina superior izquierda
			while (currentX > -1 && currentY > -1) {
				// Selecciona la celda actual
				var currentCell = mCellMap[currentX + '_' + currentY]

				// Selecciona el elemento DOM actual
				var currentDom = $('#' + currentX + '_' + currentY)

				// Simula un clic en el elemento DOM actual
				currentDom.click()

				// Inicializa la dirección
				var direction = null

				// Obtiene la última dirección de la celda actual
				if (currentCell.direction) direction = currentCell.direction[currentCell.direction.length - 1]

				// Si la dirección no está definida, verifica si está en la primera columna o fila
				if (direction === null) {
					if (currentX == 0) direction = 'u'; // Arriba
					if (currentY == 0) direction = 's'; // Lado
				}

				// Cambia la posición actual según la dirección side, upper, diagona
				switch (direction) {
				case 's':
					currentX--;
					break; // Mover a la izquierda
				case 'u':
					currentY--;
					break; // Mover hacia arriba
				default:
				case 'd': // Mover en diagonal
					currentX--;
					currentY--;
					break;
				}
			}
		},

		// Función para iniciar la ruta personalizada
		startCustomPath: function () {
			// Reconstruye la tabla y habilita el modo de ruta personalizada
			this.rebuildTable(mDomContainer, mDomResultContainer, mMatchScore, mMismatchScore, mGapScore, mSideSequence, mTopSequence);
			mIsCustomPathMode = true;
		},

		// Función para reconstruir la tabla de alineamiento
		rebuildTable: function (domContainer, resultContainer, matchScore, mismatchScore, gapScore, seqSide, seqTop) {
			// Si es la primera llamada, agrega un evento de movimiento del mouse
			if (mIsFirstCall) {
				$(window).mousemove(function (e) {
					window.mouseXPos = e.pageX;
					window.mouseYPos = e.pageY;
				});
				mIsFirstCall = false;
			}

			// Convierte las secuencias a mayúsculas
			seqTop = seqTop.toUpperCase();
			seqSide = seqSide.toUpperCase();

			// Inicializa la ruta actual y guarda las variables proporcionadas
			mCurrentPath = [];
			mDomContainer = domContainer;
			mDomResultContainer = resultContainer;
			mTopSequence = seqTop;
			mSideSequence = seqSide;
			mMatchScore = matchScore;
			mMismatchScore = mismatchScore;
			mGapScore = gapScore;

			// Define el ancho y alto de la matriz
			var width = mTopSequence.length + 1;
			var height = mSideSequence.length + 1;

			// Itera a través de las celdas de la matriz
			for (var i = 0; i < width; i++) {
				mPathTable[i] = [];
				for (var j = 0; j < height; j++) {
					// Define las celdas de la primera columna y fila
					if (i === 0 && j === 0) {
						mPathTable[i][j] = 0;
						mCellMap[i + "_" + j] = {
							'winningScore': mPathTable[i][j]
						};
						continue
					}

					if (i === 0) {
						mPathTable[i][j] = j * gapScore;
						mCellMap[i + "_" + j] = {
							'winningScore': mPathTable[i][j]
						}
						continue
					}

					if (j === 0) {
						mPathTable[i][j] = i * gapScore;
						mCellMap[i + "_" + j] = {
							'winningScore': mPathTable[i][j]
						}
						continue
					}

					// Si no es la primera columna ni fila, calcula la puntuación y la dirección de la celda
					var isMatch = mTopSequence[i - 1] === mSideSequence[j - 1]
					var comparisonScore = isMatch ? matchScore : mismatchScore

					// Calcula las puntuaciones para los movimientos hacia arriba, a la izquierda y en diagonal
					var moveUpScore = mPathTable[i][j - 1] + gapScore
					var moveSdScore = mPathTable[i - 1][j] + gapScore
					var moveDgScore = parseInt(comparisonScore, 10) + parseInt(mPathTable[i - 1][j - 1])

					// Asigna la puntuación de la celda
					mPathTable[i][j] = data['steps'][actualStep]['matrix'][j][i]

					// Inicializa la dirección
					var direction = []

					// Asigna la dirección basándose en las puntuaciones de los movimientos
					if (mPathTable[i][j] === moveDgScore) direction.push('d')
					if (mPathTable[i][j] === moveUpScore) direction.push('u')
					if (mPathTable[i][j] === moveSdScore) direction.push('s')

					// Guarda la información de la celda en mCellMap
					mCellMap[i + "_" + j] = {
						'sideScoreText': mPathTable[i - 1][j] + " + " + gapScore + " (Puntaje de gap) = " + moveSdScore,
						'upScoreText': mPathTable[i][j - 1] + " + " + gapScore + " (Puntaje de gap) = " + moveUpScore,
						'diagonalScoreText': mPathTable[i - 1][j - 1] + " + " +
							parseInt(comparisonScore, 10) +
							" (Debido a " + (isMatch ? "ajuste" : "desajuste") +
							" entre " + mTopSequence[i - 1] + " & " + mSideSequence[j - 1] + ") " +
							" = " +
							moveDgScore,
						'sideScore': moveSdScore,
						'upScore': moveUpScore,
						'diagonalScore': moveDgScore,
						'winningScore': mPathTable[i][j],
						'direction': direction
					}
				}
			}
			constructGrid()
		}
	}
	return mSelf
}())
