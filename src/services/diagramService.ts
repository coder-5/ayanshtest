/**
 * DIAGRAM SERVICE - COMPLETELY DISABLED
 *
 * All diagram generation functionality has been disabled.
 * Users will upload diagrams manually via the diagram upload feature.
 */

export class DiagramService {
  /**
   * Generate SVG diagram based on problem text analysis
   * DISABLED: User will provide all diagrams via upload
   */
  static generateDiagram(_questionText: string): string | null {
    // All diagram generation is disabled - user will upload diagrams manually
    return null;
  }

  /**
   * Check if a problem likely needs a diagram
   * DISABLED: User will provide all diagrams via upload
   */
  static needsDiagram(_questionText: string): boolean {
    // All auto-diagram generation is disabled - user will upload diagrams manually
    return false;
  }
}