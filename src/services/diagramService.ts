import katex from 'katex';

interface DiagramConfig {
  type: 'grid' | 'rectangle' | 'circle' | 'triangle' | 'coordinate' | 'graph' | 'pattern' | 'custom' | 'math';
  width?: number;
  height?: number;
  data?: any;
}

interface GridConfig {
  rows: number;
  cols: number;
  cellSize?: number;
  highlightCells?: Array<{ row: number; col: number; color?: string }>;
  showNumbers?: boolean;
}

interface RectangleConfig {
  width: number;
  height: number;
  label?: string;
  position?: { x: number; y: number };
  rotation?: number;
  color?: string;
}

interface CircleConfig {
  radius: number;
  center?: { x: number; y: number };
  label?: string;
  color?: string;
}

interface CoordinateConfig {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  gridLines?: boolean;
  points?: Array<{ x: number; y: number; label?: string }>;
  lines?: Array<{ x1: number; y1: number; x2: number; y2: number; color?: string }>;
}

export class DiagramService {
  private static readonly GRID_STROKE = '#ddd';
  private static readonly MAIN_STROKE = '#333';

  /**
   * Generate SVG diagram based on problem text analysis
   */
  static generateDiagram(questionText: string): string | null {
    const config = this.analyzeProblemForDiagram(questionText);
    if (!config) return null;

    switch (config.type) {
      case 'grid':
        return this.createGridDiagram(config.data as GridConfig);
      case 'rectangle':
        return this.createRectangleDiagram(config.data as RectangleConfig);
      case 'circle':
        return this.createCircleDiagram(config.data as CircleConfig);
      case 'coordinate':
        return this.createCoordinateDiagram(config.data as CoordinateConfig);
      case 'pattern':
        return this.createPatternDiagram(config.data);
      case 'math':
        return this.createMathDiagram(config.data);
      default:
        return null;
    }
  }

  /**
   * Analyze problem text to determine what type of diagram is needed
   */
  private static analyzeProblemForDiagram(text: string): DiagramConfig | null {
    const lowerText = text.toLowerCase();

    // Math equations and expressions
    const mathPattern = /\$.*?\$|\\[a-zA-Z]+|[a-zA-Z]\s*=\s*[0-9]+|\b(?:sin|cos|tan|log|ln|sqrt|sum|int)\b/;
    if (mathPattern.test(text)) {
      return {
        type: 'math',
        data: { expression: this.extractMathExpressions(text) }
      };
    }

    // Enhanced grid detection
    const gridPatterns = [
      /(\d+)\s*×\s*(\d+)/, /(\d+)\s*x\s*(\d+)/, /(\d+)-by-(\d+)/,
      /grid.*?(\d+).*?(\d+)/, /checkerboard/, /quilt/, /array/
    ];

    for (const pattern of gridPatterns) {
      const match = text.match(pattern);
      if (match) {
        const rows = parseInt(match[2] || match[1] || '4');
        const cols = parseInt(match[1] || match[2] || '4');
        return {
          type: 'grid',
          data: {
            rows,
            cols,
            cellSize: Math.max(20, Math.min(50, 300 / Math.max(rows, cols))),
            showNumbers: lowerText.includes('number'),
            highlightCells: this.detectHighlightedCells(text)
          } as GridConfig
        };
      }
    }

    // Enhanced rectangle detection
    if (this.isGeometryProblem(text, 'rectangle')) {
      const dimensions = this.extractDimensions(text);
      return {
        type: 'rectangle',
        data: {
          width: (dimensions.width || 4) * 25,
          height: (dimensions.height || 3) * 25,
          label: this.extractVertexLabels(text) || 'ABCD',
          position: { x: 50, y: 50 },
          showDimensions: true
        } as RectangleConfig
      };
    }

    // Enhanced circle detection
    if (this.isGeometryProblem(text, 'circle')) {
      const radius = this.extractRadius(text);
      return {
        type: 'circle',
        data: {
          radius: (radius || 5) * 15,
          center: { x: 200, y: 200 },
          showRadius: true,
          label: this.extractCircleLabels(text)
        } as CircleConfig
      };
    }

    // Enhanced coordinate system detection
    if (this.needsCoordinateSystem(text)) {
      const bounds = this.extractCoordinateBounds(text);
      return {
        type: 'coordinate',
        data: {
          ...bounds,
          gridLines: true,
          points: this.extractPoints(text),
          lines: this.extractLines(text)
        } as CoordinateConfig
      };
    }

    // Enhanced pattern detection
    const patterns = this.detectPatterns(text);
    if (patterns.length > 0) {
      return {
        type: 'pattern',
        data: { patterns }
      };
    }

    return null;
  }

