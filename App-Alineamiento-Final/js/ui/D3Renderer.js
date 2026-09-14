/**
 * Reactive D3 Matrix Renderer using D3 v7 Data Joins (enter/update/exit).
 * Features:
 * - Persistent SVG canvas (NO destructive d3.select('#root').remove())
 * - Independent viewBox and scaling for asymmetric grids (N != M)
 * - Catmull-Rom SVG vector splines for traceback paths
 * - Smooth pan & zoom behavior
 * - Cell interaction hooks (hover/click)
 */

export class D3Renderer {
  /**
   * @param {string|HTMLElement} container - Selector or DOM element for matrix container
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      cellSize: 46,
      headerSize: 42,
      margin: { top: 40, right: 40, bottom: 40, left: 40 },
      fontSize: 14,
      ...options
    };

    this.svg = null;
    this.rootGroup = null;
    this.gridGroup = null;
    this.arrowGroup = null;
    this.headerGroup = null;
    this.zoomBehavior = null;

    this.rows = 0;
    this.cols = 0;
    this.seq1 = '';
    this.seq2 = '';

    this.onCellHover = options.onCellHover || null;
    this.onCellClick = options.onCellClick || null;

    this._initCanvas();
  }

  /**
   * Initialize persistent SVG container and defs once
   */
  _initCanvas() {
    if (!this.container) return;
    const d3 = window.d3;
    if (!d3) {
      console.warn('D3 library not loaded.');
      return;
    }

    // Reuse existing svg or create once
    let svgSelection = d3.select(this.container).select('svg.alignment-matrix-svg');
    if (svgSelection.empty()) {
      this.svg = d3.select(this.container)
        .append('svg')
        .attr('class', 'alignment-matrix-svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('display', 'block');

      // Define arrowhead markers in defs
      const defs = this.svg.append('defs');
      
      // Marker for traceback arrow (oriented toward predecessor)
      defs.append('marker')
        .attr('id', 'traceback-arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 6)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 10 0 L 0 5 L 10 10 z')
        .attr('fill', '#ef4444');

      // Marker for active cell pointer
      defs.append('marker')
        .attr('id', 'path-arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 5)
        .attr('refY', 5)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#3b82f6');

      // Setup zoomable container group
      this.rootGroup = this.svg.append('g').attr('class', 'zoom-layer');
      this.gridGroup = this.rootGroup.append('g').attr('class', 'grid-layer');
      this.arrowGroup = this.rootGroup.append('g').attr('class', 'arrow-layer');
      this.headerGroup = this.rootGroup.append('g').attr('class', 'header-layer');

      this.zoomBehavior = d3.zoom()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => {
          this.rootGroup.attr('transform', event.transform);
        });

      this.svg.call(this.zoomBehavior);
    } else {
      this.svg = svgSelection;
      this.rootGroup = this.svg.select('g.zoom-layer');
      this.gridGroup = this.rootGroup.select('g.grid-layer');
      this.arrowGroup = this.rootGroup.select('g.arrow-layer');
      this.headerGroup = this.rootGroup.select('g.header-layer');
    }
  }

  /**
   * Mount grid dimensions and sequence labels without destroying canvas
   * @param {number} rows - Number of rows (n + 1)
   * @param {number} cols - Number of columns (m + 1)
   * @param {string} seq1 - Sequence 1 (rows)
   * @param {string} seq2 - Sequence 2 (columns)
   */
  mount(rows, cols, seq1 = '', seq2 = '') {
    this.rows = rows;
    this.cols = cols;
    this.seq1 = seq1;
    this.seq2 = seq2;

    const { cellSize, headerSize, margin } = this.options;
    const totalWidth = margin.left + headerSize + cols * cellSize + margin.right;
    const totalHeight = margin.top + headerSize + rows * cellSize + margin.bottom;

    if (this.svg) {
      this.svg
        .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // Reset zoom to natural view, ensuring full vertical and horizontal containment
      const d3 = window.d3;
      if (d3 && this.zoomBehavior) {
        // When aspect ratio is highly vertical (rows > cols * 1.5), zoomIdentity ensures
        // the complete grid height is contained within the viewport without clipping.
        this.svg.transition().duration(250).call(this.zoomBehavior.transform, d3.zoomIdentity);
      }
    }

    this._renderHeaders();
    this.clearTraceback();
  }

  /**
   * Render or update top and left sequence headers
   */
  _renderHeaders() {
    const d3 = window.d3;
    if (!d3 || !this.headerGroup) return;

    const { cellSize, headerSize, margin } = this.options;
    const startX = margin.left + headerSize;
    const startY = margin.top + headerSize;

    // Header column labels (Sequence 2 on top columns)
    const colLabels = [{ text: '', index: 0, j: 0 }];
    for (let j = 0; j < this.seq2.length; j++) {
      colLabels.push({ text: this.seq2[j], index: j + 1, j: j + 1 });
    }

    const topHeaders = this.headerGroup.selectAll('g.top-header')
      .data(colLabels, d => `top_${d.j}`);

    const topEnter = topHeaders.enter()
      .append('g')
      .attr('class', 'top-header');

    topEnter.append('rect')
      .attr('class', 'header-bg')
      .attr('width', cellSize)
      .attr('height', headerSize - 4)
      .attr('rx', 4);

    topEnter.append('text')
      .attr('class', 'header-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    const topMerged = topEnter.merge(topHeaders);
    topMerged.attr('transform', d => `translate(${startX + d.j * cellSize}, ${margin.top})`);
    topMerged.select('text')
      .attr('x', cellSize / 2)
      .attr('y', (headerSize - 4) / 2)
      .text(d => d.text);

    topHeaders.exit().remove();

    // Header row labels (Sequence 1 on left rows)
    const rowLabels = [{ text: '', index: 0, i: 0 }];
    for (let i = 0; i < this.seq1.length; i++) {
      rowLabels.push({ text: this.seq1[i], index: i + 1, i: i + 1 });
    }

    const leftHeaders = this.headerGroup.selectAll('g.left-header')
      .data(rowLabels, d => `left_${d.i}`);

    const leftEnter = leftHeaders.enter()
      .append('g')
      .attr('class', 'left-header');

    leftEnter.append('rect')
      .attr('class', 'header-bg')
      .attr('width', headerSize - 4)
      .attr('height', cellSize)
      .attr('rx', 4);

    leftEnter.append('text')
      .attr('class', 'header-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    const leftMerged = leftEnter.merge(leftHeaders);
    leftMerged.attr('transform', d => `translate(${margin.left}, ${startY + d.i * cellSize})`);
    leftMerged.select('text')
      .attr('x', (headerSize - 4) / 2)
      .attr('y', cellSize / 2)
      .text(d => d.text);

    leftHeaders.exit().remove();
  }

  /**
   * Reactive D3 Data Join on cells: enter, update, exit
   * @param {Array<Object>} matrixFlat - Array of cell items { i, j, score, directions, calculated }
   * @param {Object|null} activeCell - Currently inspected/computed cell { i, j }
   * @param {Array<Object>} pathCoords - Array of optimal path coordinates [{ i, j }]
   */
  updateMatrixCells(matrixFlat, activeCell = null, pathCoords = []) {
    const d3 = window.d3;
    if (!d3 || !this.gridGroup) return;

    const { cellSize, headerSize, margin } = this.options;
    const startX = margin.left + headerSize;
    const startY = margin.top + headerSize;

    // Fast lookup for path coords
    const pathSet = new Set(pathCoords.map(p => `${p.i}_${p.j}`));

    // Key function by matrix coordinate
    const cells = this.gridGroup.selectAll('g.matrix-cell')
      .data(matrixFlat, d => `${d.i}_${d.j}`);

    // ENTER
    const enterCells = cells.enter()
      .append('g')
      .attr('class', 'matrix-cell')
      .attr('transform', d => `translate(${startX + d.j * cellSize}, ${startY + d.i * cellSize})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        if (this.onCellHover) this.onCellHover(d, event);
      })
      .on('click', (event, d) => {
        if (this.onCellClick) this.onCellClick(d, event);
      });

    enterCells.append('rect')
      .attr('class', 'cell-rect')
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('rx', 4);

    enterCells.append('text')
      .attr('class', 'cell-val')
      .attr('x', (cellSize - 2) / 2)
      .attr('y', (cellSize - 2) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    // Direction indicators (mini-arrows or dots in corner)
    enterCells.append('g')
      .attr('class', 'cell-indicators');

    // UPDATE (merged enter + update)
    const merged = enterCells.merge(cells);

    merged.attr('transform', d => `translate(${startX + d.j * cellSize}, ${startY + d.i * cellSize})`);

    merged.classed('active-cell', d => activeCell && activeCell.i === d.i && activeCell.j === d.j)
      .classed('path-cell', d => pathSet.has(`${d.i}_${d.j}`))
      .classed('boundary-cell', d => d.i === 0 || d.j === 0)
      .classed('computed-cell', d => d.score !== null && d.score !== undefined);

    merged.select('text.cell-val')
      .text(d => (d.score !== null && d.score !== undefined ? d.score : ''));

    // EXIT
    cells.exit().remove();
  }

  /**
   * Render Catmull-Rom SVG vector spline along optimal traceback coordinates
   * @param {Array<{i: number, j: number}>} pathCoordinates - Ordered coordinates from start to finish
   */
  renderTracebackArrow(pathCoordinates = []) {
    const d3 = window.d3;
    if (!d3 || !this.arrowGroup || pathCoordinates.length < 2) {
      this.clearTraceback();
      return;
    }

    const { cellSize, headerSize, margin } = this.options;
    const startX = margin.left + headerSize;
    const startY = margin.top + headerSize;

    // Convert (i, j) matrix cells to center (x, y) pixels
    const points = pathCoordinates.map(p => ({
      x: startX + p.j * cellSize + (cellSize - 2) / 2,
      y: startY + p.i * cellSize + (cellSize - 2) / 2
    }));

    // Catmull-Rom curve generator
    const lineGen = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.5));

    const pathData = lineGen(points);

    // Data join for the spline path
    const spline = this.arrowGroup.selectAll('path.traceback-spline')
      .data([pathData]);

    spline.enter()
      .append('path')
      .attr('class', 'traceback-spline')
      .attr('marker-end', 'url(#traceback-arrow)')
      .merge(spline)
      .transition()
      .duration(300)
      .attr('d', pathData);

    spline.exit().remove();

    // Data join for path node halos
    const nodes = this.arrowGroup.selectAll('circle.path-node')
      .data(points, (d, idx) => idx);

    nodes.enter()
      .append('circle')
      .attr('class', 'path-node')
      .attr('r', 5)
      .merge(nodes)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    nodes.exit().remove();
  }

  /**
   * Clear traceback spline
   */
  clearTraceback() {
    if (this.arrowGroup) {
      this.arrowGroup.selectAll('*').remove();
    }
  }

  /**
   * Reset zoom & pan to default fit
   */
  resetZoom() {
    const d3 = window.d3;
    if (d3 && this.svg && this.zoomBehavior) {
      this.svg.transition().duration(350).call(this.zoomBehavior.transform, d3.zoomIdentity);
    }
  }
}
