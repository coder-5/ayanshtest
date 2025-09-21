'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdvancedDiagramEngine, DiagramConfig } from '@/lib/diagram-engine/AdvancedDiagramEngine';
import { DiagramGenerator } from '@/lib/ai-diagram/DiagramGenerator';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Settings, Eye, EyeOff } from 'lucide-react';

interface InteractiveDiagramProps {
  questionText: string;
  config?: Partial<DiagramConfig>;
  onDiagramReady?: (engine: AdvancedDiagramEngine) => void;
  onShapeClick?: (shapeId: string, shapeData: any) => void;
  onMeasurementChange?: (measurement: string, value: number) => void;
  className?: string;
}

interface DiagramControls {
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  showGrid: boolean;
  showLabels: boolean;
  showMeasurements: boolean;
  animationSpeed: number;
  interactionMode: 'view' | 'measure' | 'construct' | 'analyze';
}

interface Measurement {
  id: string;
  type: 'length' | 'angle' | 'area' | 'ratio';
  value: number;
  unit: string;
  elements: string[];
  visible: boolean;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  questionText,
  config: userConfig = {},
  onDiagramReady,
  onShapeClick,
  onMeasurementChange,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AdvancedDiagramEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controls, setControls] = useState<DiagramControls>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    showGrid: true,
    showLabels: true,
    showMeasurements: true,
    animationSpeed: 1,
    interactionMode: 'view'
  });
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('pointer');
  const [diagramHistory, setDiagramHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const defaultConfig: DiagramConfig = {
    type: 'geometry-2d',
    interactive: true,
    animated: true,
    responsive: true,
    accessibility: {
      screenReaderSupport: true,
      highContrast: false,
      fontSize: 'medium',
      colorBlindFriendly: true,
      keyboardNavigation: true
    },
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      gridColor: '#e2e8f0',
      textColor: '#1e293b',
      accentColor: '#f59e0b',
      darkMode: false
    },
    data: {}
  };

  const finalConfig = { ...defaultConfig, ...userConfig };

  // Initialize diagram
  useEffect(() => {
    if (!containerRef.current || !questionText) return;

    const initializeDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Generate diagram from text using AI
        const generatedDiagram = await DiagramGenerator.generateFromText({
          problemText: questionText,
          context: {
            subject: 'geometry', // Could be inferred from questionText
            level: 'high-school',
            concepts: []
          },
          preferences: {
            style: 'detailed',
            colorScheme: 'colorful',
            precision: 'exact',
            animations: finalConfig.animated || false,
            interactivity: finalConfig.interactive || false
          }
        });

        // Create unique container ID
        const containerId = `diagram-${Date.now()}`;
        const containerElement = document.createElement('div');
        containerElement.id = containerId;
        if (containerRef.current) {
          containerRef.current.appendChild(containerElement);
        }

        // Initialize the advanced diagram engine
        const engine = new AdvancedDiagramEngine(containerId, {
          ...finalConfig,
          data: generatedDiagram
        });

        engineRef.current = engine;

        // Setup event listeners
        setupDiagramEvents(engine);

        // Initialize measurements
        initializeMeasurements(generatedDiagram);

        // Save initial state
        saveToHistory(engine.export('svg'));

        onDiagramReady?.(engine);
        setIsLoading(false);

      } catch (err) {
        console.error('Failed to initialize diagram:', err);
        setError(err instanceof Error ? err.message : 'Failed to create diagram');
        setIsLoading(false);
      }
    };

    initializeDiagram();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [questionText, finalConfig]);

  const setupDiagramEvents = (_engine: AdvancedDiagramEngine) => {
    // Setup custom event listeners for interactions
    const container = containerRef.current;
    if (!container) return;

    // Handle shape clicks
    container.addEventListener('click', (event) => {
      const target = event.target as Element;
      const shapeId = target.id;

      if (shapeId && onShapeClick) {
        const shapeData = extractShapeData(target);
        onShapeClick(shapeId, shapeData);
      }
    });

    // Handle measurement updates
    container.addEventListener('measurementchange', (event: any) => {
      const { measurement, value } = event.detail;
      onMeasurementChange?.(measurement, value);
      updateMeasurement(measurement, value);
    });
  };

  const extractShapeData = (element: Element): any => {
    // Extract shape properties from DOM element
    return {
      type: element.tagName.toLowerCase(),
      id: element.id,
      attributes: Array.from(element.attributes).reduce((acc, attr) => ({
        ...acc,
        [attr.name]: attr.value
      }), {})
    };
  };

  const initializeMeasurements = (diagramData: any) => {
    // Initialize measurements based on diagram data
    const initialMeasurements: Measurement[] = [];

    // Add length measurements
    if (diagramData.elements) {
      diagramData.elements.forEach((element: any, index: number) => {
        if (element.type === 'line') {
          initialMeasurements.push({
            id: `length_${index}`,
            type: 'length',
            value: calculateLength(element),
            unit: 'units',
            elements: [element.id],
            visible: true
          });
        }
      });
    }

    setMeasurements(initialMeasurements);
  };

  const calculateLength = (lineElement: any): number => {
    // Calculate length based on line properties
    const { x1, y1, x2, y2 } = lineElement.properties;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const updateMeasurement = (measurementId: string, newValue: number) => {
    setMeasurements(prev => prev.map(m =>
      m.id === measurementId ? { ...m, value: newValue } : m
    ));
  };

  const saveToHistory = (state: any) => {
    const newHistory = diagramHistory.slice(0, historyIndex + 1);
    newHistory.push(state);
    setDiagramHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Control handlers
  const handleZoom = useCallback((factor: number) => {
    if (!engineRef.current) return;

    const newZoom = Math.max(0.1, Math.min(5, controls.zoom * factor));
    setControls(prev => ({ ...prev, zoom: newZoom }));
    engineRef.current.zoom(factor);
  }, [controls.zoom]);


  const handleReset = useCallback(() => {
    if (!engineRef.current) return;

    setControls(prev => ({
      ...prev,
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotation: 0
    }));

    // Reset to initial state
    if (diagramHistory.length > 0) {
      const initialState = diagramHistory[0];
      engineRef.current.update({ data: initialState });
    }
  }, [diagramHistory]);

  const handleToggleAnimation = useCallback(() => {
    setIsAnimating(prev => {
      const newState = !prev;
      // Start/stop animations in the engine
      if (engineRef.current) {
        // Implementation would depend on engine API
      }
      return newState;
    });
  }, []);

  const handleExport = useCallback((format: 'svg' | 'png' | 'pdf') => {
    if (!engineRef.current) return;

    try {
      const exported = engineRef.current.export(format);

      if (typeof exported === 'string') {
        // SVG or text-based format
        const blob = new Blob([exported], { type: `image/${format}` });
        downloadBlob(blob, `diagram.${format}`);
      } else {
        // Binary format
        downloadBlob(exported, `diagram.${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToolChange = useCallback((tool: string) => {
    setSelectedTool(tool);
    if (engineRef.current) {
      // Update interaction mode in engine
      setControls(prev => ({
        ...prev,
        interactionMode: tool as any
      }));
    }
  }, []);

  const toggleMeasurements = useCallback(() => {
    setControls(prev => ({
      ...prev,
      showMeasurements: !prev.showMeasurements
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setControls(prev => ({
      ...prev,
      showGrid: !prev.showGrid
    }));
  }, []);

  const toggleLabels = useCallback(() => {
    setControls(prev => ({
      ...prev,
      showLabels: !prev.showLabels
    }));
  }, []);

  if (isLoading) {
    return (
      <div className={`diagram-loading flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating interactive diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`diagram-error p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-700 font-semibold mb-2">Diagram Generation Error</div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`interactive-diagram-container bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="diagram-toolbar flex flex-wrap items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {/* View Controls */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => handleZoom(1.2)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Tools */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
            {['pointer', 'measure', 'construct', 'analyze'].map(tool => (
              <button
                key={tool}
                onClick={() => handleToolChange(tool)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedTool === tool
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={tool.charAt(0).toUpperCase() + tool.slice(1)}
              >
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </button>
            ))}
          </div>

          {/* Animation Controls */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
            <button
              onClick={handleToggleAnimation}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title={isAnimating ? 'Pause Animation' : 'Play Animation'}
            >
              {isAnimating ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>

          {/* Display Toggles */}
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleGrid}
              className={`p-2 rounded ${
                controls.showGrid
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Toggle Grid"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 0h4v4H0V0zm6 0h4v4H6V0zm6 0h4v4h-4V0zM0 6h4v4H0V6zm6 0h4v4H6V6zm6 0h4v4h-4V6zM0 12h4v4H0v-4zm6 0h4v4H6v-4zm6 0h4v4h-4v-4z"/>
              </svg>
            </button>
            <button
              onClick={toggleLabels}
              className={`p-2 rounded ${
                controls.showLabels
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Toggle Labels"
            >
              {controls.showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              onClick={toggleMeasurements}
              className={`p-2 rounded ${
                controls.showMeasurements
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Toggle Measurements"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleExport('svg')}
            className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            Export SVG
          </button>
          <button
            onClick={() => handleExport('png')}
            className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            Export PNG
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="diagram-content flex">
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="diagram-canvas w-full h-96 bg-white overflow-hidden"
            style={{ minHeight: '400px' }}
          />

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 border">
            {Math.round(controls.zoom * 100)}%
          </div>
        </div>

        {/* Measurements Panel */}
        {controls.showMeasurements && measurements.length > 0 && (
          <div className="w-64 border-l border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Measurements</h3>
            <div className="space-y-2">
              {measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="bg-white p-3 rounded border text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {measurement.type}
                    </span>
                    <button
                      onClick={() => updateMeasurement(measurement.id, measurement.value)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                  <div className="text-gray-600">
                    {measurement.value.toFixed(2)} {measurement.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="diagram-status flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div>
          Mode: {controls.interactionMode} | Tool: {selectedTool}
        </div>
        <div>
          Position: ({controls.pan.x.toFixed(0)}, {controls.pan.y.toFixed(0)})
        </div>
      </div>
    </div>
  );
};

export default InteractiveDiagram;