  /**
   * Create enhanced SVG grid diagram with improved styling
   */
  private static createGridDiagram(config: GridConfig): string {
    const { rows, cols, cellSize = 30, highlightCells = [], showNumbers = false } = config;
    const width = cols * cellSize;
    const height = rows * cellSize;
    const padding = 60;

    let svg = `<svg width="${width + padding * 2}" height="${height + padding * 2}"
               viewBox="0 0 ${width + padding * 2} ${height + padding * 2}"
               style="font-family: 'Arial', sans-serif;">`;

    // Add definitions for patterns and gradients
    svg += `
      <defs>
        <pattern id="checkerboard" patternUnits="userSpaceOnUse" width="${cellSize * 2}" height="${cellSize * 2}">
          <rect width="${cellSize}" height="${cellSize}" fill="#f5f5f5"/>
          <rect x="${cellSize}" y="${cellSize}" width="${cellSize}" height="${cellSize}" fill="#f5f5f5"/>
        </pattern>
        <linearGradient id="cellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fff3e0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffcc02;stop-opacity:1" />
        </linearGradient>
      </defs>
    `;

    // Background
    svg += `<rect x="${padding}" y="${padding}" width="${width}" height="${height}"
            fill="#fafafa" stroke="#e0e0e0" stroke-width="2" rx="8"/>`;

    // Grid lines with alternating thickness
    for (let i = 0; i <= rows; i++) {
      const strokeWidth = i % 2 === 0 ? 2 : 1;
      const strokeColor = i % 2 === 0 ? '#bdbdbd' : '#e0e0e0';
      svg += `<line x1="${padding}" y1="${padding + i * cellSize}"
              x2="${padding + width}" y2="${padding + i * cellSize}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }
    for (let j = 0; j <= cols; j++) {
      const strokeWidth = j % 2 === 0 ? 2 : 1;
      const strokeColor = j % 2 === 0 ? '#bdbdbd' : '#e0e0e0';
      svg += `<line x1="${padding + j * cellSize}" y1="${padding}"
              x2="${padding + j * cellSize}" y2="${padding + height}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }

    // Highlight specific cells with better styling
    highlightCells.forEach(cell => {
      const x = padding + cell.col * cellSize;
      const y = padding + cell.row * cellSize;
      const cellColor = cell.color || 'url(#cellGradient)';
      svg += `<rect x="${x + 2}" y="${y + 2}" width="${cellSize - 4}" height="${cellSize - 4}"
              fill="${cellColor}" opacity="0.8" rx="4"
              stroke="#ff9800" stroke-width="2"/>`;
    });

    // Add coordinate labels
    for (let i = 0; i < rows; i++) {
      svg += `<text x="${padding - 15}" y="${padding + i * cellSize + cellSize/2 + 5}"
              text-anchor="middle" font-size="10" fill="#666" font-weight="bold">${i + 1}</text>`;
    }
    for (let j = 0; j < cols; j++) {
      const colLabel = String.fromCharCode(65 + j); // A, B, C, etc.
      svg += `<text x="${padding + j * cellSize + cellSize/2}" y="${padding - 10}"
              text-anchor="middle" font-size="10" fill="#666" font-weight="bold">${colLabel}</text>`;
    }

    // Add numbers if requested with better styling
    if (showNumbers) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = padding + j * cellSize + cellSize/2;
          const y = padding + i * cellSize + cellSize/2;
          const num = i * cols + j + 1;
          svg += `<circle cx="${x}" cy="${y}" r="${Math.min(cellSize * 0.3, 15)}"
                  fill="#2196f3" opacity="0.9"/>`;
          svg += `<text x="${x}" y="${y + 4}" text-anchor="middle"
                  font-size="${Math.min(cellSize * 0.4, 12)}" fill="white" font-weight="bold">${num}</text>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Create enhanced SVG rectangle diagram with D3-style precision
   */
  private static createRectangleDiagram(config: RectangleConfig): string {
    const { width, height, label = '', position = { x: 50, y: 50 }, rotation = 0, color = 'none' } = config;
    const svgWidth = width + 150;
    const svgHeight = height + 150;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="font-family: 'Arial', sans-serif;">`;

    // Add gradient definition for better visual appeal
    svg += `
      <defs>
        <linearGradient id="rectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#bbdefb;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
    `;

    // Rectangle with enhanced styling
    const rectFill = color === 'none' ? 'url(#rectGradient)' : color;
    if (rotation === 0) {
      svg += `<rect x="${position.x}" y="${position.y}" width="${width}" height="${height}"
              fill="${rectFill}" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"
              rx="4" ry="4"/>`;
    } else {
      const centerX = position.x + width/2;
      const centerY = position.y + height/2;
      svg += `<rect x="${position.x}" y="${position.y}" width="${width}" height="${height}"
              fill="${rectFill}" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"
              rx="4" ry="4" transform="rotate(${rotation} ${centerX} ${centerY})"/>`;
    }

    // Enhanced vertex labels with circles
    if (label === 'ABCD' || label.length === 4) {
      const vertices = [
        { char: label[0] || 'A', x: position.x - 15, y: position.y - 10 },
        { char: label[1] || 'B', x: position.x + width + 8, y: position.y - 10 },
        { char: label[2] || 'C', x: position.x + width + 8, y: position.y + height + 20 },
        { char: label[3] || 'D', x: position.x - 15, y: position.y + height + 20 }
      ];

      vertices.forEach(vertex => {
        svg += `<circle cx="${vertex.x}" cy="${vertex.y - 5}" r="12" fill="#fff" stroke="#1976d2" stroke-width="2"/>`;
        svg += `<text x="${vertex.x}" y="${vertex.y}" text-anchor="middle" font-size="14" font-weight="bold" fill="#1976d2">${vertex.char}</text>`;
      });
    }

    // Enhanced dimension arrows and labels
    const actualWidth = width / 20;
    const actualHeight = height / 20;

    // Top dimension line
    svg += `<line x1="${position.x}" y1="${position.y - 25}" x2="${position.x + width}" y2="${position.y - 25}"
            stroke="#666" stroke-width="1" marker-end="url(#arrowhead)" marker-start="url(#arrowhead)"/>`;
    svg += `<text x="${position.x + width/2}" y="${position.y - 30}" text-anchor="middle" font-size="12"
            fill="#666" font-weight="bold">${actualWidth}</text>`;

    // Left dimension line
    svg += `<line x1="${position.x - 35}" y1="${position.y}" x2="${position.x - 35}" y2="${position.y + height}"
            stroke="#666" stroke-width="1" marker-end="url(#arrowhead)" marker-start="url(#arrowhead)"/>`;
    svg += `<text x="${position.x - 45}" y="${position.y + height/2}" text-anchor="middle" font-size="12"
            fill="#666" font-weight="bold" transform="rotate(-90 ${position.x - 45} ${position.y + height/2})">${actualHeight}</text>`;

    // Add arrow markers
    svg += `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
        </marker>
      </defs>
    `;

    svg += '</svg>';
    return svg;
  }

  /**
   * Create SVG circle diagram
   */
  private static createCircleDiagram(config: CircleConfig): string {
    const { radius, center = { x: 200, y: 200 }, color = 'none' } = config;
    const svgSize = Math.max(400, (radius + 50) * 2);

    let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;

    // Circle
    svg += `<circle cx="${center.x}" cy="${center.y}" r="${radius}"
            fill="${color}" stroke="${this.MAIN_STROKE}" stroke-width="2"/>`;

    // Radius line
    svg += `<line x1="${center.x}" y1="${center.y}" x2="${center.x + radius}" y2="${center.y}"
            stroke="${this.MAIN_STROKE}" stroke-width="1" stroke-dasharray="5,5"/>`;

    // Center point
    svg += `<circle cx="${center.x}" cy="${center.y}" r="3" fill="${this.MAIN_STROKE}"/>`;

    // Radius label
    svg += `<text x="${center.x + radius/2}" y="${center.y - 10}" text-anchor="middle" font-size="12" fill="${this.MAIN_STROKE}">r = ${radius/10}</text>`;

    svg += '</svg>';
    return svg;
  }

  /**
   * Create coordinate plane diagram
   */
  private static createCoordinateDiagram(config: CoordinateConfig): string {
    const { xMin, xMax, yMin, yMax, gridLines = true, points = [], lines = [] } = config;
    const padding = 50;
    const scale = 20;
    const width = (xMax - xMin) * scale + 2 * padding;
    const height = (yMax - yMin) * scale + 2 * padding;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

    // Grid lines
    if (gridLines) {
      for (let x = xMin; x <= xMax; x++) {
        const xPos = padding + (x - xMin) * scale;
        svg += `<line x1="${xPos}" y1="${padding}" x2="${xPos}" y2="${height - padding}"
                stroke="${this.GRID_STROKE}" stroke-width="0.5"/>`;
      }
      for (let y = yMin; y <= yMax; y++) {
        const yPos = height - padding - (y - yMin) * scale;
        svg += `<line x1="${padding}" y1="${yPos}" x2="${width - padding}" y2="${yPos}"
                stroke="${this.GRID_STROKE}" stroke-width="0.5"/>`;
      }
    }

    // Axes
    const xAxisY = height - padding - (0 - yMin) * scale;
    const yAxisX = padding + (0 - xMin) * scale;
    svg += `<line x1="${padding}" y1="${xAxisY}" x2="${width - padding}" y2="${xAxisY}"
            stroke="${this.MAIN_STROKE}" stroke-width="2"/>`;
    svg += `<line x1="${yAxisX}" y1="${padding}" x2="${yAxisX}" y2="${height - padding}"
            stroke="${this.MAIN_STROKE}" stroke-width="2"/>`;

    // Points
    points.forEach(point => {
      const x = padding + (point.x - xMin) * scale;
      const y = height - padding - (point.y - yMin) * scale;
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="red"/>`;
      if (point.label) {
        svg += `<text x="${x + 8}" y="${y - 8}" font-size="12" fill="${this.MAIN_STROKE}">${point.label}</text>`;
      }
    });

    // Lines
    lines.forEach(line => {
      const x1 = padding + (line.x1 - xMin) * scale;
      const y1 = height - padding - (line.y1 - yMin) * scale;
      const x2 = padding + (line.x2 - xMin) * scale;
      const y2 = height - padding - (line.y2 - yMin) * scale;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
              stroke="${line.color || 'blue'}" stroke-width="2"/>`;
    });

    svg += '</svg>';
    return svg;
  }

  /**
   * Create pattern diagrams (stars, tetrominos, etc.)
   */
  private static createPatternDiagram(data: any): string {
    if (data.patternType === 'star') {
      return this.createStarPattern();
    }
    return '';
  }

  private static createStarPattern(): string {
    // Create an 8-pointed star pattern for quilting problems
    const size = 300;
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    // Grid background
    for (let i = 0; i <= 4; i++) {
      const pos = i * (size - 100) / 4 + 50;
      svg += `<line x1="50" y1="${pos}" x2="${size - 50}" y2="${pos}" stroke="${this.GRID_STROKE}"/>`;
      svg += `<line x1="${pos}" y1="50" x2="${pos}" y2="${size - 50}" stroke="${this.GRID_STROKE}"/>`;
    }

    // 8-pointed star
    const center = size / 2;
    const outerRadius = 60;
    const innerRadius = 30;

    let starPath = 'M';
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = center + radius * Math.cos(angle - Math.PI/2);
      const y = center + radius * Math.sin(angle - Math.PI/2);
      starPath += i === 0 ? `${x},${y}` : ` L${x},${y}`;
    }
    starPath += ' Z';

    svg += `<path d="${starPath}" fill="#ffeb3b" stroke="${this.MAIN_STROKE}" stroke-width="2"/>`;
    svg += '</svg>';
    return svg;
  }

