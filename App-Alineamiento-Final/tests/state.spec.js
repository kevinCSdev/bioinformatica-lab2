import assert from 'assert';
import { AppState } from '../js/state/AppState.js';
import { AlgorithmType, AppStatus } from '../js/core/Types.js';

console.log('Testing AppState FSM...');

const state = new AppState();
state.init('AGTC', 'AGTC', AlgorithmType.NEEDLEMAN_WUNSCH);
assert.strictEqual(state.status, AppStatus.INITIALIZED);
assert.strictEqual(state.cellOrder.length, 16);
assert.strictEqual(state.currentStepIndex, -1);

// Step forward
const fwd1 = state.stepForward();
assert.strictEqual(fwd1, true);
assert.strictEqual(state.currentStepIndex, 0);
assert.strictEqual(state.status, AppStatus.COMPUTING);

// Step backward
const back1 = state.stepBackward();
assert.strictEqual(back1, true);
assert.strictEqual(state.currentStepIndex, -1);
assert.strictEqual(state.status, AppStatus.INITIALIZED);

// Instant compute
state.instantCompute();
assert.strictEqual(state.status, AppStatus.FINISHED);
assert.strictEqual(state.optimalPaths.length, 1);
assert.strictEqual(state.optimalPaths[0].alignment_s1, 'AGTC');
assert.strictEqual(state.optimalPaths[0].alignment_s2, 'AGTC');
assert.strictEqual(state.optimalPaths[0].score, 4);

// Flat matrix
const flat = state.getFlatMatrix();
assert.strictEqual(flat.length, 25); // (4+1) * (4+1)

// Reset
state.reset();
assert.strictEqual(state.status, AppStatus.INITIALIZED);
assert.strictEqual(state.currentStepIndex, -1);

// Asymmetric TC4
state.init('ACGTACGT', 'CG', AlgorithmType.NEEDLEMAN_WUNSCH);
state.instantCompute();
assert.strictEqual(state.optimalPaths[0].alignment_s1, 'ACGTACGT');
assert.strictEqual(state.optimalPaths[0].alignment_s2, '-----CG-');
assert.strictEqual(state.optimalPaths[0].score, -10);

// Test b) stepBackward() from FINISHED state clears optimalPaths and returns to COMPUTING
console.log('Verifying: stepBackward() from FINISHED state (instantCompute)...');
const finishState = new AppState();
let lastEventType = null;
let lastPayload = null;
finishState.subscribe((st, evt, payload) => {
  lastEventType = evt;
  lastPayload = payload;
});

finishState.init('AAG', 'AAG', AlgorithmType.NEEDLEMAN_WUNSCH);
finishState.instantCompute();
assert.strictEqual(finishState.status, AppStatus.FINISHED);
assert.strictEqual(finishState.optimalPaths.length, 1);
assert.strictEqual(finishState.getActivePathCoordinates().length > 0, true);

const steppedBack = finishState.stepBackward();
assert.strictEqual(steppedBack, true, 'stepBackward must succeed from FINISHED');
assert.strictEqual(finishState.status, AppStatus.COMPUTING, 'Status must return to COMPUTING after stepBackward from FINISHED');
assert.deepStrictEqual(finishState.optimalPaths, [], 'optimalPaths must be empty array after stepBackward from FINISHED');
assert.strictEqual(finishState.getActivePathCoordinates().length, 0, 'Active path coordinates must be empty');
assert.strictEqual(lastEventType, 'STEP_BACKWARD', 'Event type must be STEP_BACKWARD');
assert.strictEqual(lastPayload.wasFinished, true, 'Event payload wasFinished must be true');

// Ensure the last cell in the engine was wiped to null
const lastCoord = finishState.cellOrder[finishState.cellOrder.length - 1];
assert.strictEqual(finishState.engine.matrix[lastCoord.i][lastCoord.j], null, 'Last cell in engine must be null');
assert.strictEqual(finishState.engine.directions[lastCoord.i][lastCoord.j], 0, 'Last cell directions must be 0');
assert.strictEqual(finishState.engine.cellDetails[lastCoord.i][lastCoord.j], null, 'Last cell details must be null');
console.log('  [PASS] stepBackward() after instantCompute()');

// Also test b) stepBackward() after reaching FINISHED via stepForward()
console.log('Verifying: stepBackward() from FINISHED state (via stepForward)...');
const stepState = new AppState();
stepState.init('AA', 'A', AlgorithmType.NEEDLEMAN_WUNSCH); // 2 cells: (1,1) and (2,1)
stepState.stepForward(); // cell 1
assert.strictEqual(stepState.status, AppStatus.COMPUTING);
stepState.stepForward(); // cell 2 (final)
assert.strictEqual(stepState.status, AppStatus.FINISHED);
assert(stepState.optimalPaths.length >= 1);

const steppedBackStep = stepState.stepBackward();
assert.strictEqual(steppedBackStep, true);
assert.strictEqual(stepState.status, AppStatus.COMPUTING);
assert.deepStrictEqual(stepState.optimalPaths, []);
assert.strictEqual(stepState.getActivePathCoordinates().length, 0);
console.log('  [PASS] stepBackward() after stepForward() completion');

console.log('AppState FSM tests PASSED!');

// Test Spanish status enum values
console.log('Verifying: Spanish AppStatus values...');
assert.strictEqual(AppStatus.INITIALIZED, 'Inicializado');
assert.strictEqual(AppStatus.COMPUTING, 'Calculando...');
assert.strictEqual(AppStatus.MATRIX_DONE, 'Matriz Calculada');
assert.strictEqual(AppStatus.FINISHED, 'Terminado');
assert.strictEqual(AppStatus.PAUSED, 'Pausado');
console.log('  [PASS] Spanish AppStatus values verified');

// Test autoRun pause behavior
console.log('Verifying: AutoRun PAUSED state...');
const pauseState = new AppState();
pauseState.init('AG', 'AG', AlgorithmType.NEEDLEMAN_WUNSCH);
assert.strictEqual(pauseState.status, AppStatus.INITIALIZED);
pauseState.startAutoRun();
assert.strictEqual(pauseState.status, AppStatus.COMPUTING);
pauseState.stopAutoRun();
assert.strictEqual(pauseState.status, AppStatus.PAUSED);
console.log('  [PASS] AutoRun PAUSED state transition verified');
