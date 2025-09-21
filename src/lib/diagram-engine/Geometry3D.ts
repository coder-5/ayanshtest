/**
 * 3D Geometry Engine for Advanced Mathematical Visualizations
 * Supports 3D shapes, transformations, projections, and interactive manipulations
 */

import * as d3 from 'd3';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Matrix3D {
  elements: number[][];
}

export interface Shape3D {
  id: string;
  type: '3d-point' | '3d-line' | '3d-plane' | '3d-cube' | '3d-sphere' | '3d-cylinder' | '3d-cone' | '3d-pyramid';
  vertices: Vector3D[];
  faces?: Face3D[];
  material?: Material3D;
  transform?: Transform3D;
}

export interface Face3D {
  vertices: number[]; // indices into the vertices array
  normal: Vector3D;
  color?: string;
  opacity?: number;
}

export interface Material3D {
  color: string;
  opacity: number;
  wireframe: boolean;
  shininess: number;
  reflectivity: number;
}

export interface Transform3D {
  translation: Vector3D;
  rotation: Vector3D; // Euler angles
  scale: Vector3D;
}

export interface Camera3D {
  position: Vector3D;
  target: Vector3D;
  up: Vector3D;
  fov: number;
  near: number;
  far: number;
}

export interface Light3D {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  position?: Vector3D;
  direction?: Vector3D;
  color: string;
  intensity: number;
}

export class Geometry3DEngine {
  private canvas: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private camera: Camera3D;
  private lights: Light3D[];
  private shapes: Shape3D[];
  private projectionMatrix!: Matrix3D;
  private viewMatrix!: Matrix3D;
  private viewportWidth!: number;
  private viewportHeight!: number;

  constructor(
    containerId: string,
    width: number = 800,
    height: number = 600
  ) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Initialize SVG canvas
    this.canvas = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .classed('geometry-3d-canvas', true);

    // Initialize camera
    this.camera = {
      position: { x: 0, y: 0, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 45,
      near: 0.1,
      far: 1000
    };

    // Initialize lighting
    this.lights = [
      {
        type: 'ambient',
        color: '#404040',
        intensity: 0.4
      },
      {
        type: 'directional',
        direction: { x: -1, y: -1, z: -1 },
        color: '#ffffff',
        intensity: 0.8
      }
    ];

    this.shapes = [];
    this.updateMatrices();
    this.setupEventHandlers();
  }

  /**
   * Add 3D shapes to the scene
   */
  public addShape(shape: Shape3D): void {
    this.shapes.push(shape);
    this.render();
  }