  /**
   * Create math equation diagram using KaTeX
   */
  private static createMathDiagram(data: any): string {
    const { expression } = data;
    if (!expression) return '';

    try {
      const html = katex.renderToString(expression, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });

      return `
        <div class="math-diagram bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div class="text-center text-lg font-semibold text-blue-800 mb-4">
            Mathematical Expression
          </div>
          <div class="text-center text-2xl">
            ${html}
          </div>
        </div>
      `;
    } catch (error) {
      return `<div class="math-error p-4 bg-red-50 border border-red-200 rounded">
        Error rendering math: ${expression}
      </div>`;
    }
  }

  /**
   * Extract mathematical expressions from text
   */
  private static extractMathExpressions(text: string): string {
    // Look for LaTeX-style math
    const latexMatch = text.match(/\$(.+?)\$/);
    if (latexMatch) return latexMatch[1];

    // Look for equations
    const equationMatch = text.match(/([a-zA-Z]\s*=\s*[0-9+\-*/()^.\s]+)/);
    if (equationMatch) return equationMatch[1];

    // Look for fractions
    const fractionMatch = text.match(/(\d+)\/(\d+)/);
    if (fractionMatch) return `\\frac{${fractionMatch[1]}}{${fractionMatch[2]}}`;

    return text;
  }

  /**
   * Detect if this is a geometry problem
   */
  private static isGeometryProblem(text: string, shape: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes(shape) && (
      lowerText.includes('area') ||
      lowerText.includes('perimeter') ||
      lowerText.includes('side') ||
      lowerText.includes('length') ||
      lowerText.includes('width') ||
      lowerText.includes('height') ||
      lowerText.includes('radius') ||
      lowerText.includes('diameter')
    );
  }

  /**
   * Extract dimensions from text
   */
  private static extractDimensions(text: string): { width?: number; height?: number } {
    const widthMatch = text.match(/(?:width|base)\s*(?:is|=|of)?\s*(\d+)/i);
    const heightMatch = text.match(/(?:height|length|altitude)\s*(?:is|=|of)?\s*(\d+)/i);

    const result: { width?: number; height?: number } = {};
    if (widthMatch) result.width = parseInt(widthMatch[1]);
    if (heightMatch) result.height = parseInt(heightMatch[1]);

    return result;
  }

  /**
   * Extract radius from text
   */
  private static extractRadius(text: string): number | undefined {
    const radiusMatch = text.match(/radius\s*(?:is|=|of)?\s*(\d+)/i);
    return radiusMatch ? parseInt(radiusMatch[1]) : undefined;
  }

  /**
   * Extract vertex labels from text
   */
  private static extractVertexLabels(text: string): string | undefined {
    const labelMatch = text.match(/(?:rectangle|square)\s*([A-Z]{3,4})/i);
    return labelMatch ? labelMatch[1] : undefined;
  }

  /**
   * Extract circle labels from text
   */
  private static extractCircleLabels(text: string): string | undefined {
    const labelMatch = text.match(/circle\s*([A-Z])/i);
    return labelMatch ? labelMatch[1] : undefined;
  }

  /**
   * Check if coordinate system is needed
   */
  private static needsCoordinateSystem(text: string): boolean {
    const coordinateKeywords = ['coordinate', 'graph', 'plot', 'axis', 'origin', 'quadrant', 'x-axis', 'y-axis'];
    const lowerText = text.toLowerCase();
    return coordinateKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract coordinate bounds from text
   */
  private static extractCoordinateBounds(text: string): { xMin: number; xMax: number; yMin: number; yMax: number } {
    const rangeMatch = text.match(/-?(\d+)\s*to\s*-?(\d+)/g);
    if (rangeMatch && rangeMatch.length >= 2) {
      const xRange = rangeMatch[0].split('to').map(n => parseInt(n.trim()));
      const yRange = rangeMatch[1].split('to').map(n => parseInt(n.trim()));
      return { xMin: xRange[0], xMax: xRange[1], yMin: yRange[0], yMax: yRange[1] };
    }
    return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
  }

  /**
   * Extract points from text
   */
  private static extractPoints(text: string): Array<{ x: number; y: number; label?: string }> {
    const pointPattern = /\((\d+),\s*(\d+)\)/g;
    const points = [];
    let match;

    while ((match = pointPattern.exec(text)) !== null) {
      points.push({
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        label: `(${match[1]}, ${match[2]})`
      });
    }

    return points;
  }

  /**
   * Extract lines from text
   */
  private static extractLines(_text: string): Array<{ x1: number; y1: number; x2: number; y2: number; color?: string }> {
    // This is a simplified implementation - could be enhanced
    return [];
  }

  /**
   * Detect highlighted cells in grid
   */
  private static detectHighlightedCells(_text: string): Array<{ row: number; col: number; color?: string }> {
    // Look for patterns like "shaded squares" or "colored cells"
    // This is a simplified implementation
    return [];
  }

  /**
   * Detect patterns in text
   */
  private static detectPatterns(text: string): string[] {
    const patterns = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('star')) patterns.push('star');
    if (lowerText.includes('tetromino')) patterns.push('tetromino');
    if (lowerText.includes('quilting')) patterns.push('quilting');
    if (lowerText.includes('spiral')) patterns.push('spiral');

    return patterns;
  }

  /**
   * Check if a problem likely needs a diagram
   */
  static needsDiagram(questionText: string): boolean {
    const lowerText = questionText.toLowerCase();
    const diagramKeywords = [
      'figure', 'diagram', 'shown', 'grid', 'rectangle', 'circle', 'triangle',
      'square', 'polygon', 'coordinate', 'graph', 'pattern', 'star', 'tetromino',
      'quilting', 'checkerboard', 'rotate', 'reflection', 'geometry', 'area',
      'perimeter', 'radius', 'diameter', 'angle', 'vertex', 'vertices'
    ];

    // Also check for math expressions
    const mathPattern = /\$.*?\$|\\[a-zA-Z]+|[a-zA-Z]\s*=\s*[0-9]+|\b(?:sin|cos|tan|log|ln|sqrt|sum|int)\b/;

    return diagramKeywords.some(keyword => lowerText.includes(keyword)) || mathPattern.test(questionText);
  }
}