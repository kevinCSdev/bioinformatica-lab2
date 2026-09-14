/**
 * Core type definitions, enums, and scoring constants for sequence alignment.
 */

export const Direction = Object.freeze({
  NONE: 0,
  DIAGONAL: 1 << 0, // 1: Predecessor (i-1, j-1)
  SUPERIOR: 1 << 1, // 2: Predecessor (i-1, j) - Up
  LATERAL: 1 << 2,  // 4: Predecessor (i, j-1) - Left
  ZERO: 1 << 3      // 8: Local alignment reset to 0 (Smith-Waterman)
});

export const DirectionName = Object.freeze({
  [Direction.NONE]: 'none',
  [Direction.DIAGONAL]: 'diagonal',
  [Direction.SUPERIOR]: 'superior',
  [Direction.LATERAL]: 'lateral',
  [Direction.ZERO]: 'zero'
});

export const AppStatus = Object.freeze({
  IDLE: 'Inactivo',
  INITIALIZED: 'Inicializado',
  COMPUTING: 'Calculando...',
  MATRIX_DONE: 'Matriz Calculada',
  FINISHED: 'Terminado',
  PAUSED: 'Pausado'
});

export const AlgorithmType = Object.freeze({
  NEEDLEMAN_WUNSCH: 'NW',
  SMITH_WATERMAN: 'SW',
  WAGNER_FISCHER: 'ED',
  LCS: 'LCS'
});

export const DefaultScoring = Object.freeze({
  NW: Object.freeze({ match: 1, mismatch: -1, gap: -2 }),
  SW: Object.freeze({ match: 2, mismatch: -1, gap: -2 }),
  ED: Object.freeze({ matchCost: 0, subCost: 1, indelCost: 1 }),
  LCS: Object.freeze({ match: 1, mismatch: 0, gap: 0 })
});
