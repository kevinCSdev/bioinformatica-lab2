import { AppStatus, AlgorithmType, DefaultScoring, Direction } from '../core/Types.js';
import { AlignmentEngine } from '../core/AlignmentEngine.js';

/**
 * Finite State Machine Application Controller
 * Coordinates playback, step forward/backward, variable speed auto-run,
 * instant compute, and reactive UI subscriptions.
 */
export class AppState {
  constructor() {
    this.status = AppStatus.IDLE;
    this.seq1 = '';
    this.seq2 = '';
    this.algorithm = AlgorithmType.NEEDLEMAN_WUNSCH;
    this.scoring = { ...DefaultScoring.NW };

    this.engine = null;
    this.cellOrder = [];
    this.currentStepIndex = -1;
    this.optimalPaths = [];
    this.activePathIndex = 0;

    this.speedMs = 200;
    this.autoRunTimer = null;
    this.listeners = new Set();
  }

  /**
   * Subscribe to state change notifications
   * @param {Function} callback - (state, eventType, payload) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(eventType, payload = {}) {
    for (const listener of this.listeners) {
      try {
        listener(this, eventType, payload);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    }
  }

  /**
   * Initialize or reconfigure alignment engine
   */
  init(seq1, seq2, algorithm = AlgorithmType.NEEDLEMAN_WUNSCH, scoring = null) {
    this.stopAutoRun();

    this.seq1 = (seq1 || '').trim().toUpperCase();
    this.seq2 = (seq2 || '').trim().toUpperCase();
    this.algorithm = algorithm;
    this.scoring = scoring ? { ...scoring } : { ...(DefaultScoring[algorithm] || DefaultScoring.NW) };

    this.engine = new AlignmentEngine(this.seq1, this.seq2, this.scoring, this.algorithm);
    this.engine.initMatrix();
    this.cellOrder = this.engine.getCellOrder();
    this.currentStepIndex = -1;
    this.optimalPaths = [];
    this.activePathIndex = 0;
    this.status = AppStatus.INITIALIZED;

    this._notify('INIT', {
      rows: this.seq1.length + 1,
      cols: this.seq2.length + 1,
      seq1: this.seq1,
      seq2: this.seq2
    });
  }

  /**
   * Advance one cell calculation
   */
  stepForward() {
    if (!this.engine || this.status === AppStatus.FINISHED) return false;

    if (this.currentStepIndex < this.cellOrder.length - 1) {
      this.currentStepIndex++;
      const { i, j } = this.cellOrder[this.currentStepIndex];
      const cellData = this.engine.computeCell(i, j);

      if (this.currentStepIndex === this.cellOrder.length - 1) {
        this.status = AppStatus.MATRIX_DONE;
        this.optimalPaths = this.engine.findOptimalPaths();
        this.status = AppStatus.FINISHED;
        this.stopAutoRun();
        this._notify('COMPLETE', { activeCell: cellData, paths: this.optimalPaths });
      } else {
        this.status = AppStatus.COMPUTING;
        this._notify('STEP_FORWARD', { activeCell: cellData });
      }
      return true;
    }
    return false;
  }

  /**
   * Step backward one cell calculation
   */
  stepBackward() {
    if (!this.engine || this.currentStepIndex < 0) return false;
    this.stopAutoRun();

    const wasFinished = (this.status === AppStatus.FINISHED || this.status === AppStatus.MATRIX_DONE);
    if (wasFinished) {
      this.optimalPaths = [];
      this.activePathIndex = 0;
    }

    const { i, j } = this.cellOrder[this.currentStepIndex];
    // Reset cell state in engine
    this.engine.matrix[i][j] = null;
    this.engine.directions[i][j] = Direction.NONE;
    this.engine.cellDetails[i][j] = null;
    this.engine.isCompleted = false;
    this.optimalPaths = [];

    this.currentStepIndex--;

    if (this.currentStepIndex === -1) {
      this.status = AppStatus.INITIALIZED;
      this._notify('STEP_BACKWARD', { activeCell: null, wasFinished });
    } else {
      this.status = AppStatus.COMPUTING;
      const prevCoord = this.cellOrder[this.currentStepIndex];
      const prevCell = this.engine.getCellDetails(prevCoord.i, prevCoord.j);
      this._notify('STEP_BACKWARD', { activeCell: prevCell, wasFinished });
    }
    return true;
  }

