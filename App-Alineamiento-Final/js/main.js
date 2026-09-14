import { AppState } from './state/AppState.js';
import { D3Renderer } from './ui/D3Renderer.js';
import { MathPanel } from './ui/MathPanel.js';
import { SummaryPanel } from './ui/SummaryPanel.js';
import { AlgorithmType, DefaultScoring } from './core/Types.js';

/**
 * Main Application Bootstrap and DOM Wiring (Base App Aesthetic)
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM References - Sidebar & Toggle
  const sidebar = document.querySelector('nav.sidebar');
  const toggle = sidebar.querySelector('.toggle');
  // Inputs & Labels
  const seq1Input = document.getElementById('seq_1');
  const seq2Input = document.getElementById('seq_2');
  const algoSelect = document.getElementById('algo-select');
  const matchScoreInput = document.getElementById('matchScore');
  const mismatchScoreInput = document.getElementById('mismatchScore');
  const gapScoreInput = document.getElementById('gapScore');

  const labelMatch = document.getElementById('label-match');
  const labelMismatch = document.getElementById('label-mismatch');
  const labelGap = document.getElementById('label-gap');

  // Buttons
  const calculateButton = document.getElementById('calculateButton');
  const btnPrev = document.getElementById('anterior');
  const btnNext = document.getElementById('siguiente');
  const btnAutoRun = document.getElementById('autoRunButton');
  const autorunLabel = document.getElementById('autorun-label');
  const autorunIcon = document.getElementById('autorun-icon');
  const btnFinal = document.getElementById('finalButton');
  const btnReset = document.getElementById('resetButton');

  const speedSlider = document.getElementById('speed-slider');
  const speedLabel = document.getElementById('speed-label');
  const playbackStatus = document.getElementById('playback-status');
  const activeAlgoBadge = document.getElementById('active-algo-badge');
  const exampleSelect = document.getElementById('example-select');

  // Instantiate Core Components
  const appState = new AppState();
  const mathPanel = new MathPanel('#math-panel-container');
  const summaryPanel = new SummaryPanel('#summary-panel-container', {
    onPathChange: (index) => {
      appState.setActivePathIndex(index);
    }
  });

  const renderer = new D3Renderer('#matrix-canvas-container', {
    onCellHover: (cell) => {
      if (cell && cell.calculated && appState.engine) {
        const details = appState.engine.getCellDetails(cell.i, cell.j);
        if (details) {
          mathPanel.update(details, appState.algorithm, appState.scoring);
        }
      }
    },
    onCellClick: (cell) => {
      if (cell && cell.calculated && appState.engine) {
        const details = appState.engine.getCellDetails(cell.i, cell.j);
        if (details) {
          mathPanel.update(details, appState.algorithm, appState.scoring);
        }
      }
    }
  });

  const algoDisplayNames = {
    [AlgorithmType.NEEDLEMAN_WUNSCH]: 'Global: Needleman-Wunsch',
    [AlgorithmType.SMITH_WATERMAN]: 'Local: Smith-Waterman',
    [AlgorithmType.WAGNER_FISCHER]: 'Wagner-Fischer (Edit Distance)',
    [AlgorithmType.LCS]: 'Longest Common Subsequence (LCS)'
  };

  /**
   * Toggle collapsible sidebar
   */
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('close');
    });
  }

  /**
   * Update scoring input labels & defaults based on algorithm
   */
  function updateScoringInputs(algorithm) {
    const defaults = DefaultScoring[algorithm] || DefaultScoring.NW;

    if (algorithm === AlgorithmType.WAGNER_FISCHER) {
      if (labelMatch) labelMatch.textContent = 'Costo Coincidencia';
      if (labelMismatch) labelMismatch.textContent = 'Costo Sustitución';
      if (labelGap) labelGap.textContent = 'Costo Indel';

      matchScoreInput.placeholder = 'Costo Coincidencia (0)';
      matchScoreInput.value = defaults.matchCost ?? 0;
      mismatchScoreInput.placeholder = 'Costo Sustitución (1)';
      mismatchScoreInput.value = defaults.subCost ?? 1;
      gapScoreInput.placeholder = 'Costo Indel (1)';
      gapScoreInput.value = defaults.indelCost ?? 1;
    } else if (algorithm === AlgorithmType.LCS) {
      if (labelMatch) labelMatch.textContent = 'Coincidencia (Match)';
      if (labelMismatch) labelMismatch.textContent = 'Discrepancia (Mismatch)';
      if (labelGap) labelGap.textContent = 'Penalización Gap';

      matchScoreInput.placeholder = 'Match (1)';
      matchScoreInput.value = 1;
      mismatchScoreInput.placeholder = 'Mismatch (0)';
      mismatchScoreInput.value = 0;
      gapScoreInput.placeholder = 'Gap (0)';
      gapScoreInput.value = 0;
    } else {
      if (labelMatch) labelMatch.textContent = 'Coincidencia (Match)';
      if (labelMismatch) labelMismatch.textContent = 'Discrepancia (Mismatch)';
      if (labelGap) labelGap.textContent = 'Penalización Gap';

      matchScoreInput.placeholder = 'Coincidencia (Match)';
      matchScoreInput.value = defaults.match ?? 1;
      mismatchScoreInput.placeholder = 'Discrepancia (Mismatch)';
      mismatchScoreInput.value = defaults.mismatch ?? -1;
      gapScoreInput.placeholder = 'Penalización Gap';
      gapScoreInput.value = defaults.gap ?? -2;
    }
  }

  /**
   * Read scoring parameters from UI
   */
  function getScoringFromUI() {
    const algo = algoSelect.value;
    if (algo === AlgorithmType.WAGNER_FISCHER) {
      return {
        matchCost: Number(matchScoreInput.value || 0),
        subCost: Number(mismatchScoreInput.value || 1),
        indelCost: Number(gapScoreInput.value || 1)
      };
    } else if (algo === AlgorithmType.LCS) {
      return { match: 1, mismatch: 0, gap: 0 };
    }
    return {
      match: Number(matchScoreInput.value || 1),
      mismatch: Number(mismatchScoreInput.value || -1),
      gap: Number(gapScoreInput.value || -2)
    };
  }

  /**
   * Reinitialize state and matrix
   */
  function reinitialize() {
    const s1 = (seq1Input.value || 'AAG').trim().toUpperCase();
    const s2 = (seq2Input.value || 'AAG').trim().toUpperCase();
    const algo = algoSelect.value;
    const scoring = getScoringFromUI();

    appState.init(s1, s2, algo, scoring);
  }

  // AppState Event Subscription
  appState.subscribe((state, eventType, payload) => {
    playbackStatus.textContent = state.status;
    activeAlgoBadge.innerHTML = `<i class='bx bx-chip'></i> ${algoDisplayNames[state.algorithm] || state.algorithm}`;

    if (eventType === 'INIT') {
      renderer.mount(payload.rows, payload.cols, payload.seq1, payload.seq2);
      renderer.updateMatrixCells(state.getFlatMatrix(), null, []);
      mathPanel.renderEmpty();
      summaryPanel.renderEmpty();
    } else if (eventType === 'STEP_FORWARD' || eventType === 'STEP_BACKWARD') {
      renderer.clearTraceback();
      if (state.optimalPaths.length === 0) {
        summaryPanel.renderEmpty();
      }
      const active = payload.activeCell;
      renderer.updateMatrixCells(state.getFlatMatrix(), active, []);
      if (active) {
        mathPanel.update(active.details || active, state.algorithm, state.scoring);
      } else {
        mathPanel.renderEmpty();
      }
    } else if (eventType === 'COMPLETE' || eventType === 'INSTANT_COMPLETE') {
      const active = payload.activeCell;
      const pathCoords = state.getActivePathCoordinates();
      renderer.updateMatrixCells(state.getFlatMatrix(), active, pathCoords);
      renderer.renderTracebackArrow(pathCoords);
      if (active) {
        mathPanel.update(active.details || active, state.algorithm, state.scoring);
      }
      summaryPanel.render(state.optimalPaths, state.activePathIndex);
    } else if (eventType === 'RESET') {
      renderer.updateMatrixCells(state.getFlatMatrix(), null, []);
      renderer.clearTraceback();
      mathPanel.renderEmpty();
      summaryPanel.renderEmpty();
    } else if (eventType === 'AUTORUN_START') {
      autorunIcon.className = 'bx bx-pause icon';
      autorunLabel.textContent = 'Pausar';
    } else if (eventType === 'AUTORUN_STOP') {
      autorunIcon.className = 'bx bx-play icon';
      autorunLabel.textContent = 'Auto Ejecutar';
    } else if (eventType === 'PATH_CHANGE') {
      const pathCoords = state.getActivePathCoordinates();
      renderer.updateMatrixCells(state.getFlatMatrix(), state.getActiveCell(), pathCoords);
      renderer.renderTracebackArrow(pathCoords);
    }
  });

  // Event Listeners
  seq1Input.addEventListener('input', () => {
    seq1Input.value = seq1Input.value.toUpperCase();
    if (exampleSelect) exampleSelect.value = '';
  });

  seq2Input.addEventListener('input', () => {
    seq2Input.value = seq2Input.value.toUpperCase();
    if (exampleSelect) exampleSelect.value = '';
  });

  // Stepper Buttons (+ / -) for Score Adjustments
  const stepperButtons = document.querySelectorAll('.stepper-btn');
  stepperButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const step = Number(input.getAttribute('step') || 1);
      let val = Number(input.value || 0);

      if (btn.classList.contains('stepper-btn-inc')) {
        val += step;
      } else if (btn.classList.contains('stepper-btn-dec')) {
        val -= step;
      }

      input.value = val;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      reinitialize();
    });
  });

  // Manual change listeners for scoring inputs
  [matchScoreInput, mismatchScoreInput, gapScoreInput].forEach(input => {
    if (input) {
      input.addEventListener('change', () => {
        reinitialize();
      });
    }
  });

  algoSelect.addEventListener('change', () => {
    updateScoringInputs(algoSelect.value);
    reinitialize();
  });

  calculateButton.addEventListener('click', (e) => {
    e.preventDefault();
    reinitialize();
  });

  btnPrev.addEventListener('click', (e) => {
    e.preventDefault();
    appState.stepBackward();
  });

  btnNext.addEventListener('click', (e) => {
    e.preventDefault();
    appState.stepForward();
  });

  btnAutoRun.addEventListener('click', (e) => {
    e.preventDefault();
    appState.toggleAutoRun();
  });

  btnFinal.addEventListener('click', (e) => {
    e.preventDefault();
    appState.instantCompute();
  });

  btnReset.addEventListener('click', (e) => {
    e.preventDefault();
    if (exampleSelect) exampleSelect.value = '';
    appState.reset();
  });

  speedSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    speedLabel.textContent = `${val}ms`;
    appState.setSpeed(val);
  });

  // Canonical Examples Dictionary
  const CANONICAL_EXAMPLES = {
    tc1: { s1: 'AGTC', s2: 'AGTC', algo: 'NW' },
    tc2: { s1: 'AGTC', s2: 'AGAC', algo: 'NW' },
    tc3: { s1: 'AGTC', s2: 'AGC', algo: 'NW' },
    tc4: { s1: 'ACGTACGT', s2: 'CG', algo: 'NW' },
    tc5: { s1: 'AAAA', s2: 'CCCC', algo: 'NW' },
    tc6: { s1: 'AGC', s2: 'ACG', algo: 'NW' },
    ex_gdle: { s1: 'GDLE', s2: 'GGLED', algo: 'NW' },
    ex_gaccta: { s1: 'GACCTA', s2: 'GGTACC', algo: 'NW' }
  };

  // Dropdown selector de ejemplos canónicos
  if (exampleSelect) {
    exampleSelect.addEventListener('change', () => {
      const selectedKey = exampleSelect.value;
      const example = CANONICAL_EXAMPLES[selectedKey];
      if (!example) return;

      seq1Input.value = example.s1;
      seq2Input.value = example.s2;
      if (example.algo) {
        algoSelect.value = example.algo;
        updateScoringInputs(example.algo);
      }
      reinitialize();
    });
  }

  // Keyboard Shortcuts (Space: auto-run, ArrowRight: next, ArrowLeft: prev)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      appState.toggleAutoRun();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      appState.stepForward();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      appState.stepBackward();
    }
  });

  // Initial Boot
  updateScoringInputs(algoSelect.value);
  reinitialize();
});
