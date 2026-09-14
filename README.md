# Laboratorio 2: Alineamiento de Secuencias y Programación Dinámica
**Bioinformática — Universidad del Bío-Bío**  
**Estudiante:** Kevin Cárdenas  
**Profesora:** Tatiana Gutiérrez

---

## Contenido del Repositorio

- **`App-Alineamiento-Final/`**: Aplicación web interactiva unificada con los algoritmos Needleman-Wunsch (Global), Smith-Waterman (Local), Wagner-Fischer (Distancia de Edición) y Longest Common Subsequence (LCS), renderizado reactivo con D3 Data Joins, panel de inspección matemática en vivo con KaTeX, navegación paso a paso con FSM determinista y paleta institucional.
- **`App-Alineamiento-00/`**: Aplicación base monolítica original de referencia.
- **`App-Alineamiento-0n/`**: Versiones históricas del proceso de desarrollo (App-01 a App-08).
- **`canonical_test_suite.json`**: Oráculo canónico de pruebas de alineamiento con 6 casos matemáticos y biológicos (TC1 a TC6).
- **`test_suite.spec.js`** y **`test_suite_alignment.py`**: Suites de validación independiente del motor y oráculos (100% PASS).
- **`index.html`**: Punto de entrada raíz para ejecución directa en servidores locales o despliegue en GitHub Pages.

---

## Ejecución de la Aplicación Web

### Opción 1: Desde la raíz del repositorio
```bash
python3 -m http.server 8080
```
Abre en tu navegador: [http://localhost:8080](http://localhost:8080) (redirige automáticamente a `App-Alineamiento-Final/`).

### Opción 2: Directamente desde el directorio de la aplicación final
```bash
cd App-Alineamiento-Final
python3 -m http.server 8080
```
Abre en tu navegador: [http://localhost:8080](http://localhost:8080).

---

## Ejecución de Pruebas (TDD + RDD)

```bash
# Pruebas unitarias de motor, máquina de estados e invariantes UI
npm --prefix App-Alineamiento-Final test

# Suite de validación contra el oráculo canónico
node test_suite.spec.js

# Verificación de contraste y accesibilidad WCAG 2.1 AA
node tests/rdd-contrast-verify.spec.js
```
