import { useState, useEffect, useCallback } from 'react';
import { UserDiagramService } from '@/services/userDiagramService';
import { UserDiagram } from '@/types/diagram';

interface UseUserDiagramsResult {
  diagrams: UserDiagram[];
  preferredDiagram: UserDiagram | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasApprovedDiagrams: boolean;
}

export const useUserDiagrams = (questionId: string): UseUserDiagramsResult => {
  const [diagrams, setDiagrams] = useState<UserDiagram[]>([]);
  const [preferredDiagram, setPreferredDiagram] = useState<UserDiagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagrams = useCallback(async () => {
    if (!questionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [allDiagrams, preferred] = await Promise.all([
        UserDiagramService.getUserDiagrams(questionId),
        UserDiagramService.getPreferredDiagram(questionId)
      ]);

      setDiagrams(allDiagrams);
      setPreferredDiagram(preferred);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagrams');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const hasApprovedDiagrams = diagrams.some(d => d.isApproved);

  return {
    diagrams,
    preferredDiagram,
    loading,
    error,
    refetch: fetchDiagrams,
    hasApprovedDiagrams
  };
};

export default useUserDiagrams;