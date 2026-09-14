// auto-run.js
(function () {
    // Estado interno del auto-run para no duplicar timers
    let autoTimer = null;
    let isAutoRunning = false;

    // Helper: presionar el botón "Siguiente" programáticamente
    function pressNext() {
        const btn = document.getElementById('siguiente');
        if (btn) btn.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    }

    // Fase 1: completar matriz
    function needFillMatrix() {
        // n, m, paso son globales definidos por tu app
        if (typeof n === 'undefined' || typeof m === 'undefined') return false;
        return (typeof paso !== 'undefined') && (paso <= (n - 1) * (m - 1));
    }

    // Fase 2: disparar cálculo de traceback (el paso inmediatamente siguiente)
    function needTriggerTraceback() {
        if (typeof n === 'undefined' || typeof m === 'undefined') return false;
        return (typeof paso !== 'undefined') && (paso === (n - 1) * (m - 1) + 1);
    }

    // Fase 3: recorrer traceback (hasta 'limite')
    function needRunTraceback() {
        if (typeof limite === 'undefined') return false;
        return (typeof paso !== 'undefined') && (paso < limite);
    }

    // Fin (para NW se marca con final===1 al llegar a paso===limite)
    function isFinished() {
        // Si no existen aún, asumimos que no terminó
        if (typeof final === 'undefined' || typeof limite === 'undefined' || typeof paso === 'undefined') return false;
        // Caso general: cuando ya no hace falta ni matriz, ni trigger, ni traceback
        const noMatrix = !needFillMatrix();
        const noTrigger = !needTriggerTraceback();
        const noTraceback = !needRunTraceback();
        // Para NW se usa 'final===1', pero para ambos basta con que no falte ninguna fase
        return noMatrix && noTrigger && noTraceback && (final === 1 || true);
    }

    // ---------- RESOLVER (AUTO) ----------
    document.getElementById('resolver')?.addEventListener('click', function (ev) {
        ev.preventDefault();

        // Si ya está corriendo, no duplicar
        if (isAutoRunning) return;

        // Asegurar que no nos resetee nada (estos botones NO tienen .btn-compute)
        isAutoRunning = true;

        // Velocidad del auto (ms entre “clicks”)
        const SPEED = 60;

        autoTimer = setInterval(() => {
            try {
                if (needFillMatrix() || needTriggerTraceback() || needRunTraceback()) {
                    pressNext();
                } else if (isFinished()) {
                    clearInterval(autoTimer);
                    autoTimer = null;
                    isAutoRunning = false;
                } else {
                    // Plan B: si por alguna razón no encaja en los checks, seguimos 1 paso:
                    pressNext();
                }
            } catch (e) {
                console.error('[auto-run] Error durante ejecución automática:', e);
                clearInterval(autoTimer);
                autoTimer = null;
                isAutoRunning = false;
            }
        }, SPEED);
    });

    // ---------- RESOLUCIÓN INSTANTÁNEA ----------
    document.getElementById('instant')?.addEventListener('click', function (ev) {
        ev.preventDefault();

        // Cortar auto si estuviera corriendo
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
            isAutoRunning = false;
        }

        // 1) Completar la matriz de un tirón
        //    (aprieta “siguiente” hasta llenar todas las celdas)
        try {
            let guard = 0;
            const MAX_GUARD = 100000; // evita bucles infinitos en caso de error

            // Si el algoritmo es ED, en lugar de presionar NEXT muchas veces calculamos la matriz de una
            // vez con la función de inicialización para ED (si existe), y fijamos paso para que el
            // siguiente click dispare el traceback.
            const algoSelect = document.getElementById('algoSelect');
            const algo = algoSelect ? algoSelect.value : null;
            if (algo === 'ed' && typeof window.inicializacionED === 'function' && typeof n !== 'undefined' && typeof m !== 'undefined') {
                // Generar edges finales vía inicializacionED
                const seq1 = document.getElementById('seq_1') ? document.getElementById('seq_1').value : '';
                const seq2 = document.getElementById('seq_2') ? document.getElementById('seq_2').value : '';
                // algunos flujos esperan que inicializacionED retorne edges
                try { edges = window.inicializacionED(edges || [], seq1, seq2); } catch (e) { /* ignore */ }

                // Avanzar paso al final de la fase de llenado para que el siguiente click dispare traceback
                paso = (seq1.length) * (seq2.length);
                // Un click para disparar la fase de traceback
                pressNext();

                // y ahora recorrer el traceback
                guard = 0;
                while (needRunTraceback() && guard < MAX_GUARD) {
                    pressNext();
                    guard++;
                }
            } else {
                while (needFillMatrix() && guard < MAX_GUARD) {
                    pressNext();
                    guard++;
                }

                // 2) Disparar el traceback (un click más, tu app calcula 'limite')
                pressNext();

                // 3) Recorrer todo el traceback
                guard = 0;
                while (needRunTraceback() && guard < MAX_GUARD) {
                    pressNext();
                    guard++;
                }
            }

            // (Para NW normalmente aquí 'final' pasa a 1; si no, ya no faltan fases)
        } catch (e) {
            console.error('[auto-run] Error en resolución instantánea:', e);
        }
    });
})();
