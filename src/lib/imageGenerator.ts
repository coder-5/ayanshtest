import sharp from 'sharp';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Generate a simple text-based image using Sharp
 */
export async function generateTextImage(
  text: string,
  options: ImageGenerationOptions = {}
): Promise<Buffer> {
  const {
    width = 400,
    height = 300,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    fontSize = 24
  } = options;

  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            fill="${textColor}"
            style="word-wrap: break-word;">
        ${text}
      </text>
    </svg>
  `;

  // Convert SVG to PNG using Sharp
  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Generate a math equation image using SVG
 */
export async function generateMathImage(
  equation: string,
  options: ImageGenerationOptions = {}
): Promise<Buffer> {
  const {
    width = 500,
    height = 200,
    backgroundColor = '#f8f9fa',
    textColor = '#212529',
    fontSize = 32
  } = options;

  // Simple math formatting - you could enhance this with MathJax or KaTeX
  const formattedEquation = equation
    .replace(/\^(\w+)/g, '<tspan baseline-shift="super" font-size="0.7em">$1</tspan>')
    .replace(/_(\w+)/g, '<tspan baseline-shift="sub" font-size="0.7em">$1</tspan>');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}" stroke="#dee2e6" stroke-width="1"/>
      <text x="50%" y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Times, serif"
            font-size="${fontSize}"
            fill="${textColor}">
        ${formattedEquation}
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Generate a diagram placeholder image
 */
export async function generateDiagramPlaceholder(
  title: string,
  options: ImageGenerationOptions = {}
): Promise<Buffer> {
  const {
    width = 600,
    height = 400,
    backgroundColor = '#e9ecef',
    textColor = '#495057'
  } = options;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}" stroke="#adb5bd" stroke-width="2" stroke-dasharray="10,5"/>
      <text x="50%" y="40%"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="24"
            fill="${textColor}"
            font-weight="bold">
        ${title}
      </text>
      <text x="50%" y="60%"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="16"
            fill="${textColor}">
        Diagram placeholder
      </text>
      <circle cx="50%" cy="70%" r="30" fill="none" stroke="${textColor}" stroke-width="2"/>
      <rect x="45%" y="75%" width="10%" height="10%" fill="none" stroke="${textColor}" stroke-width="2"/>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}