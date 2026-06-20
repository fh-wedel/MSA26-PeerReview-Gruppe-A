import {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {matchingApiClient} from '../api/clients';

export interface Assignment {
  submissionId: string;
  assignedAt: string;
}

export const useAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      const roles = (user?.roles || []).map(r => r.toLowerCase());
      const isReviewer = roles.includes('reviewer') || roles.includes('admin');

      if (!user?.username || !isReviewer) {
        setLoading(false);
        return;
      }

      try {
        const response = await matchingApiClient.matches.getMatchesByExaminer(user.username);

        if (!response.ok) {
          if (response.status === 404) {
            setAssignments([]);
            return;
          }
          throw new Error(`Failed to fetch assignments: ${response.statusText}`);
        }

        setAssignments(response.data.assignments || []);
      } catch (err: any) {
        if (err.status === 404) {
          setAssignments([]);
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.username]);

  return { assignments, loading, error };
};
