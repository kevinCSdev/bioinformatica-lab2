import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execSync } from 'child_process';

console.log('=== [RDD: DEFECT VERIFICATION] SIDEBAR LOCAL HOVER CONTRAST ===\n');

// 1. Formula for WCAG Relative Luminance and Contrast Ratio
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Colors
const primaryBg = [105, 92, 254]; // #695CFE
const buggyText = [112, 112, 112]; // #707070 (var(--text-color))
const fixedText = [255, 255, 255]; // #FFFFFF (var(--sidebar-color))

const buggyRatio = getContrastRatio(primaryBg, buggyText);
const fixedRatio = getContrastRatio(primaryBg, fixedText);

console.log(`Contrast Analysis against Primary Hover Background (#695CFE):`);
console.log(`  - Defective state (#707070 text): Ratio = ${buggyRatio.toFixed(2)}:1 (FAIL WCAG AA < 4.5:1)`);
console.log(`  - Corrected state (#FFFFFF text): Ratio = ${fixedRatio.toFixed(2)}:1 (PASS WCAG AA >= 4.5:1)\n`);

assert(buggyRatio < 4.5, 'Buggy ratio should fail WCAG AA');
assert(fixedRatio >= 4.5, 'Fixed ratio must satisfy WCAG AA >= 4.5:1');

// 2. Find all style.css files in App-Alineamiento-0* using native fs
function findFiles(dir, matchName) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, matchName));
    } else if (entry.isFile() && entry.name === matchName) {
      results.push(fullPath);
    }
  }
  return results;
}

const cssFiles = [
  ...findFiles('App-Alineamiento-00', 'style.css'),
  ...findFiles('App-Alineamiento-0n', 'style.css')
];

console.log(`Verifying CSS rules across ${cssFiles.length} stylesheets...`);

let checkedCount = 0;
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Must NOT have color: var(--text-color) in body.dark .sidebar li a:hover
  const hasBuggyRule = /body\.dark\s+\.sidebar\s+li\s+a:hover\s+(?:\.icon,\s*body\.dark\s+\.sidebar\s+li\s+a:hover\s+)?\.text\s*\{\s*color:\s*var\(--text-color\);/m.test(content);
  assert(!hasBuggyRule, `Stylesheet ${file} contains defective dark hover text color!`);

  // Must have color: var(--sidebar-color)
  const hasFixedRule = /body\.dark\s+\.sidebar\s+li\s+a:hover\s+\.icon,\s*body\.dark\s+\.sidebar\s+li\s+a:hover\s+\.text\s*\{\s*color:\s*var\(--sidebar-color\);/m.test(content);
  assert(hasFixedRule, `Stylesheet ${file} is missing corrected dark hover text color rule!`);

  checkedCount++;
  console.log(`  [PASS] ${file}`);
}

console.log(`\nChecked ${checkedCount}/${cssFiles.length} stylesheets successfully.`);

// 3. Verify zero regressions in core engine and state tests
console.log('\nVerifying test suite for zero regressions...');
const testOutput = execSync('npm --prefix App-Alineamiento-Final test', { encoding: 'utf-8' });
assert(testOutput.includes('assertions passed'), 'Engine assertions failed');
assert(testOutput.includes('AppState FSM tests PASSED!'), 'FSM assertions failed');
console.log('  [PASS] App-Alineamiento-Final test suite passed');

const oracleOutput = execSync('node test_suite.spec.js', { encoding: 'utf-8' });
assert(oracleOutput.includes('90/90 assertions passed'), 'Oracle assertions failed');
console.log('  [PASS] Canonical test oracle suite (90/90 assertions passed)');

console.log('\n=============================================================');
console.log('RDD VERIFICATION RECEIPT GENERATED: 100% PASS (NO REGRESSIONS)');
console.log('=============================================================\n');
