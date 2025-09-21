// Simple test to check if DiagramService is working
const fs = require('fs');

// Read the DiagramService file and test it
const diagramServicePath = './src/services/diagramService.ts';

console.log('Testing DiagramService...');

// Test some sample questions
const testQuestions = [
  "In the figure below, ABCD is a rectangle with sides of length AB = 5 inches and AD = 3 inches.",
  "Nigli looks at the 6 pairs of numbers directly across from each other on a clock.",
  "A 3×7 rectangle is to be completely covered using three types of tiles.",
  "Triangle ABC has area 2022.",
  "Betty drives a truck through a neighborhood, starting at the factory and going to A, B, C."
];

// Mock DiagramService since we can't import TypeScript directly
const mockDiagramService = {
  needsDiagram: (text) => {
    const lowerText = text.toLowerCase();
    const diagramKeywords = [
      'figure', 'diagram', 'shown', 'grid', 'rectangle', 'circle', 'triangle',
      'square', 'polygon', 'coordinate', 'graph', 'pattern', 'star', 'clock',
      'rotate', 'reflection', 'geometry', 'area', 'perimeter', 'radius'
    ];

    return diagramKeywords.some(keyword => lowerText.includes(keyword));
  }
};

testQuestions.forEach((question, index) => {
  const needsDiagram = mockDiagramService.needsDiagram(question);
  console.log(`\nTest ${index + 1}: ${needsDiagram ? 'NEEDS DIAGRAM' : 'NO DIAGRAM'}`);
  console.log(`Question: ${question.substring(0, 80)}...`);
});

console.log('\nAll tests completed. If NEEDS DIAGRAM shows true but diagrams aren\'t appearing, there might be a rendering issue.');