  /**
   * Start auto-run loop
   */
  startAutoRun() {
    if (this.autoRunTimer) return;
    if (this.status === AppStatus.FINISHED) {
      this.reset();
    }

    this.status = AppStatus.COMPUTING;
    this._notify('AUTORUN_START');
    this.autoRunTimer = setInterval(() => {
      const advanced = this.stepForward();
      if (!advanced || this.status === AppStatus.FINISHED) {
        this.stopAutoRun();
      }
    }, this.speedMs);
  }

  /**
   * Pause / stop auto-run
   */
  stopAutoRun() {
    if (this.autoRunTimer) {
      clearInterval(this.autoRunTimer);
      this.autoRunTimer = null;
      if (this.status === AppStatus.COMPUTING) {
        this.status = AppStatus.PAUSED;
      }
      this._notify('AUTORUN_STOP');
    }
  }

  /**
   * Toggle auto-run state
   */
  toggleAutoRun() {
    if (this.autoRunTimer) {
      this.stopAutoRun();
    } else {
      this.startAutoRun();
    }
  }

  /**
   * Instant compute entire matrix and optimal path
   */
  instantCompute() {
    if (!this.engine) return;
    this.stopAutoRun();

    this.engine.computeAll();
    this.currentStepIndex = this.cellOrder.length - 1;
    this.optimalPaths = this.engine.findOptimalPaths();
    this.status = AppStatus.FINISHED;

    const lastCoord = this.cellOrder[this.currentStepIndex];
    const lastCell = lastCoord ? this.engine.getCellDetails(lastCoord.i, lastCoord.j) : null;

    this._notify('INSTANT_COMPLETE', {
      activeCell: lastCell,
      paths: this.optimalPaths
    });
  }

  /**
   * Reset matrix to initialized base state
   */
  reset() {
    this.stopAutoRun();
    if (this.engine) {
      this.engine.initMatrix();
      this.currentStepIndex = -1;
      this.optimalPaths = [];
      this.activePathIndex = 0;
      this.status = AppStatus.INITIALIZED;
      this._notify('RESET');
    }
  }

  /**
   * Set playback speed in milliseconds
   * @param {number} ms
   */
  setSpeed(ms) {
    this.speedMs = Math.max(30, Math.min(1500, ms));
    if (this.autoRunTimer) {
      this.stopAutoRun();
      this.startAutoRun();
    }
    this._notify('SPEED_CHANGE', { speedMs: this.speedMs });
  }

  /**
   * Select active path index among multiple optimal paths
   * @param {number} index
   */
  setActivePathIndex(index) {
    if (index >= 0 && index < this.optimalPaths.length) {
      this.activePathIndex = index;
      this._notify('PATH_CHANGE', {
        activePathIndex: this.activePathIndex,
        path: this.optimalPaths[this.activePathIndex]
      });
    }
  }

  /**
   * Flat matrix data for D3 joins
   */
  getFlatMatrix() {
    if (!this.engine) return [];
    const flat = [];
    const n = this.seq1.length;
    const m = this.seq2.length;

    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= m; j++) {
        flat.push({
          i,
          j,
          score: this.engine.matrix[i][j],
          directions: this.engine.directions[i][j],
          calculated: this.engine.matrix[i][j] !== null
        });
      }
    }
    return flat;
  }

  /**
   * Current active cell coordinates or null
   */
  getActiveCell() {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.cellOrder.length) {
      return this.cellOrder[this.currentStepIndex];
    }
    return null;
  }

  /**
   * Active traceback path coordinates
   */
  getActivePathCoordinates() {
    if (this.optimalPaths.length > 0) {
      const p = this.optimalPaths[this.activePathIndex];
      return p ? p.path || [] : [];
    }
    return [];
  }
}