  public addCube(center: Vector3D, size: number, material?: Partial<Material3D>): Shape3D {
    const halfSize = size / 2;
    const vertices: Vector3D[] = [
      // Front face
      { x: center.x - halfSize, y: center.y - halfSize, z: center.z + halfSize },
      { x: center.x + halfSize, y: center.y - halfSize, z: center.z + halfSize },
      { x: center.x + halfSize, y: center.y + halfSize, z: center.z + halfSize },
      { x: center.x - halfSize, y: center.y + halfSize, z: center.z + halfSize },
      // Back face
      { x: center.x - halfSize, y: center.y - halfSize, z: center.z - halfSize },
      { x: center.x + halfSize, y: center.y - halfSize, z: center.z - halfSize },
      { x: center.x + halfSize, y: center.y + halfSize, z: center.z - halfSize },
      { x: center.x - halfSize, y: center.y + halfSize, z: center.z - halfSize }
    ];

    const faces: Face3D[] = [
      { vertices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: 1 } }, // Front
      { vertices: [5, 4, 7, 6], normal: { x: 0, y: 0, z: -1 } }, // Back
      { vertices: [4, 0, 3, 7], normal: { x: -1, y: 0, z: 0 } }, // Left
      { vertices: [1, 5, 6, 2], normal: { x: 1, y: 0, z: 0 } }, // Right
      { vertices: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 } }, // Top
      { vertices: [4, 5, 1, 0], normal: { x: 0, y: -1, z: 0 } }  // Bottom
    ];

    const cube: Shape3D = {
      id: `cube_${Date.now()}`,
      type: '3d-cube',
      vertices,
      faces,
      material: {
        color: '#3b82f6',
        opacity: 0.8,
        wireframe: false,
        shininess: 30,
        reflectivity: 0.1,
        ...material
      }
    };

    this.addShape(cube);
    return cube;
  }

  public addSphere(center: Vector3D, radius: number, segments: number = 16, material?: Partial<Material3D>): Shape3D {
    const vertices: Vector3D[] = [];
    const faces: Face3D[] = [];

    // Generate sphere vertices
    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat * Math.PI) / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon * 2 * Math.PI) / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        vertices.push({
          x: center.x + radius * sinTheta * cosPhi,
          y: center.y + radius * cosTheta,
          z: center.z + radius * sinTheta * sinPhi
        });
      }
    }

    // Generate sphere faces
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const first = lat * (segments + 1) + lon;
        const second = first + segments + 1;

        // Create triangular faces
        faces.push({
          vertices: [first, second, first + 1],
          normal: this.calculateNormal(vertices[first], vertices[second], vertices[first + 1])
        });

        faces.push({
          vertices: [second, second + 1, first + 1],
          normal: this.calculateNormal(vertices[second], vertices[second + 1], vertices[first + 1])
        });
      }
    }

    const sphere: Shape3D = {
      id: `sphere_${Date.now()}`,
      type: '3d-sphere',
      vertices,
      faces,
      material: {
        color: '#ef4444',
        opacity: 0.9,
        wireframe: false,
        shininess: 50,
        reflectivity: 0.2,
        ...material
      }
    };

    this.addShape(sphere);
    return sphere;
  }

  public addPyramid(base: Vector3D[], apex: Vector3D, material?: Partial<Material3D>): Shape3D {
    const vertices: Vector3D[] = [...base, apex];
    const faces: Face3D[] = [];

    // Base face
    faces.push({
      vertices: base.map((_, i) => i),
      normal: this.calculatePolygonNormal(base)
    });

    // Side faces
    for (let i = 0; i < base.length; i++) {
      const next = (i + 1) % base.length;
      faces.push({
        vertices: [i, next, base.length], // apex is last vertex
        normal: this.calculateNormal(vertices[i], vertices[next], apex)
      });
    }

    const pyramid: Shape3D = {
      id: `pyramid_${Date.now()}`,
      type: '3d-pyramid',
      vertices,
      faces,
      material: {
        color: '#10b981',
        opacity: 0.8,
        wireframe: false,
        shininess: 20,
        reflectivity: 0.05,
        ...material
      }
    };

    this.addShape(pyramid);
    return pyramid;
  }

  /**
   * Matrix operations for 3D transformations
   */
  private createMatrix(elements: number[][]): Matrix3D {
    return { elements };
  }


  private createPerspectiveMatrix(): Matrix3D {
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const aspect = this.viewportWidth / this.viewportHeight;
    const f = 1.0 / Math.tan(fovRad / 2);

    return this.createMatrix([
      [f / aspect, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, (this.camera.far + this.camera.near) / (this.camera.near - this.camera.far), (2 * this.camera.far * this.camera.near) / (this.camera.near - this.camera.far)],
      [0, 0, -1, 0]
    ]);
  }

  private createViewMatrix(): Matrix3D {
    const { position, target, up } = this.camera;

    // Calculate camera basis vectors
    const forward = this.normalize(this.subtract(target, position));
    const right = this.normalize(this.cross(forward, up));
    const actualUp = this.cross(right, forward);

    return this.createMatrix([
      [right.x, actualUp.x, -forward.x, 0],
      [right.y, actualUp.y, -forward.y, 0],
      [right.z, actualUp.z, -forward.z, 0],
      [-this.dot(right, position), -this.dot(actualUp, position), this.dot(forward, position), 1]
    ]);
  }

  private updateMatrices(): void {
    this.projectionMatrix = this.createPerspectiveMatrix();
    this.viewMatrix = this.createViewMatrix();
  }

  /**
   * Vector operations
   */
  private add(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  private subtract(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private multiply(v: Vector3D, scalar: number): Vector3D {
    return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
  }

  private dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  private length(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private normalize(v: Vector3D): Vector3D {
    const len = this.length(v);
    return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : { x: 0, y: 0, z: 0 };
  }

  private calculateNormal(a: Vector3D, b: Vector3D, c: Vector3D): Vector3D {
    const ab = this.subtract(b, a);
    const ac = this.subtract(c, a);
    return this.normalize(this.cross(ab, ac));
  }

  private calculatePolygonNormal(vertices: Vector3D[]): Vector3D {
    if (vertices.length < 3) return { x: 0, y: 1, z: 0 };
    return this.calculateNormal(vertices[0], vertices[1], vertices[2]);
  }

  /**
   * Projection and rendering
   */
  private projectPoint(point: Vector3D): { x: number; y: number; z: number } {
    // Apply view matrix
    const viewPoint = this.transformPoint(point, this.viewMatrix);

    // Apply projection matrix
    const projectedPoint = this.transformPoint(viewPoint, this.projectionMatrix);

    // Perspective division
    if (projectedPoint.z !== 0) {
      projectedPoint.x /= projectedPoint.z;
      projectedPoint.y /= projectedPoint.z;
    }

    // Convert to screen coordinates
    return {
      x: (projectedPoint.x + 1) * 0.5 * this.viewportWidth,
      y: (1 - projectedPoint.y) * 0.5 * this.viewportHeight,
      z: projectedPoint.z
    };
  }

  private transformPoint(point: Vector3D, matrix: Matrix3D): Vector3D {
    const { x, y, z } = point;
    const w = 1;

    return {
      x: matrix.elements[0][0] * x + matrix.elements[0][1] * y + matrix.elements[0][2] * z + matrix.elements[0][3] * w,
      y: matrix.elements[1][0] * x + matrix.elements[1][1] * y + matrix.elements[1][2] * z + matrix.elements[1][3] * w,
      z: matrix.elements[2][0] * x + matrix.elements[2][1] * y + matrix.elements[2][2] * z + matrix.elements[2][3] * w
    };
  }

  /**
   * Lighting calculations
   */
  private calculateLighting(point: Vector3D, normal: Vector3D, material: Material3D): string {
    let totalLight = { r: 0, g: 0, b: 0 };

    this.lights.forEach(light => {
      const lightContribution = this.calculateLightContribution(point, normal, light, material);
      totalLight.r += lightContribution.r;
      totalLight.g += lightContribution.g;
      totalLight.b += lightContribution.b;
    });

    // Clamp values
    totalLight.r = Math.min(255, Math.max(0, totalLight.r));
    totalLight.g = Math.min(255, Math.max(0, totalLight.g));
    totalLight.b = Math.min(255, Math.max(0, totalLight.b));

    return `rgb(${Math.round(totalLight.r)}, ${Math.round(totalLight.g)}, ${Math.round(totalLight.b)})`;
  }

  private calculateLightContribution(point: Vector3D, normal: Vector3D, light: Light3D, material: Material3D): { r: number; g: number; b: number } {
    const materialColor = this.parseColor(material.color);
    const lightColor = this.parseColor(light.color);

    let intensity = 0;

    switch (light.type) {
      case 'ambient':
        intensity = light.intensity;
        break;

      case 'directional':
        if (light.direction) {
          const lightDir = this.normalize(this.multiply(light.direction, -1));
          intensity = Math.max(0, this.dot(normal, lightDir)) * light.intensity;
        }
        break;

      case 'point':
        if (light.position) {
          const lightDir = this.normalize(this.subtract(light.position, point));
          intensity = Math.max(0, this.dot(normal, lightDir)) * light.intensity;
        }
        break;
    }

    return {
      r: materialColor.r * lightColor.r * intensity / 255,
      g: materialColor.g * lightColor.g * intensity / 255,
      b: materialColor.b * lightColor.b * intensity / 255
    };
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    // Simple hex color parser
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    };
  }

  /**
   * Main rendering pipeline
   */
  public render(): void {
    this.canvas.selectAll('*').remove();

    // Sort shapes by depth (painter's algorithm)
    const sortedShapes = this.shapes.map(shape => ({
      shape,
      depth: this.calculateShapeDepth(shape)
    })).sort((a, b) => b.depth - a.depth);

    sortedShapes.forEach(({ shape }) => {
      this.renderShape(shape);
    });
  }

  private calculateShapeDepth(shape: Shape3D): number {
    // Calculate average z-coordinate after transformation
    let totalZ = 0;
    shape.vertices.forEach(vertex => {
      const projected = this.projectPoint(vertex);
      totalZ += projected.z;
    });
    return totalZ / shape.vertices.length;
  }

  private renderShape(shape: Shape3D): void {
    if (!shape.faces) return;

    const shapeGroup = this.canvas.append('g')
      .attr('id', shape.id)
      .classed('shape-3d', true);

    shape.faces.forEach((face, faceIndex) => {
      this.renderFace(shapeGroup, shape, face, faceIndex);
    });

    if (shape.material?.wireframe) {
      this.renderWireframe(shapeGroup, shape);
    }
  }

  private renderFace(parent: d3.Selection<SVGGElement, unknown, HTMLElement, any>, shape: Shape3D, face: Face3D, faceIndex: number): void {
    const projectedVertices = face.vertices.map(vertexIndex =>
      this.projectPoint(shape.vertices[vertexIndex])
    );

    // Check if face is facing camera (back-face culling)
    if (!this.isFacingCamera(projectedVertices)) return;

    // Calculate face center for lighting
    const faceCenter = this.calculateFaceCenter(face.vertices.map(i => shape.vertices[i]));
    const lightColor = shape.material ?
      this.calculateLighting(faceCenter, face.normal, shape.material) :
      '#cccccc';

    const pathData = this.createPathFromVertices(projectedVertices);

    parent.append('path')
      .attr('d', pathData)
      .attr('fill', lightColor)
      .attr('stroke', shape.material?.wireframe ? '#333333' : 'none')
      .attr('stroke-width', shape.material?.wireframe ? 1 : 0)
      .attr('opacity', shape.material?.opacity || 1)
      .classed(`face-${faceIndex}`, true);
  }

  private renderWireframe(parent: d3.Selection<SVGGElement, unknown, HTMLElement, any>, shape: Shape3D): void {
    if (!shape.faces) return;

    const wireframeGroup = parent.append('g').classed('wireframe', true);

    shape.faces.forEach(face => {
      for (let i = 0; i < face.vertices.length; i++) {
        const current = this.projectPoint(shape.vertices[face.vertices[i]]);
        const next = this.projectPoint(shape.vertices[face.vertices[(i + 1) % face.vertices.length]]);

        wireframeGroup.append('line')
          .attr('x1', current.x)
          .attr('y1', current.y)
          .attr('x2', next.x)
          .attr('y2', next.y)
          .attr('stroke', '#333333')
          .attr('stroke-width', 1);
      }
    });
  }

  private isFacingCamera(vertices: { x: number; y: number; z: number }[]): boolean {
    if (vertices.length < 3) return true;

    // Calculate face normal in screen space
    const v1 = { x: vertices[1].x - vertices[0].x, y: vertices[1].y - vertices[0].y };
    const v2 = { x: vertices[2].x - vertices[0].x, y: vertices[2].y - vertices[0].y };

    // Cross product z-component
    const crossZ = v1.x * v2.y - v1.y * v2.x;

    return crossZ > 0; // Face is facing camera if normal points towards us
  }

  private calculateFaceCenter(vertices: Vector3D[]): Vector3D {
    const center = { x: 0, y: 0, z: 0 };
    vertices.forEach(vertex => {
      center.x += vertex.x;
      center.y += vertex.y;
      center.z += vertex.z;
    });
    center.x /= vertices.length;
    center.y /= vertices.length;
    center.z /= vertices.length;
    return center;
  }

  private createPathFromVertices(vertices: { x: number; y: number; z: number }[]): string {
    if (vertices.length === 0) return '';

    let path = `M ${vertices[0].x} ${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i].x} ${vertices[i].y}`;
    }
    path += ' Z';
    return path;
  }

  /**
   * Camera controls
   */
  public setCamera(camera: Partial<Camera3D>): void {
    this.camera = { ...this.camera, ...camera };
    this.updateMatrices();
    this.render();
  }

  public orbitCamera(deltaTheta: number, deltaPhi: number): void {
    const distance = this.length(this.subtract(this.camera.position, this.camera.target));

    // Convert to spherical coordinates
    const direction = this.normalize(this.subtract(this.camera.position, this.camera.target));
    let theta = Math.atan2(direction.x, direction.z);
    let phi = Math.acos(direction.y);

    // Apply deltas
    theta += deltaTheta;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaPhi));

    // Convert back to Cartesian
    const newPosition = {
      x: this.camera.target.x + distance * Math.sin(phi) * Math.sin(theta),
      y: this.camera.target.y + distance * Math.cos(phi),
      z: this.camera.target.z + distance * Math.sin(phi) * Math.cos(theta)
    };

    this.setCamera({ position: newPosition });
  }

  public zoomCamera(factor: number): void {
    const direction = this.normalize(this.subtract(this.camera.position, this.camera.target));
    const distance = this.length(this.subtract(this.camera.position, this.camera.target));
    const newDistance = Math.max(1, distance * factor);

    const newPosition = this.add(this.camera.target, this.multiply(direction, newDistance));
    this.setCamera({ position: newPosition });
  }

  /**
   * Event handlers for interaction
   */
  private setupEventHandlers(): void {
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    this.canvas
      .on('mousedown', (event) => {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
      })
      .on('mousemove', (event) => {
        if (!isDragging) return;

        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;

        this.orbitCamera(deltaX * 0.01, deltaY * 0.01);

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
      })
      .on('mouseup', () => {
        isDragging = false;
      })
      .on('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
        this.zoomCamera(zoomFactor);
      });
  }

  /**
   * Animation support
   */
  public animateShape(shapeId: string, animation: {
    property: 'rotation' | 'translation' | 'scale';
    from: Vector3D;
    to: Vector3D;
    duration: number;
    easing?: string;
  }): void {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (!shape) return;

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      // Apply easing
      const easedProgress = this.applyEasing(progress, animation.easing || 'linear');

      // Interpolate between from and to
      const current = {
        x: animation.from.x + (animation.to.x - animation.from.x) * easedProgress,
        y: animation.from.y + (animation.to.y - animation.from.y) * easedProgress,
        z: animation.from.z + (animation.to.z - animation.from.z) * easedProgress
      };

      // Apply transformation
      this.applyTransformation(shape, animation.property, current);
      this.render();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in': return t * t;
      case 'ease-out': return 1 - (1 - t) * (1 - t);
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default: return t; // linear
    }
  }

  private applyTransformation(shape: Shape3D, property: string, value: Vector3D): void {
    if (!shape.transform) {
      shape.transform = {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
    }

    switch (property) {
      case 'translation':
        shape.transform.translation = value;
        break;
      case 'rotation':
        shape.transform.rotation = value;
        break;
      case 'scale':
        shape.transform.scale = value;
        break;
    }

    // Apply transformations to vertices (simplified)
    // In a full implementation, you'd apply the transformation matrix
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.canvas.remove();
    this.shapes = [];
  }
}