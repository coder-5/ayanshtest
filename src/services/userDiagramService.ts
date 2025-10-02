import { UserDiagram, DiagramListResponse } from '@/types/diagram';

export class UserDiagramService {
  /**
   * Fetch user-uploaded diagrams for a specific question
   */
  static async getUserDiagrams(questionId: string): Promise<UserDiagram[]> {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/diagrams/upload?questionId=${questionId}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const result: DiagramListResponse = await response.json();


      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the preferred user diagram for a question
   */
  static async getPreferredDiagram(questionId: string): Promise<UserDiagram | null> {
    const diagrams = await this.getUserDiagrams(questionId);

    // Find the first approved and preferred diagram
    const approvedPreferred = diagrams.find(d => d.isApproved && d.isPreferred);
    if (approvedPreferred) {
      return approvedPreferred;
    }

    // If no approved preferred diagram, find any approved diagram
    const anyApproved = diagrams.find(d => d.isApproved);
    if (anyApproved) {
      return anyApproved;
    }

    // For testing: If no approved diagrams, show the most recent upload (pending approval)
    // This allows users to see their uploads immediately while waiting for approval
    const mostRecentPending = diagrams.find(d => d.isPreferred);
    return mostRecentPending || null;
  }

  /**
   * Delete a user diagram
   */
  static async deleteDiagram(diagramId: string, userId: string = 'ayansh'): Promise<boolean> {
    try {
      const response = await fetch(`/api/diagrams/upload?diagramId=${diagramId}&userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a question has any user-uploaded diagrams
   */
  static async hasUserDiagrams(questionId: string): Promise<boolean> {
    const diagrams = await this.getUserDiagrams(questionId);
    return diagrams.length > 0;
  }

  /**
   * Get diagram statistics for a question
   */
  static async getDiagramStats(questionId: string): Promise<{
    total: number;
    approved: number;
    pending: number;
  }> {
    const diagrams = await this.getUserDiagrams(questionId);

    return {
      total: diagrams.length,
      approved: diagrams.filter(d => d.isApproved).length,
      pending: diagrams.filter(d => !d.isApproved).length,
    };
  }
}

export default UserDiagramService;